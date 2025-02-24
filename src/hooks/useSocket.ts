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
  settings: GameSettings & { roomCode?: string };
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
  const [isInitializing, setIsInitializing] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const pendingCallbacks = useRef(new Map());

  const initSocket = useCallback(async () => {
    if (socketRef.current?.connected) {
      setIsInitializing(false);
      return;
    }

    try {
      // Clean up existing socket if any
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }

      socketRef.current = io(env.server.socketUrl, {
        reconnectionDelayMax: 10000,
        reconnectionAttempts: maxReconnectAttempts,
        timeout: 15000, // Increased timeout
        transports: ['websocket'],
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 1000,
      });

      // Add connect_timeout event
      socketRef.current.on('connect_timeout', () => {
        console.error('Socket connection timeout');
        setError('Connection timeout - please try again');
        setIsInitializing(false);
      });

      socketRef.current.on('connect', () => {
        console.log(`Socket connected at ${new Date().toISOString()}`);
        setIsConnected(true);
        setError(null);
        setIsInitializing(false);
        reconnectAttempts.current = 0;
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log(`Socket disconnected at ${new Date().toISOString()}, reason: ${reason}`);
        setIsConnected(false);
        
        // Clear all pending callbacks on disconnect
        pendingCallbacks.current.forEach((callback) => {
          callback(new Error('Socket disconnected'));
        });
        pendingCallbacks.current.clear();

        if (reason === 'io server disconnect') {
          socketRef.current?.connect();
        }
      });

      socketRef.current.on('connect_error', (err) => {
        console.error(`Connection error at ${new Date().toISOString()}:`, err);
        setIsInitializing(false);
        reconnectAttempts.current++;
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Failed to connect to server after multiple attempts');
          socketRef.current?.disconnect();
        }
      });

      // Add acknowledgment event handler
      socketRef.current.on('ack', ({ id, error, data }) => {
        const callback = pendingCallbacks.current.get(id);
        if (callback) {
          pendingCallbacks.current.delete(id);
          if (error) {
            callback(new Error(error));
          } else {
            callback(null, data);
          }
        }
      });

      if (events) {
        Object.entries(events).forEach(([event, handler]) => {
          if (handler && socketRef.current) {
            socketRef.current.on(event, handler);
          }
        });
      }
    } catch (err) {
      console.error('Socket initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
      setIsInitializing(false);
    }
  }, [events]);

  useEffect(() => {
    initSocket();
    return () => {
      pendingCallbacks.current.clear();
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [initSocket]);

  const emitWithTimeout = useCallback(async <T>(
    eventName: string,
    data: any,
    timeout: number = 15000 // Increased default timeout
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket is not connected'));
        return;
      }

      const callbackId = Date.now().toString();
      const timer = setTimeout(() => {
        pendingCallbacks.current.delete(callbackId);
        reject(new Error(`${eventName} event timed out. Please check your connection and try again.`));
      }, timeout);

      pendingCallbacks.current.set(callbackId, (error: Error | null, response?: T) => {
        clearTimeout(timer);
        if (error) {
          reject(error);
        } else {
          resolve(response as T);
        }
      });

      try {
        socketRef.current.emit(eventName, { ...data, callbackId });
      } catch (err) {
        clearTimeout(timer);
        pendingCallbacks.current.delete(callbackId);
        reject(err);
      }
    });
  }, []);

  const createGame = useCallback(async (payload: CreateGamePayload): Promise<CreateGameResponse> => {
    try {
      if (!socketRef.current?.connected) {
        throw new Error('Socket is not connected. Please try again.');
      }

      // Validate settings
      const validationError = validateGameSettings(payload.settings);
      if (validationError) {
        throw new Error(validationError);
      }

      // Add retry mechanism
      let retries = 0;
      const maxRetries = 2;
      
      const attemptCreate = async (): Promise<CreateGameResponse> => {
        try {
          const timestampedPayload = {
            ...payload,
            timestamp: new Date().toISOString(),
          };

          console.log(`Attempting to create game (attempt ${retries + 1}/${maxRetries + 1}):`, timestampedPayload);

          return await emitWithTimeout<CreateGameResponse>(
            'createGame', 
            timestampedPayload,
            20000 // Increased timeout for game creation
          );
        } catch (error) {
          if (retries < maxRetries && error instanceof Error && error.message.includes('timed out')) {
            retries++;
            console.log(`Retrying create game (${retries}/${maxRetries})`);
            return attemptCreate();
          }
          throw error;
        }
      };

      const response = await attemptCreate();
      console.log('Game created successfully:', response);
      return response;
    } catch (err) {
      console.error('Create game error:', err);
      const errorMessage = err instanceof Error 
        ? `Failed to create game: ${err.message}`
        : 'Failed to create game';
      setError(errorMessage);
      throw new Error(errorMessage);
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

  return {
    socket: socketRef.current,
    isConnected,
    error,
    isInitializing,
    createGame,
    joinGame,
    startGame,
    playCard,
    drawCard,
    reconnectAttempts: reconnectAttempts.current,
    isReady: useCallback(() => socketRef.current?.connected ?? false, []),
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