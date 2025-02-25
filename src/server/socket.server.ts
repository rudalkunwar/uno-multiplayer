import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { GameService } from '@/services/GameService';
import { SOCKET_CONFIG } from '@/config/socket.config';

/**
 * @description Socket.IO server configuration and event handlers
 * @created 2025-02-25 07:13:11
 * @author rudalkunwar
 */

export function setupSocketServer(server: NetServer) {
  const io = new SocketIOServer(server, {
    path: SOCKET_CONFIG.options.path,
    cors: {
      origin: SOCKET_CONFIG.url,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Store active games
  const games = new Map<string, GameService>();

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id} at ${new Date().toISOString()}`);

    socket.on('createGame', async (data, callback) => {
      try {
        const { username, settings } = data;
        const game = GameService.createGame(settings.roomCode!, socket.id, username, settings);
        games.set(settings.roomCode!, game);
        
        socket.join(settings.roomCode!);
        
        callback({
          success: true,
          roomCode: settings.roomCode,
          gameState: game.getState(),
          settings: game.getState().settings
        });
      } catch (error) {
        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create game'
        });
      }
    });

    socket.on('joinGame', async (data, callback) => {
      try {
        const { roomCode, username } = data;
        const game = games.get(roomCode);
        
        if (!game) {
          throw new Error('Game not found');
        }

        const updatedGame = game.addPlayer(socket.id, username);
        games.set(roomCode, updatedGame);
        
        socket.join(roomCode);
        io.to(roomCode).emit('gameStateUpdated', updatedGame.getState());
        
        callback({ success: true });
      } catch (error) {
        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to join game'
        });
      }
    });

    socket.on('playCard', async (data, callback) => {
      try {
        const { roomCode, cardId, chosenColor } = data;
        const game = games.get(roomCode);
        
        if (!game) {
          throw new Error('Game not found');
        }

        const updatedGame = game.playCard(socket.id, cardId, chosenColor);
        games.set(roomCode, updatedGame);
        
        io.to(roomCode).emit('gameStateUpdated', updatedGame.getState());
        
        callback({ success: true });
      } catch (error) {
        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to play card'
        });
      }
    });

    socket.on('drawCard', async (data, callback) => {
      try {
        const { roomCode } = data;
        const game = games.get(roomCode);
        
        if (!game) {
          throw new Error('Game not found');
        }

        const updatedGame = game.drawCards(socket.id);
        games.set(roomCode, updatedGame);
        
        io.to(roomCode).emit('gameStateUpdated', updatedGame.getState());
        
        callback({ success: true });
      } catch (error) {
        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to draw card'
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id} at ${new Date().toISOString()}`);
      games.forEach((game, roomCode) => {
        try {
          const updatedGame = game.removePlayer(socket.id);
          games.set(roomCode, updatedGame);
          io.to(roomCode).emit('gameStateUpdated', updatedGame.getState());
        } catch (error) {
          console.error(`Error handling disconnect for room ${roomCode}:`, error);
        }
      });
    });
  });

  return io;
}