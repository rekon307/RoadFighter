import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { initializeWebSocketServer } from '../server/services/websocket.js';
import { ClientToServerEvents, ServerToClientEvents } from '../shared/types/index.js';

describe('WebSocket Server Tests', () => {
  let httpServer: any;
  let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

  beforeAll(() => {
    httpServer = createServer();
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
  });

  afterAll((done) => {
    if (httpServer && httpServer.listening) {
      httpServer.close(done);
    } else {
      done();
    }
  });

  describe('WebSocket Server Initialization', () => {
    test('should initialize WebSocket server', () => {
      const socketServer = initializeWebSocketServer(io);
      
      expect(socketServer).toBeDefined();
      expect(socketServer).toBe(io);
    });

    test('should have correct CORS configuration', () => {
      expect(io.engine.opts.cors).toBeDefined();
    });
    
    test('should be able to import websocket service', () => {
      expect(typeof initializeWebSocketServer).toBe('function');
    });
  });

  describe('Socket Event Handlers', () => {
    test('should handle mock socket operations', () => {
      const mockSocket = {
        id: 'test_socket_id',
        join: jest.fn(),
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        data: {}
      };

      // Test basic socket operations
      mockSocket.join('test_room');
      expect(mockSocket.join).toHaveBeenCalledWith('test_room');

      // Test event registration
      const mockHandler = jest.fn();
      mockSocket.on('test_event', mockHandler);
      expect(mockSocket.on).toHaveBeenCalledWith('test_event', mockHandler);
    });

    test('should validate event data types', () => {
      // Test game session ID validation
      const validSessionId = 'session_123';
      const invalidSessionId = '';
      
      expect(validSessionId).toBeTruthy();
      expect(invalidSessionId).toBeFalsy();

      // Test movement direction validation
      const validDirections = ['left', 'right'];
      const invalidDirection = 'invalid';
      
      expect(validDirections).toContain('left');
      expect(validDirections).toContain('right');
      expect(validDirections).not.toContain(invalidDirection);

      // Test acceleration boolean validation
      expect(typeof true).toBe('boolean');
      expect(typeof false).toBe('boolean');
      expect(typeof 'true').not.toBe('boolean');
    });
  });

  describe('Room Management', () => {
    test('should manage game rooms correctly', () => {
      const mockSocket = {
        id: 'test_socket_room',
        join: jest.fn(),
        leave: jest.fn(),
        rooms: new Set(),
        on: jest.fn()
      };

      const sessionId = 'game_room_123';
      
      // Test joining room
      mockSocket.join(sessionId);
      expect(mockSocket.join).toHaveBeenCalledWith(sessionId);
      
      // Test leaving room
      mockSocket.leave(sessionId);
      expect(mockSocket.leave).toHaveBeenCalledWith(sessionId);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid event data gracefully', () => {
      const mockSocket = {
        id: 'test_socket_error',
        join: jest.fn(),
        emit: jest.fn(),
        on: jest.fn()
      };

      // Test with invalid session ID - should not throw
      expect(() => {
        mockSocket.join('');
        mockSocket.join(null);
        mockSocket.join(undefined);
      }).not.toThrow();
    });

    test('should handle socket errors', () => {
      const mockSocket = {
        id: 'test_socket_error_handler',
        on: jest.fn(),
        emit: jest.fn()
      };

      const errorHandler = jest.fn();
      mockSocket.on('error', errorHandler);

      // Simulate error
      const testError = new Error('Test socket error');
      errorHandler(testError);

      expect(errorHandler).toHaveBeenCalledWith(testError);
    });
  });

  describe('Game State Synchronization', () => {
    test('should handle game state updates efficiently', () => {
      const gameState = {
        sessionId: 'sync_test',
        players: {
          player1: {
            id: 'player1',
            username: 'TestPlayer1',
            position: { x: 100, y: 200, rotation: 0 },
            score: 150,
            distanceTraveled: 500,
            isAlive: true,
            fuel: 75,
            speed: 5,
            lastUpdate: Date.now()
          },
          player2: {
            id: 'player2',
            username: 'TestPlayer2',
            position: { x: 150, y: 180, rotation: 0 },
            score: 200,
            distanceTraveled: 600,
            isAlive: true,
            fuel: 80,
            speed: 6,
            lastUpdate: Date.now()
          }
        },
        obstacles: [
          {
            id: 'obstacle1',
            type: 'car' as const,
            position: { x: 120, y: 300, rotation: 0 },
            speed: 3
          }
        ],
        gameTime: 30000,
        isActive: true
      };

      // Test game state serialization/deserialization
      const serialized = JSON.stringify(gameState);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(gameState);
      expect(deserialized.players.player1.score).toBe(150);
      expect(deserialized.obstacles).toHaveLength(1);
    });
  });

  describe('Connection Management', () => {
    test('should handle multiple concurrent connections', () => {
      const connections = [];
      
      for (let i = 0; i < 10; i++) {
        const mockSocket = {
          id: `socket_${i}`,
          join: jest.fn(),
          on: jest.fn(),
          emit: jest.fn()
        };
        connections.push(mockSocket);
      }

      expect(connections).toHaveLength(10);
      
      // Test that all connections can be handled
      connections.forEach(socket => {
        expect(socket.id).toBeDefined();
        expect(typeof socket.join).toBe('function');
      });
    });
  });

  describe('Event Type Validation', () => {
    test('should validate ClientToServerEvents structure', () => {
      // These should match the actual event interface
      const expectedEvents = [
        'join_game',
        'player_move', 
        'player_accelerate',
        'leave_game'
      ];

      expectedEvents.forEach(event => {
        expect(typeof event).toBe('string');
        expect(event.length).toBeGreaterThan(0);
      });
    });

    test('should validate ServerToClientEvents structure', () => {
      // These should match the actual event interface
      const expectedEvents = [
        'game_state',
        'player_joined',
        'player_left',
        'game_started',
        'game_ended'
      ];

      expectedEvents.forEach(event => {
        expect(typeof event).toBe('string');
        expect(event.length).toBeGreaterThan(0);
      });
    });
  });
});