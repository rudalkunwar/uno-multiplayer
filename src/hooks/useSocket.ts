'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { env } from '@/config/env';
import { GameState, Player, GameSettings } from '@/types/game';

interface GameEvents {
  onGameCreated?: (data: { 
    roomCode: string; 
    gameState: GameState;
    settings: GameSettings;
  }) => void;
  onGameStateUpdated?: (gameState: GameState) => void;
  onPlayerJoined?: (data: { gameState: GameState; newPlayer: Player }) => void;
  onGameReady?: (data: { playersCount: number }) => void;
  onGameStarted?: (data: { gameState: GameState }) => void;
  onGameEnded?: (data: { winner: Player; gameState: GameState }) => void;
  onError?: (error: { message: string; code?: string }) => void;
}

interface CreateGamePayload {
  username: string;
  settings: GameSettings;
}

interface CreateGameResponse {
  roomCode: string;
  gameState: GameState;
  settings: GameSettings;
}

interface JoinGamePayload {
  roomCode: string;
  username: string;
}

interface PlayCardPayload {
  roomCode: string;
  cardId: string;
  chosenColor?: string;
}

export const useSocket = (events?: GameEvents) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const initSocket = useCallback(async () => {
    try {
      // Check server availability
      const response = await fetch(`${env.server.apiBaseUrl}/socket`);
      if (!response.ok) {
        throw new Error('Server is not available');
      }

      // Initialize socket connection
      socketRef.current = io(env.server.socketUrl, {
        reconnectionDelayMax: 10000,
        reconnectionAttempts: maxReconnectAttempts,
        timeout: 10000,
        transports: ['websocket', 'polling'],
      });

      // Connection events
      socketRef.current.on('connect', () => {
        console.log(`Socket connected at ${new Date().toISOString()}`);
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log(`Socket disconnected at ${new Date().toISOString()}, reason: ${reason}`);
        setIsConnected(false);
      });

      socketRef.current.on('connect_error', (err) => {
        console.error(`Connection error at ${new Date().toISOString()}:`, err);
        reconnectAttempts.current++;
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Failed to connect to server after multiple attempts');
          socketRef.current?.disconnect();
        }
      });

      // Game events
      if (events) {
        if (events.onGameCreated) {
          socketRef.current.on('gameCreated', (data: CreateGameResponse) => {
            console.log('Game created:', {
              roomCode: data.roomCode,
              settings: data.settings,
              playerCount: data.gameState.players.length,
            });
            events.onGameCreated?.(data);
          });
        }

        if (events.onGameStateUpdated) {
          socketRef.current.on('gameStateUpdated', (gameState: GameState) => {
            console.log('Game state updated:', gameState);
            events.onGameStateUpdated?.(gameState);
          });
        }

        if (events.onPlayerJoined) {
          socketRef.current.on('playerJoined', (data: { gameState: GameState; newPlayer: Player }) => {
            console.log('Player joined:', data);
            events.onPlayerJoined?.(data);
          });
        }

        if (events.onGameReady) {
          socketRef.current.on('gameReady', (data: { playersCount: number }) => {
            console.log('Game ready:', data);
            events.onGameReady?.(data);
          });
        }

        if (events.onGameStarted) {
          socketRef.current.on('gameStarted', (data: { gameState: GameState }) => {
            console.log('Game started:', data);
            events.onGameStarted?.(data);
          });
        }

        if (events.onGameEnded) {
          socketRef.current.on('gameEnded', (data: { winner: Player; gameState: GameState }) => {
            console.log('Game ended:', data);
            events.onGameEnded?.(data);
          });
        }

        if (events.onError) {
          socketRef.current.on('error', (error: { message: string; code?: string }) => {
            console.error('Game error:', error);
            events.onError?.(error);
            setError(error.message);
          });
        }
      }
    } catch (err) {
      console.error('Socket initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
    }
  }, [events]);

  useEffect(() => {
    initSocket();
    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection');
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [initSocket]);

  const emitWithTimeout = useCallback(async <T>(
    eventName: string,
    data: any,
    timeout: number = 5000
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket is not connected'));
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error(`${eventName} event timed out`));
      }, timeout);

      socketRef.current.emit(eventName, data, (response: T) => {
        clearTimeout(timer);
        resolve(response);
      });
    });
  }, []);

  const createGame = useCallback(async (payload: CreateGamePayload) => {
    try {
      // Validate settings before sending
      if (!payload.settings.roomName?.trim()) {
        throw new Error('Room name is required');
      }
      if (
        !payload.settings.maxPlayers ||
        payload.settings.maxPlayers < env.game.minPlayersToStart ||
        payload.settings.maxPlayers > env.game.maxPlayersPerRoom
      ) {
        throw new Error(
          `Players must be between ${env.game.minPlayersToStart} and ${env.game.maxPlayersPerRoom}`
        );
      }

      // Add timestamp to the payload
      const timestampedPayload = {
        ...payload,
        timestamp: new Date().toISOString(),
      };

      console.log('Creating game with settings:', timestampedPayload);

      const response = await emitWithTimeout<CreateGameResponse>('createGame', timestampedPayload);
      
      console.log('Game created successfully:', response);
      return response;
    } catch (err) {
      console.error('Create game error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create game');
      throw err;
    }
  }, [emitWithTimeout]);

  const joinGame = useCallback(async (payload: JoinGamePayload) => {
    try {
      await emitWithTimeout('joinGame', payload);
    } catch (err) {
      console.error('Join game error:', err);
      setError(err instanceof Error ? err.message : 'Failed to join game');
      throw err;
    }
  }, [emitWithTimeout]);

  const startGame = useCallback(async (roomCode: string) => {
    try {
      await emitWithTimeout('startGame', { roomCode });
    } catch (err) {
      console.error('Start game error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start game');
      throw err;
    }
  }, [emitWithTimeout]);

  const playCard = useCallback(async (payload: PlayCardPayload) => {
    try {
      await emitWithTimeout('playCard', payload);
    } catch (err) {
      console.error('Play card error:', err);
      setError(err instanceof Error ? err.message : 'Failed to play card');
      throw err;
    }
  }, [emitWithTimeout]);

  const drawCard = useCallback(async (roomCode: string) => {
    try {
      await emitWithTimeout('drawCard', { roomCode });
    } catch (err) {
      console.error('Draw card error:', err);
      setError(err instanceof Error ? err.message : 'Failed to draw card');
      throw err;
    }
  }, [emitWithTimeout]);

  // Helper function to check if socket is ready
  const isReady = useCallback(() => {
    return socketRef.current?.connected ?? false;
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    createGame,
    joinGame,
    startGame,
    playCard,
    drawCard,
    reconnectAttempts: reconnectAttempts.current,
    isReady,
  };
};

// Helper to validate game settings
export const validateGameSettings = (settings: GameSettings): string | null => {
  if (!settings.roomName?.trim()) {
    return 'Room name is required';
  }

  if (
    !settings.maxPlayers ||
    settings.maxPlayers < env.game.minPlayersToStart ||
    settings.maxPlayers > env.game.maxPlayersPerRoom
  ) {
    return `Players must be between ${env.game.minPlayersToStart} and ${env.game.maxPlayersPerRoom}`;
  }

  if (!settings.timePerTurn || settings.timePerTurn < 15 || settings.timePerTurn > 60) {
    return 'Turn time must be between 15 and 60 seconds';
  }

  return null;
};
