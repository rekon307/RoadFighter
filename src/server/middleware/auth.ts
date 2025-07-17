import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../services/database.js';
import { cache } from '../services/redis.js';
import { CACHE_KEYS, CACHE_TTL, ERROR_CODES } from '../../shared/constants/index.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        whopUserId: string;
        username: string;
      };
    }
  }
}

const tokenSchema = z.object({
  userId: z.string(),
  whopUserId: z.string(),
  iat: z.number(),
  exp: z.number(),
});

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: ERROR_CODES.UNAUTHORIZED,
        message: 'Access token required',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET not configured');
      res.status(500).json({
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Authentication service unavailable',
      });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      res.status(401).json({
        error: ERROR_CODES.INVALID_TOKEN,
        message: 'Invalid or expired token',
      });
      return;
    }

    // Validate token payload
    const tokenData = tokenSchema.safeParse(decoded);
    if (!tokenData.success) {
      res.status(401).json({
        error: ERROR_CODES.INVALID_TOKEN,
        message: 'Invalid token format',
      });
      return;
    }

    const { userId, whopUserId } = tokenData.data;

    // Check cache first
    const cacheKey = CACHE_KEYS.USER_PROFILE(userId);
    let user = await cache.get(cacheKey);

    if (!user) {
      // Fetch user from database
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          whopUserId: true,
          username: true,
          creditsBalance: true,
          tokensRemaining: true,
          lastTokenReset: true,
        },
      });

      if (!user) {
        res.status(401).json({
          error: ERROR_CODES.USER_NOT_FOUND,
          message: 'User not found',
        });
        return;
      }

      // Cache user data
      await cache.set(cacheKey, user, CACHE_TTL.USER_PROFILE);
    }

    // Verify whopUserId matches
    if (user.whopUserId !== whopUserId) {
      res.status(401).json({
        error: ERROR_CODES.INVALID_TOKEN,
        message: 'Token user mismatch',
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      whopUserId: user.whopUserId,
      username: user.username,
    };

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({
      error: ERROR_CODES.INTERNAL_ERROR,
      message: 'Authentication service error',
    });
  }
}

// Optional auth middleware for public endpoints
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      next();
      return;
    }

    // Try to authenticate, but don't fail if invalid
    await authMiddleware(req, res, (error) => {
      if (error) {
        // Clear any partially set user data and continue
        req.user = undefined;
      }
      next();
    });
  } catch (error) {
    // Ignore auth errors for optional auth
    req.user = undefined;
    next();
  }
}

// Middleware to check if user has sufficient tokens
export async function requireTokens(
  requiredTokens: number = 1
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        });
        return;
      }

      const { id: userId } = req.user;

      // Get current token count
      const cacheKey = CACHE_KEYS.USER_TOKENS(userId);
      let tokenData = await cache.get<{ tokens: number; lastReset: string }>(cacheKey);

      if (!tokenData) {
        // Fetch from database
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            tokensRemaining: true,
            lastTokenReset: true,
          },
        });

        if (!user) {
          res.status(401).json({
            error: ERROR_CODES.USER_NOT_FOUND,
            message: 'User not found',
          });
          return;
        }

        tokenData = {
          tokens: user.tokensRemaining,
          lastReset: user.lastTokenReset.toISOString(),
        };

        // Cache token data
        await cache.set(cacheKey, tokenData, CACHE_TTL.USER_TOKENS);
      }

      // Check if user has enough tokens
      if (tokenData.tokens < requiredTokens) {
        res.status(403).json({
          error: ERROR_CODES.NO_TOKENS_REMAINING,
          message: `Insufficient tokens. Required: ${requiredTokens}, Available: ${tokenData.tokens}`,
          data: {
            required: requiredTokens,
            available: tokenData.tokens,
            nextReset: getNextTokenReset(),
          },
        });
        return;
      }

      next();
    } catch (error) {
      console.error('❌ Token check middleware error:', error);
      res.status(500).json({
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Token validation service error',
      });
    }
  };
}

// Middleware to check if user has sufficient credits
export async function requireCredits(requiredAmount: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        });
        return;
      }

      const { id: userId } = req.user;

      // Get current credit balance
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { creditsBalance: true },
      });

      if (!user) {
        res.status(401).json({
          error: ERROR_CODES.USER_NOT_FOUND,
          message: 'User not found',
        });
        return;
      }

      const balance = parseFloat(user.creditsBalance.toString());

      if (balance < requiredAmount) {
        res.status(403).json({
          error: ERROR_CODES.INSUFFICIENT_CREDITS,
          message: `Insufficient credits. Required: $${requiredAmount.toFixed(2)}, Available: $${balance.toFixed(2)}`,
          data: {
            required: requiredAmount,
            available: balance,
            deficit: requiredAmount - balance,
          },
        });
        return;
      }

      next();
    } catch (error) {
      console.error('❌ Credit check middleware error:', error);
      res.status(500).json({
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Credit validation service error',
      });
    }
  };
}

// Helper function to calculate next token reset time
function getNextTokenReset(): string {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

// Helper function to generate JWT token
export function generateToken(userId: string, whopUserId: string): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      userId,
      whopUserId,
    },
    jwtSecret,
    {
      expiresIn,
      issuer: 'multiplayer-road-fighter',
      audience: 'whop-platform',
    }
  );
}

// Helper function to validate Whop webhook signature
export function validateWhopWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const signature = req.headers['x-whop-signature'] as string;
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('❌ WHOP_WEBHOOK_SECRET not configured');
      res.status(500).json({
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Webhook service unavailable',
      });
      return;
    }

    if (!signature) {
      res.status(401).json({
        error: ERROR_CODES.UNAUTHORIZED,
        message: 'Webhook signature required',
      });
      return;
    }

    // TODO: Implement Whop signature validation
    // This would typically involve HMAC verification with the webhook secret
    
    next();
  } catch (error) {
    console.error('❌ Webhook validation error:', error);
    res.status(500).json({
      error: ERROR_CODES.INTERNAL_ERROR,
      message: 'Webhook validation error',
    });
  }
}