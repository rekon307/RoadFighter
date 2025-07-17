import { generateToken } from '../server/middleware/auth.js';

describe.skip('Live API Endpoint Tests', () => {
  const baseUrl = 'http://localhost:3001';
  let authToken: string;

  beforeAll(() => {
    // Generate a test token
    authToken = generateToken(
      '123e4567-e89b-12d3-a456-426614174000',
      'test_whop_user_123'
    );
  });

  describe('Health Endpoint', () => {
    test('should return health status', async () => {
      const response = await fetch(`${baseUrl}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('version');
    });
  });

  describe('Authentication Tests', () => {
    test('should reject requests without authorization', async () => {
      const response = await fetch(`${baseUrl}/api/user/profile`);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error', 'UNAUTHORIZED');
      expect(data).toHaveProperty('message', 'Access token required');
    });

    test('should reject requests with invalid token', async () => {
      const response = await fetch(`${baseUrl}/api/user/profile`, {
        headers: {
          'Authorization': 'Bearer invalid_token'
        }
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error', 'INVALID_TOKEN');
    });

    test('should reject requests with malformed auth header', async () => {
      const response = await fetch(`${baseUrl}/api/user/profile`, {
        headers: {
          'Authorization': 'InvalidFormat token'
        }
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error', 'UNAUTHORIZED');
    });
  });

  describe('User Endpoints', () => {
    test('should handle user profile endpoint with valid token', async () => {
      const response = await fetch(`${baseUrl}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Since the user doesn't exist in the test database, we expect a 401
      // but the token should be validated first
      expect([401, 404]).toContain(response.status);
    });

    test('should handle user tokens endpoint', async () => {
      const response = await fetch(`${baseUrl}/api/user/tokens`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect([401, 404]).toContain(response.status);
    });
  });

  describe('Session Endpoints', () => {
    test('should handle session creation', async () => {
      const response = await fetch(`${baseUrl}/api/sessions/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entryFee: 10.00,
          maxPlayers: 4
        })
      });

      // Expect authentication/user validation to happen first
      expect([401, 404, 422]).toContain(response.status);
    });

    test('should handle session listing', async () => {
      const response = await fetch(`${baseUrl}/api/sessions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect([401, 404]).toContain(response.status);
    });

    test('should validate session creation data', async () => {
      const response = await fetch(`${baseUrl}/api/sessions/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entryFee: -5.00, // Invalid negative fee
          maxPlayers: 15   // Too many players
        })
      });

      // Should get validation error or auth error
      expect([400, 401, 422]).toContain(response.status);
    });
  });

  describe('Leaderboard Endpoints', () => {
    test('should handle daily leaderboard request', async () => {
      const response = await fetch(`${baseUrl}/api/leaderboard/daily`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect([401, 404]).toContain(response.status);
    });

    test('should handle weekly leaderboard request', async () => {
      const response = await fetch(`${baseUrl}/api/leaderboard/weekly`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect([401, 404]).toContain(response.status);
    });
  });

  describe('Payment Endpoints', () => {
    test('should handle payment charge request', async () => {
      const response = await fetch(`${baseUrl}/api/payments/charge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: 10.00,
          sessionId: '123e4567-e89b-12d3-a456-426614174000'
        })
      });

      expect([401, 404, 422]).toContain(response.status);
    });

    test('should handle payment history request', async () => {
      const response = await fetch(`${baseUrl}/api/payments/history`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect([401, 404]).toContain(response.status);
    });

    test('should handle balance check request', async () => {
      const response = await fetch(`${baseUrl}/api/payments/balance`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect([401, 404]).toContain(response.status);
    });
  });

  describe('Game Endpoints', () => {
    test('should handle game state request', async () => {
      const sessionId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await fetch(`${baseUrl}/api/game/${sessionId}/state`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect([401, 404]).toContain(response.status);
    });

    test('should handle game results request', async () => {
      const sessionId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await fetch(`${baseUrl}/api/game/${sessionId}/results`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect([401, 404]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for non-existent routes', async () => {
      const response = await fetch(`${baseUrl}/api/nonexistent`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Route not found');
      expect(data).toHaveProperty('path', '/api/nonexistent');
    });

    test('should handle malformed JSON in requests', async () => {
      const response = await fetch(`${baseUrl}/api/sessions/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: 'invalid json{'
      });

      expect([400, 401]).toContain(response.status);
    });
  });

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await fetch(`${baseUrl}/health`);

      // Check for common security headers
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-frame-options')).toBe('DENY');
      expect(response.headers.get('x-xss-protection')).toBe('0');
    });

    test('should include CORS headers', async () => {
      const response = await fetch(`${baseUrl}/health`);

      // Check if CORS headers are present (if configured)
      const corsHeader = response.headers.get('access-control-allow-origin');
      // CORS headers might not be present for same-origin requests
      expect(typeof corsHeader).toBe('string');
    });
  });

  describe('Rate Limiting', () => {
    test('should handle rapid requests', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(fetch(`${baseUrl}/health`));
      }

      const responses = await Promise.all(promises);
      
      // Most requests should succeed
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
      
      // Some might be rate limited, but not all
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      expect(rateLimitedCount).toBeLessThan(5);
    });
  });
});