import { cache, initializeRedis, initializeCacheService, checkRedisHealth } from '../server/services/redis.js';

describe.skip('Redis Cache Operations (requires Redis)', () => {
  beforeAll(async () => {
    // Ensure Redis is connected and cache service is initialized
    try {
      await initializeRedis();
      initializeCacheService();
    } catch (error) {
      // Redis might already be initialized
      console.log('Redis initialization warning:', error);
    }
  });

  beforeEach(async () => {
    // Clear test keys before each test
    try {
      if (cache && typeof cache.deleteByPattern === 'function') {
        await cache.deleteByPattern('test:*');
      }
    } catch (error) {
      // Ignore if pattern doesn't exist or cache not ready
    }
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (cache && typeof cache.deleteByPattern === 'function') {
        await cache.deleteByPattern('test:*');
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Redis Connection', () => {
    test('should connect to Redis successfully', async () => {
      const isHealthy = await checkRedisHealth();
      expect(isHealthy).toBe(true);
    });
  });

  describe('Basic Cache Operations', () => {
    test('should set and get string values', async () => {
      const key = 'test:string';
      const value = 'test value';
      
      const setResult = await cache.set(key, value);
      expect(setResult).toBe(true);
      
      const retrieved = await cache.get(key);
      expect(retrieved).toBe(value);
    });

    test('should set and get object values', async () => {
      const key = 'test:object';
      const value = { id: 1, name: 'test', active: true };
      
      await cache.set(key, value);
      const retrieved = await cache.get(key);
      
      expect(retrieved).toEqual(value);
    });

    test('should return null for non-existent keys', async () => {
      const result = await cache.get('test:nonexistent');
      expect(result).toBeNull();
    });

    test('should delete keys', async () => {
      const key = 'test:delete';
      await cache.set(key, 'value');
      
      const deleteResult = await cache.del(key);
      expect(deleteResult).toBe(true);
      
      const retrieved = await cache.get(key);
      expect(retrieved).toBeNull();
    });

    test('should check key existence', async () => {
      const key = 'test:exists';
      
      let exists = await cache.exists(key);
      expect(exists).toBe(false);
      
      await cache.set(key, 'value');
      exists = await cache.exists(key);
      expect(exists).toBe(true);
    });
  });

  describe('TTL Operations', () => {
    test('should set values with TTL', async () => {
      const key = 'test:ttl';
      const value = 'expires soon';
      
      await cache.set(key, value, 1); // 1 second TTL
      
      const retrieved = await cache.get(key);
      expect(retrieved).toBe(value);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const expired = await cache.get(key);
      expect(expired).toBeNull();
    });

    test('should set expiration on existing keys', async () => {
      const key = 'test:expire';
      await cache.set(key, 'value');
      
      const expireResult = await cache.expire(key, 1);
      expect(expireResult).toBe(true);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const expired = await cache.get(key);
      expect(expired).toBeNull();
    });
  });

  describe('Hash Operations', () => {
    test('should set and get hash fields', async () => {
      const key = 'test:hash';
      const field = 'field1';
      const value = { data: 'test hash value' };
      
      await cache.setHash(key, field, value);
      const retrieved = await cache.getHash(key, field);
      
      expect(retrieved).toEqual(value);
    });

    test('should get all hash fields', async () => {
      const key = 'test:hash:all';
      const data = {
        field1: { value: 1 },
        field2: { value: 2 },
        field3: { value: 3 }
      };
      
      for (const [field, value] of Object.entries(data)) {
        await cache.setHash(key, field, value);
      }
      
      const allFields = await cache.getAllHash(key);
      expect(allFields).toEqual(data);
    });

    test('should delete hash fields', async () => {
      const key = 'test:hash:delete';
      const field = 'field1';
      
      await cache.setHash(key, field, 'value');
      const deleteResult = await cache.deleteHash(key, field);
      expect(deleteResult).toBe(true);
      
      const retrieved = await cache.getHash(key, field);
      expect(retrieved).toBeNull();
    });
  });

  describe('List Operations', () => {
    test('should push and pop from lists', async () => {
      const key = 'test:list';
      const value1 = { id: 1, data: 'first' };
      const value2 = { id: 2, data: 'second' };
      
      await cache.pushToList(key, value1);
      await cache.pushToList(key, value2);
      
      const length = await cache.getListLength(key);
      expect(length).toBe(2);
      
      const popped1 = await cache.popFromList(key);
      expect(popped1).toEqual(value2); // LIFO order
      
      const popped2 = await cache.popFromList(key);
      expect(popped2).toEqual(value1);
    });

    test('should return null when popping from empty list', async () => {
      const result = await cache.popFromList('test:empty:list');
      expect(result).toBeNull();
    });
  });

  describe('Set Operations', () => {
    test('should add and check set membership', async () => {
      const key = 'test:set';
      const member = 'member1';
      
      await cache.addToSet(key, member);
      const isMember = await cache.isInSet(key, member);
      expect(isMember).toBe(true);
      
      const notMember = await cache.isInSet(key, 'nonexistent');
      expect(notMember).toBe(false);
    });

    test('should get all set members', async () => {
      const key = 'test:set:members';
      const members = ['member1', 'member2', 'member3'];
      
      for (const member of members) {
        await cache.addToSet(key, member);
      }
      
      const allMembers = await cache.getSetMembers(key);
      expect(allMembers.sort()).toEqual(members.sort());
    });

    test('should remove set members', async () => {
      const key = 'test:set:remove';
      const member = 'member1';
      
      await cache.addToSet(key, member);
      await cache.removeFromSet(key, member);
      
      const isMember = await cache.isInSet(key, member);
      expect(isMember).toBe(false);
    });
  });

  describe('Increment Operations', () => {
    test('should increment numeric values', async () => {
      const key = 'test:counter';
      
      const result1 = await cache.increment(key, 1);
      expect(result1).toBe(1);
      
      const result2 = await cache.increment(key, 5);
      expect(result2).toBe(6);
      
      const result3 = await cache.increment(key);
      expect(result3).toBe(7);
    });
  });

  describe('Pattern Operations', () => {
    test('should delete keys by pattern', async () => {
      const keys = ['test:pattern:1', 'test:pattern:2', 'test:pattern:3'];
      
      for (const key of keys) {
        await cache.set(key, 'value');
      }
      
      const deleteResult = await cache.deleteByPattern('test:pattern:*');
      expect(deleteResult).toBe(true);
      
      for (const key of keys) {
        const value = await cache.get(key);
        expect(value).toBeNull();
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle cache errors gracefully', async () => {
      // Test with an invalid key pattern that might cause Redis errors
      const result = await cache.get('');
      expect(result).toBeNull();
    });

    test('should return false on failed operations', async () => {
      // Test operations that might fail
      const result = await cache.del('nonexistent:key');
      expect(typeof result).toBe('boolean');
    });
  });
});