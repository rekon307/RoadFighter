import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma in development
const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

export { prisma };

export async function initializeDatabase() {
  try {
    // Test the connection
    await prisma.$connect();
    console.log('📊 Prisma connected to database');
    
    // Run any initialization queries if needed
    await setupInitialConfig();
    
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
}

async function setupInitialConfig() {
  try {
    // Check if initial config exists, if not create it
    const existingConfig = await prisma.gameConfig.findMany();
    
    if (existingConfig.length === 0) {
      await prisma.gameConfig.createMany({
        data: [
          {
            key: 'MIN_ENTRY_FEE',
            value: '1.00',
            category: 'payment',
          },
          {
            key: 'MAX_ENTRY_FEE',
            value: '100.00',
            category: 'payment',
          },
          {
            key: 'DEFAULT_ENTRY_FEE',
            value: '5.00',
            category: 'payment',
          },
          {
            key: 'DAILY_TOKEN_COUNT',
            value: '3',
            category: 'tokens',
          },
          {
            key: 'MAX_PLAYERS_PER_SESSION',
            value: '8',
            category: 'game',
          },
          {
            key: 'DEVELOPER_SPLIT',
            value: '25',
            category: 'payment',
          },
          {
            key: 'CREATOR_SPLIT',
            value: '25',
            category: 'payment',
          },
          {
            key: 'WINNER_SPLIT',
            value: '50',
            category: 'payment',
          },
        ],
      });
      
      console.log('✅ Initial game configuration created');
    }
    
  } catch (error) {
    console.error('❌ Failed to setup initial config:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Disconnected from database');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
    throw error;
  }
}

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}

// Helper function to handle database transactions
export async function withTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback);
}

// Helper function for paginated queries
export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function paginate<T>(
  query: any,
  options: PaginationOptions
): Promise<PaginatedResult<T>> {
  const { page, limit } = options;
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    query.skip(skip).take(limit),
    query.count ? query.count() : 0,
  ]);
  
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}