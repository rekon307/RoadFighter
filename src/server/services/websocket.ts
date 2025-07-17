import { Server as SocketIOServer } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '../../shared/types/index.js';

export function initializeWebSocketServer(io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>) {
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    socket.on('join_game', (sessionId) => {
      console.log(`🎮 User ${socket.id} joining game ${sessionId}`);
      socket.join(sessionId);
      // TODO: Implement game joining logic
    });

    socket.on('player_move', (direction) => {
      console.log(`🕹️ User ${socket.id} moving ${direction}`);
      // TODO: Implement player movement
    });

    socket.on('player_accelerate', (accelerating) => {
      console.log(`⚡ User ${socket.id} accelerating: ${accelerating}`);
      // TODO: Implement player acceleration
    });

    socket.on('leave_game', () => {
      console.log(`🚪 User ${socket.id} leaving game`);
      // TODO: Implement game leaving logic
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
      // TODO: Handle cleanup
    });
  });

  return io;
}