import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/database.js';
import { cache } from '../services/redis.js';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.js';
import { CACHE_KEYS, CACHE_TTL, TOKEN_CONFIG } from '../../shared/constants/index.js';
import { UserProfileResponse } from '../../shared/types/index.js';

const router = Router();

// Get user profile
router.get('/profile', asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  // Try cache first
  const cacheKey = CACHE_KEYS.USER_PROFILE(userId);
  let user = await cache.get(cacheKey);

  if (!user) {
    // Fetch from database with stats
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        participations: {
          select: {
            score: true,
            placement: true,
            session: {
              select: {
                entryFee: true,
              },
            },
          },
        },
        transactions: {
          where: {
            transactionType: 'PRIZE_PAYOUT',
            status: 'COMPLETED',
          },
          select: {
            amount: true,
          },
        },
      },
    });

    if (!userData) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    // Calculate user stats
    const totalGames = userData.participations.length;
    const totalWins = userData.participations.filter(p => p.placement === 1).length;
    const totalEarnings = userData.transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const bestScore = Math.max(...userData.participations.map(p => p.score), 0);
    const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

    const response: UserProfileResponse = {
      user: {
        id: userData.id,
        whopUserId: userData.whopUserId,
        username: userData.username,
        creditsBalance: parseFloat(userData.creditsBalance.toString()),
        tokensRemaining: userData.tokensRemaining,
        lastTokenReset: userData.lastTokenReset,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
      stats: {
        totalGames,
        totalWins,
        totalEarnings,
        bestScore,
        winRate: Math.round(winRate * 100) / 100,
      },
    };

    // Cache the response
    await cache.set(cacheKey, response, CACHE_TTL.USER_PROFILE);
    user = response;
  }

  res.json(user);
}));

// Get user token status
router.get('/tokens', asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  // Check cache first
  const cacheKey = CACHE_KEYS.USER_TOKENS(userId);
  let tokenData = await cache.get(cacheKey);

  if (!tokenData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        tokensRemaining: true,
        lastTokenReset: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    tokenData = {
      tokensRemaining: user.tokensRemaining,
      lastTokenReset: user.lastTokenReset,
      maxTokens: TOKEN_CONFIG.DAILY_TOKEN_COUNT,
      nextReset: getNextTokenReset(),
    };

    // Cache token data
    await cache.set(cacheKey, tokenData, CACHE_TTL.USER_TOKENS);
  }

  res.json(tokenData);
}));

// Reset daily tokens (admin only or scheduled)
router.post('/tokens/reset', asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  // Check if it's time for reset (should be called at midnight UTC)
  const now = new Date();
  const lastMidnight = new Date(now);
  lastMidnight.setUTCHours(0, 0, 0, 0);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      lastTokenReset: true,
      tokensRemaining: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      error: 'USER_NOT_FOUND',
      message: 'User not found',
    });
  }

  // Check if tokens were already reset today
  const lastReset = new Date(user.lastTokenReset);
  if (lastReset >= lastMidnight) {
    return res.status(400).json({
      error: 'TOKENS_ALREADY_RESET',
      message: 'Tokens already reset today',
      data: {
        tokensRemaining: user.tokensRemaining,
        lastReset: user.lastTokenReset,
        nextReset: getNextTokenReset(),
      },
    });
  }

  // Reset tokens
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      tokensRemaining: TOKEN_CONFIG.DAILY_TOKEN_COUNT,
      lastTokenReset: now,
    },
    select: {
      tokensRemaining: true,
      lastTokenReset: true,
    },
  });

  // Update cache
  const cacheKey = CACHE_KEYS.USER_TOKENS(userId);
  const tokenData = {
    tokensRemaining: updatedUser.tokensRemaining,
    lastTokenReset: updatedUser.lastTokenReset,
    maxTokens: TOKEN_CONFIG.DAILY_TOKEN_COUNT,
    nextReset: getNextTokenReset(),
  };
  await cache.set(cacheKey, tokenData, CACHE_TTL.USER_TOKENS);

  res.json({
    success: true,
    message: 'Tokens reset successfully',
    data: tokenData,
  });
}));

// Update user profile
const updateProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional(),
});

router.put('/profile', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const validation = updateProfileSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError('Invalid profile data', validation.error.errors);
  }

  const { username } = validation.data;

  // Check if username is already taken (if provided)
  if (username) {
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        id: { not: userId },
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'USERNAME_TAKEN',
        message: 'Username is already taken',
      });
    }
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(username && { username }),
      updatedAt: new Date(),
    },
    select: {
      id: true,
      whopUserId: true,
      username: true,
      creditsBalance: true,
      tokensRemaining: true,
      lastTokenReset: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Invalidate cache
  const cacheKey = CACHE_KEYS.USER_PROFILE(userId);
  await cache.del(cacheKey);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      ...updatedUser,
      creditsBalance: parseFloat(updatedUser.creditsBalance.toString()),
    },
  });
}));

// Get user game history
router.get('/history', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [participations, total] = await Promise.all([
    prisma.gameParticipant.findMany({
      where: { userId },
      include: {
        session: {
          select: {
            id: true,
            entryFee: true,
            createdAt: true,
            startedAt: true,
            endedAt: true,
            maxPlayers: true,
            currentPlayers: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.gameParticipant.count({
      where: { userId },
    }),
  ]);

  const history = participations.map(p => ({
    id: p.id,
    sessionId: p.sessionId,
    score: p.score,
    distanceTraveled: parseFloat(p.distanceTraveled.toString()),
    survivalTime: p.survivalTime,
    placement: p.placement,
    joinedAt: p.joinedAt,
    finishedAt: p.finishedAt,
    session: {
      ...p.session,
      entryFee: parseFloat(p.session.entryFee.toString()),
    },
  }));

  res.json({
    history,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  });
}));

// Helper function to get next token reset time
function getNextTokenReset(): string {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

export default router;