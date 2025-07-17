import { prisma, checkDatabaseHealth } from '../server/services/database.js';

describe('Database Operations', () => {
  beforeAll(async () => {
    // Ensure database connection is established
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up test data and disconnect
    await prisma.$disconnect();
  });

  describe('Database Connection', () => {
    test('should connect to database successfully', async () => {
      const isHealthy = await checkDatabaseHealth();
      expect(isHealthy).toBe(true);
    });

    test('should execute raw queries', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Game Configuration', () => {
    test('should have initial game configuration', async () => {
      const configs = await prisma.gameConfig.findMany();
      expect(configs.length).toBeGreaterThan(0);
      
      const configKeys = configs.map(c => c.key);
      expect(configKeys).toContain('MIN_ENTRY_FEE');
      expect(configKeys).toContain('MAX_ENTRY_FEE');
      expect(configKeys).toContain('DAILY_TOKEN_COUNT');
    });

    test('should retrieve specific configuration values', async () => {
      const minFeeConfig = await prisma.gameConfig.findUnique({
        where: { key: 'MIN_ENTRY_FEE' }
      });
      
      expect(minFeeConfig).toBeDefined();
      expect(minFeeConfig?.value).toBe('1.00');
      expect(minFeeConfig?.category).toBe('payment');
    });
  });

  describe('User Operations', () => {
    const testUser = {
      whopUserId: 'test_whop_user_' + Date.now(),
      username: 'test_user_' + Date.now(),
      creditsBalance: 100.0,
      tokensRemaining: 3
    };

    afterEach(async () => {
      // Clean up test user
      try {
        await prisma.user.deleteMany({
          where: { whopUserId: { startsWith: 'test_whop_user_' } }
        });
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    test('should create user successfully', async () => {
      const user = await prisma.user.create({
        data: testUser
      });

      expect(user).toBeDefined();
      expect(user.whopUserId).toBe(testUser.whopUserId);
      expect(user.username).toBe(testUser.username);
      expect(user.id).toBeDefined();
    });

    test('should enforce unique whopUserId constraint', async () => {
      await prisma.user.create({ data: testUser });
      
      await expect(prisma.user.create({ 
        data: { ...testUser, username: 'different_username' }
      })).rejects.toThrow();
    });

    test('should update user fields', async () => {
      const user = await prisma.user.create({ data: testUser });
      
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { tokensRemaining: 2 }
      });

      expect(updatedUser.tokensRemaining).toBe(2);
    });

    test('should find user by whopUserId', async () => {
      await prisma.user.create({ data: testUser });
      
      const foundUser = await prisma.user.findUnique({
        where: { whopUserId: testUser.whopUserId }
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.username).toBe(testUser.username);
    });
  });

  describe('Game Session Operations', () => {
    let testUserId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          whopUserId: 'test_session_user_' + Date.now(),
          username: 'session_test_user',
          creditsBalance: 100.0,
          tokensRemaining: 3
        }
      });
      testUserId = user.id;
    });

    afterEach(async () => {
      // Clean up test data
      await prisma.gameParticipant.deleteMany({
        where: { user: { whopUserId: { startsWith: 'test_session_user_' } } }
      });
      await prisma.gameSession.deleteMany({
        where: { creator: { whopUserId: { startsWith: 'test_session_user_' } } }
      });
      await prisma.user.deleteMany({
        where: { whopUserId: { startsWith: 'test_session_user_' } }
      });
    });

    test('should create game session', async () => {
      const session = await prisma.gameSession.create({
        data: {
          creatorId: testUserId,
          entryFee: 10.00,
          maxPlayers: 4,
          status: 'WAITING'
        }
      });

      expect(session).toBeDefined();
      expect(session.creatorId).toBe(testUserId);
      expect(session.entryFee.toString()).toBe('10');
      expect(session.status).toBe('WAITING');
    });

    test('should add participants to session', async () => {
      const session = await prisma.gameSession.create({
        data: {
          creatorId: testUserId,
          entryFee: 5.00,
          maxPlayers: 8
        }
      });

      const participant = await prisma.gameParticipant.create({
        data: {
          sessionId: session.id,
          userId: testUserId,
          score: 0
        }
      });

      expect(participant).toBeDefined();
      expect(participant.sessionId).toBe(session.id);
      expect(participant.userId).toBe(testUserId);
    });

    test('should enforce unique participant per session', async () => {
      const session = await prisma.gameSession.create({
        data: {
          creatorId: testUserId,
          entryFee: 5.00,
          maxPlayers: 8
        }
      });

      await prisma.gameParticipant.create({
        data: {
          sessionId: session.id,
          userId: testUserId,
          score: 0
        }
      });

      await expect(prisma.gameParticipant.create({
        data: {
          sessionId: session.id,
          userId: testUserId,
          score: 100
        }
      })).rejects.toThrow();
    });
  });

  describe('Transaction Operations', () => {
    let testUserId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          whopUserId: 'test_transaction_user_' + Date.now(),
          username: 'transaction_test_user',
          creditsBalance: 100.0,
          tokensRemaining: 3
        }
      });
      testUserId = user.id;
    });

    afterEach(async () => {
      await prisma.transaction.deleteMany({
        where: { user: { whopUserId: { startsWith: 'test_transaction_user_' } } }
      });
      await prisma.user.deleteMany({
        where: { whopUserId: { startsWith: 'test_transaction_user_' } }
      });
    });

    test('should create transaction record', async () => {
      const transaction = await prisma.transaction.create({
        data: {
          userId: testUserId,
          amount: 10.00,
          transactionType: 'ENTRY_FEE',
          status: 'COMPLETED'
        }
      });

      expect(transaction).toBeDefined();
      expect(transaction.amount.toString()).toBe('10');
      expect(transaction.transactionType).toBe('ENTRY_FEE');
    });

    test('should handle different transaction types', async () => {
      const types = ['ENTRY_FEE', 'PRIZE_PAYOUT', 'DEVELOPER_SPLIT', 'CREATOR_SPLIT'];
      
      for (const type of types) {
        const transaction = await prisma.transaction.create({
          data: {
            userId: testUserId,
            amount: 5.00,
            transactionType: type as any,
            status: 'COMPLETED'
          }
        });

        expect(transaction.transactionType).toBe(type);
      }
    });
  });
});