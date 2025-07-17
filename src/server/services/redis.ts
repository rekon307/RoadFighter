import { createClient, RedisClientType } from 'redis';
import { CACHE_TTL } from '../../shared/constants/index.js';

let redisClient: RedisClientType;

export async function initializeRedis(): Promise<void> {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      retry_unfulfilled_commands: true,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 50, 500);
        },
      },
    });

    redisClient.on('error', (error) => {
      console.error('❌ Redis Client Error:', error);
    });

    redisClient.on('connect', () => {
      console.log('🔄 Redis Client connecting...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis Client ready');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis Client reconnecting...');
    });

    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    console.log('✅ Redis connection established');
    
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    throw error;
  }
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
}

// Cache operations
export class CacheService {
  private client: RedisClientType;

  constructor() {
    this.client = getRedisClient();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      console.error(`❌ Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`❌ Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`❌ Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`❌ Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      console.error(`❌ Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  async increment(key: string, amount: number = 1): Promise<number | null> {
    try {
      return await this.client.incrBy(key, amount);
    } catch (error) {
      console.error(`❌ Cache increment error for key ${key}:`, error);
      return null;
    }
  }

  async setHash(key: string, field: string, value: any): Promise<boolean> {
    try {
      await this.client.hSet(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`❌ Cache setHash error for key ${key}:`, error);
      return false;
    }
  }

  async getHash<T>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.client.hGet(key, field);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      console.error(`❌ Cache getHash error for key ${key}:`, error);
      return null;
    }
  }

  async getAllHash<T>(key: string): Promise<Record<string, T> | null> {
    try {
      const hash = await this.client.hGetAll(key);
      if (!hash || Object.keys(hash).length === 0) return null;
      
      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      console.error(`❌ Cache getAllHash error for key ${key}:`, error);
      return null;
    }
  }

  async deleteHash(key: string, field: string): Promise<boolean> {
    try {
      await this.client.hDel(key, field);
      return true;
    } catch (error) {
      console.error(`❌ Cache deleteHash error for key ${key}:`, error);
      return false;
    }
  }

  // List operations for game sessions
  async pushToList(key: string, value: any): Promise<boolean> {
    try {
      await this.client.lPush(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`❌ Cache pushToList error for key ${key}:`, error);
      return false;
    }
  }

  async popFromList<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.lPop(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      console.error(`❌ Cache popFromList error for key ${key}:`, error);
      return null;
    }
  }

  async getListLength(key: string): Promise<number> {
    try {
      return await this.client.lLen(key);
    } catch (error) {
      console.error(`❌ Cache getListLength error for key ${key}:`, error);
      return 0;
    }
  }

  // Set operations for active players
  async addToSet(key: string, value: string): Promise<boolean> {
    try {
      await this.client.sAdd(key, value);
      return true;
    } catch (error) {
      console.error(`❌ Cache addToSet error for key ${key}:`, error);
      return false;
    }
  }

  async removeFromSet(key: string, value: string): Promise<boolean> {
    try {
      await this.client.sRem(key, value);
      return true;
    } catch (error) {
      console.error(`❌ Cache removeFromSet error for key ${key}:`, error);
      return false;
    }
  }

  async isInSet(key: string, value: string): Promise<boolean> {
    try {
      const result = await this.client.sIsMember(key, value);
      return result;
    } catch (error) {
      console.error(`❌ Cache isInSet error for key ${key}:`, error);
      return false;
    }
  }

  async getSetMembers(key: string): Promise<string[]> {
    try {
      return await this.client.sMembers(key);
    } catch (error) {
      console.error(`❌ Cache getSetMembers error for key ${key}:`, error);
      return [];
    }
  }

  // Pattern-based operations
  async deleteByPattern(pattern: string): Promise<boolean> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error(`❌ Cache deleteByPattern error for pattern ${pattern}:`, error);
      return false;
    }
  }
}

export const cache = new CacheService();

export async function disconnectRedis(): Promise<void> {
  try {
    await redisClient.quit();
    console.log('✅ Disconnected from Redis');
  } catch (error) {
    console.error('❌ Error disconnecting from Redis:', error);
    throw error;
  }
}

// Redis health check
export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error('❌ Redis health check failed:', error);
    return false;
  }
}