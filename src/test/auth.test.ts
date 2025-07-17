import { generateToken } from '../server/middleware/auth.js';
import jwt from 'jsonwebtoken';

describe('Authentication System', () => {
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';
  const testWhopUserId = 'whop_test_user_123';

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_testing';
  });

  describe('generateToken', () => {
    test('should generate valid JWT token', () => {
      const token = generateToken(testUserId, testWhopUserId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should include correct payload in token', () => {
      const token = generateToken(testUserId, testWhopUserId);
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.whopUserId).toBe(testWhopUserId);
      expect(decoded.iss).toBe('multiplayer-road-fighter');
      expect(decoded.aud).toBe('whop-platform');
    });

    test('should create tokens with expiration', () => {
      const token = generateToken(testUserId, testWhopUserId);
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    test('should throw error without JWT_SECRET', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      expect(() => generateToken(testUserId, testWhopUserId))
        .toThrow('JWT_SECRET not configured');
      
      process.env.JWT_SECRET = originalSecret;
    });

    test('should generate different tokens for different users', () => {
      const token1 = generateToken('user1', 'whop1');
      const token2 = generateToken('user2', 'whop2');
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('Token Validation', () => {
    test('should validate tokens correctly', () => {
      const token = generateToken(testUserId, testWhopUserId);
      
      expect(() => jwt.verify(token, process.env.JWT_SECRET!)).not.toThrow();
    });

    test('should reject invalid tokens', () => {
      expect(() => jwt.verify('invalid.token.here', process.env.JWT_SECRET!))
        .toThrow();
    });

    test('should reject tokens with wrong secret', () => {
      const token = generateToken(testUserId, testWhopUserId);
      
      expect(() => jwt.verify(token, 'wrong-secret'))
        .toThrow();
    });

    test('should handle expired tokens', () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(
        { userId: testUserId, whopUserId: testWhopUserId },
        process.env.JWT_SECRET!,
        { expiresIn: '-1s' }
      );
      
      expect(() => jwt.verify(expiredToken, process.env.JWT_SECRET!))
        .toThrow('jwt expired');
    });
  });
});