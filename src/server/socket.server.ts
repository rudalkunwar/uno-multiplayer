import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { GameService } from '../services/GameService';
import { SOCKET_CONFIG } from '../config/socket.config';
import type { Socket } from 'socket.io';

/**
 * @description Socket.IO server event handlers and game state management
 * @author rudalkunwar
 * @created 2025-02-25 07:32:41
 */

interface ServerToClientEvents {
  gameStateUpdated: (gameState: any) => void;
  error: (error: { message: string }) => void;
}

interface ClientToServerEvents {
  createGame: (data: any, callback?: (response: any) => void) => void;
  joinGame: (data: any, callback?: (response: any) => void) => void;
  playCard: (data: any, callback?: (response: any) => void) => void;
  drawCard: (data: any, callback?: (response: any) => void) => void;
}

export function setupSocketServer(server: NetServer) {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(server, {
    path: SOCKET_CONFIG.options.path,
    cors: {
      origin: SOCKET_CONFIG.url,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Store active games
  const games = new Map<string, GameService>();

  // Helper function to safely handle callbacks
  const safeCallback = (callback: any, response: any) => {
    if (typeof callback === 'function') {
      callback(response);
    }
  };

  // Helper function to emit error
  const emitError = (socket: Socket, message: string) => {
    socket.emit('error', { message });
  };

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id} at ${new Date().toISOString()}`);

    socket.on('createGame', (data, callback) => {
      try {
        const { username, settings } = data;
        const game = GameService.createGame(settings.roomCode!, socket.id, username, settings);
        games.set(settings.roomCode!, game);
        
        socket.join(settings.roomCode!);
        
        const response = {
          success: true,
          roomCode: settings.roomCode,
          gameState: game.getState(),
          settings: game.getState().settings
        };

        safeCallback(callback, response);
        socket.emit('gameStateUpdated', game.getState());
      } catch (error) {
        const errorResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create game'
        };
        safeCallback(callback, errorResponse);
        emitError(socket, errorResponse.error);
      }
    });

    socket.on('joinGame', (data, callback) => {
      try {
        const { roomCode, username } = data;
        const game = games.get(roomCode);
        
        if (!game) {
          throw new Error('Game not found');
        }

        const updatedGame = game.addPlayer(socket.id, username);
        games.set(roomCode, updatedGame);
        
        socket.join(roomCode);
        
        const response = { success: true };
        safeCallback(callback, response);
        
        io.to(roomCode).emit('gameStateUpdated', updatedGame.getState());
      } catch (error) {
        const errorResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to join game'
        };
        safeCallback(callback, errorResponse);
        emitError(socket, errorResponse.error);
      }
    });

    socket.on('playCard', (data, callback) => {
      try {
        const { roomCode, cardId, chosenColor } = data;
        const game = games.get(roomCode);
        
        if (!game) {
          throw new Error('Game not found');
        }

        const updatedGame = game.playCard(socket.id, cardId, chosenColor);
        games.set(roomCode, updatedGame);
        
        const response = { success: true };
        safeCallback(callback, response);
        
        io.to(roomCode).emit('gameStateUpdated', updatedGame.getState());
      } catch (error) {
        const errorResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to play card'
        };
        safeCallback(callback, errorResponse);
        emitError(socket, errorResponse.error);
      }
    });

    socket.on('drawCard', (data, callback) => {
      try {
        const { roomCode } = data;
        const game = games.get(roomCode);
        
        if (!game) {
          throw new Error('Game not found');
        }

        const updatedGame = game.drawCards(socket.id);
        games.set(roomCode, updatedGame);
        
        const response = { success: true };
        safeCallback(callback, response);
        
        io.to(roomCode).emit('gameStateUpdated', updatedGame.getState());
      } catch (error) {
        const errorResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to draw card'
        };
        safeCallback(callback, errorResponse);
        emitError(socket, errorResponse.error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id} at ${new Date().toISOString()}`);
      games.forEach((game, roomCode) => {
        try {
          const updatedGame = game.removePlayer(socket.id);
          if (updatedGame) {
            games.set(roomCode, updatedGame);
            io.to(roomCode).emit('gameStateUpdated', updatedGame.getState());
          }
        } catch (error) {
          console.error(`Error handling disconnect for room ${roomCode}:`, error);
        }
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
      emitError(socket, 'An unexpected error occurred');
    });
  });

  return io;
}