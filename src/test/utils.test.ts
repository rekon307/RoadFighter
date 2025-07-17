import {
  validateEntryFee,
  validateUsername,
  validateSessionSize,
  formatCurrency,
  calculateDistance,
  calculateScore,
  calculatePaymentSplit,
} from '../shared/utils/index.js';

describe('Utility Functions', () => {
  describe('validateEntryFee', () => {
    test('should accept valid entry fees', () => {
      expect(validateEntryFee(1.00)).toBe(true);
      expect(validateEntryFee(50.00)).toBe(true);
      expect(validateEntryFee(100.00)).toBe(true);
    });

    test('should reject invalid entry fees', () => {
      expect(validateEntryFee(0.50)).toBe(false);
      expect(validateEntryFee(101.00)).toBe(false);
      expect(validateEntryFee(NaN)).toBe(false);
      expect(validateEntryFee(Infinity)).toBe(false);
    });
  });

  describe('validateUsername', () => {
    test('should accept valid usernames', () => {
      expect(validateUsername('user123')).toBe(true);
      expect(validateUsername('test_user')).toBe(true);
      expect(validateUsername('player-1')).toBe(true);
    });

    test('should reject invalid usernames', () => {
      expect(validateUsername('ab')).toBe(false); // too short
      expect(validateUsername('a'.repeat(21))).toBe(false); // too long
      expect(validateUsername('user@test')).toBe(false); // invalid characters
      expect(validateUsername('user 123')).toBe(false); // spaces
    });
  });

  describe('validateSessionSize', () => {
    test('should accept valid session sizes', () => {
      expect(validateSessionSize(1)).toBe(true);
      expect(validateSessionSize(4)).toBe(true);
      expect(validateSessionSize(8)).toBe(true);
    });

    test('should reject invalid session sizes', () => {
      expect(validateSessionSize(0)).toBe(false);
      expect(validateSessionSize(9)).toBe(false);
      expect(validateSessionSize(3.5)).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    test('should format currency correctly', () => {
      expect(formatCurrency(5.00)).toBe('$5.00');
      expect(formatCurrency(10.99)).toBe('$10.99');
      expect(formatCurrency(100)).toBe('$100.00');
    });
  });

  describe('calculateDistance', () => {
    test('should calculate distance between two points', () => {
      expect(calculateDistance(0, 0, 3, 4)).toBe(5);
      expect(calculateDistance(0, 0, 0, 0)).toBe(0);
      expect(calculateDistance(1, 1, 4, 5)).toBe(5);
    });
  });

  describe('calculateScore', () => {
    test('should calculate game score correctly', () => {
      const score = calculateScore(100, 60000, 50); // 100 distance, 60 seconds, 50 fuel
      expect(score).toBe(100 + 600 + 250); // distance + time + fuel bonus
    });
  });

  describe('calculatePaymentSplit', () => {
    test('should split payment correctly', () => {
      const split = calculatePaymentSplit(100);
      expect(split.developer).toBe(25);
      expect(split.creator).toBe(25);
      expect(split.winner).toBe(50);
      expect(split.developer + split.creator + split.winner).toBe(100);
    });

    test('should handle decimal amounts', () => {
      const split = calculatePaymentSplit(10.50);
      expect(split.developer).toBe(2.63);
      expect(split.creator).toBe(2.63);
      expect(split.winner).toBe(5.25);
    });
  });
});