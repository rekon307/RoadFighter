import {
  validateEntryFee,
  validateUsername,
  calculateDistance,
  calculateScore,
  calculatePaymentSplit,
  formatCurrency
} from '../shared/utils/index.js';

describe('Performance Tests', () => {
  describe('Utility Function Performance', () => {
    test('should validate entry fees efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 10000; i++) {
        validateEntryFee(Math.random() * 200);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    test('should validate usernames efficiently', () => {
      const start = performance.now();
      const testUsernames = [
        'validuser123',
        'test_user',
        'player-1',
        'ab', // too short
        'user@invalid', // invalid chars
        'a'.repeat(25) // too long
      ];
      
      for (let i = 0; i < 10000; i++) {
        const username = testUsernames[i % testUsernames.length];
        validateUsername(username);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(100);
    });

    test('should calculate distances efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 10000; i++) {
        const x1 = Math.random() * 1000;
        const y1 = Math.random() * 1000;
        const x2 = Math.random() * 1000;
        const y2 = Math.random() * 1000;
        calculateDistance(x1, y1, x2, y2);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(50);
    });

    test('should calculate scores efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 10000; i++) {
        const distance = Math.random() * 1000;
        const time = Math.random() * 60000; // 60 seconds
        const fuel = Math.random() * 100;
        calculateScore(distance, time, fuel);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(50);
    });

    test('should calculate payment splits efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 10000; i++) {
        const amount = Math.random() * 100;
        calculatePaymentSplit(amount);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(50);
    });

    test('should format currency efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 10000; i++) {
        const amount = Math.random() * 1000;
        formatCurrency(amount);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(1000); // Currency formatting is more expensive but should be reasonable
    });
  });

  describe('Memory Usage Tests', () => {
    test('should not leak memory with repeated calculations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many calculations
      for (let i = 0; i < 100000; i++) {
        const distance = Math.random() * 1000;
        const time = Math.random() * 60000;
        const fuel = Math.random() * 100;
        calculateScore(distance, time, fuel);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Should not increase memory significantly
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB limit
    });

    test('should handle large arrays efficiently', () => {
      const largeArray = Array.from({ length: 100000 }, (_, i) => ({
        id: i,
        score: Math.random() * 1000,
        distance: Math.random() * 500,
        time: Math.random() * 60000
      }));
      
      const start = performance.now();
      
      // Sort by score (common leaderboard operation)
      const sorted = largeArray.sort((a, b) => b.score - a.score);
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(500); // Array sorting can be slower in test environment
      expect(sorted.length).toBe(100000);
      expect(sorted[0].score).toBeGreaterThanOrEqual(sorted[1].score);
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle multiple simultaneous validations', async () => {
      const operations = [];
      
      for (let i = 0; i < 1000; i++) {
        operations.push(
          new Promise<boolean>((resolve) => {
            const isValid = validateEntryFee(Math.random() * 200);
            resolve(isValid);
          })
        );
      }
      
      const start = performance.now();
      const results = await Promise.all(operations);
      const end = performance.now();
      const duration = end - start;
      
      expect(results).toHaveLength(1000);
      expect(duration).toBeLessThan(100);
    });

    test('should handle multiple payment split calculations', async () => {
      const operations = [];
      
      for (let i = 0; i < 1000; i++) {
        operations.push(
          new Promise<any>((resolve) => {
            const split = calculatePaymentSplit(100); // Use fixed amount for consistent testing
            resolve(split);
          })
        );
      }
      
      const start = performance.now();
      const results = await Promise.all(operations);
      const end = performance.now();
      const duration = end - start;
      
      expect(results).toHaveLength(1000);
      expect(duration).toBeLessThan(100);
      
      // Verify all splits add up correctly
      results.forEach(split => {
        const total = split.developer + split.creator + split.winner;
        expect(total).toBeCloseTo(100, 1); // Allow for rounding
      });
    });
  });

  describe('Edge Case Performance', () => {
    test('should handle maximum values efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        calculateScore(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 100);
        calculateDistance(0, 0, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
        calculatePaymentSplit(Number.MAX_SAFE_INTEGER);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(100);
    });

    test('should handle minimum values efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        calculateScore(0, 0, 0);
        calculateDistance(0, 0, 0, 0);
        calculatePaymentSplit(0.01);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(100);
    });

    test('should handle very long usernames efficiently', () => {
      const longUsername = 'a'.repeat(1000);
      
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        validateUsername(longUsername);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Data Structure Performance', () => {
    test('should efficiently process leaderboard data', () => {
      const leaderboardData = Array.from({ length: 10000 }, (_, i) => ({
        userId: `user_${i}`,
        score: Math.floor(Math.random() * 100000),
        distance: Math.random() * 1000,
        time: Math.random() * 600000,
        rank: 0
      }));
      
      const start = performance.now();
      
      // Sort and assign ranks
      leaderboardData.sort((a, b) => b.score - a.score);
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1;
      });
      
      // Find top 10
      const top10 = leaderboardData.slice(0, 10);
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(100);
      expect(top10).toHaveLength(10);
      expect(top10[0].rank).toBe(1);
      expect(top10[9].rank).toBe(10);
    });

    test('should efficiently search through user data', () => {
      const userData = Array.from({ length: 10000 }, (_, i) => ({
        id: `user_${i}`,
        username: `player_${i}`,
        score: Math.random() * 1000
      }));
      
      const start = performance.now();
      
      // Search for specific users
      for (let i = 0; i < 100; i++) {
        const searchId = `user_${Math.floor(Math.random() * 10000)}`;
        const found = userData.find(user => user.id === searchId);
        expect(found).toBeDefined();
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(100);
    });
  });
});