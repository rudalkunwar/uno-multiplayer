'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { SOCKET_CONFIG, SOCKET_TIMEOUTS } from '@/config/socket.config';
import { SocketUtils } from '@/utils/socket.utils';
import type {
  GameEvents,
  CreateGamePayload,
  CreateGameResponse,
  JoinGamePayload,
  PlayCardPayload,
  SocketError
} from '@/types/socket';

/**
 * @class SocketManager
 * @description Manages the Socket.IO connection, event handling, and message acknowledgments.
 * @created 2025-02-25 06:00:10
 * @author rudalkunwar
 */
class SocketManager {
  private socket: Socket | null = null;
  private pendingCallbacks = new Map<string, (error: Error | null, data?: any) => void>();
  private reconnectAttempts = 0;

  constructor(
    private readonly config = SOCKET_CONFIG,
    private readonly onConnectionChange?: (connected: boolean) => void,
    private readonly onError?: (error: string) => void
  ) {}

  /**
   * init
   * Initializes the socket connection. If a socket already exists and is connected, returns it.
   * @returns {Socket} The Socket.IO instance.
   */
  public init(): Socket {
    if (this.socket?.connected) return this.socket;

    // Create a new socket instance using the provided configuration.
    this.socket = io(this.config.url, this.config.options);
    this.setupEventListeners();
    return this.socket;
  }

  /**
   * setupEventListeners
   * Sets up the core event listeners for connection, disconnection, errors, timeouts, and acknowledgments.
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('connect_error', this.handleError.bind(this));
    this.socket.on('connect_timeout', this.handleTimeout.bind(this));
    this.socket.on('ack', this.handleAcknowledgement.bind(this));
  }

  /**
   * emit
   * Emits an event with a data payload and awaits a server acknowledgment within a timeout.
   * @param eventName - The name of the event to emit.
   * @param data - The payload data to send.
   * @param timeout - Optional timeout (in ms) before rejecting the promise.
   * @returns A promise that resolves with the acknowledgment data.
   */
  public async emit<T>(
    eventName: string,
    data: any,
    timeout: number = SOCKET_TIMEOUTS.DEFAULT
  ): Promise<T> {
    if (!this.socket?.connected) {
      throw new Error('Socket is not connected');
    }

    return new Promise((resolve, reject) => {
      const callbackId = SocketUtils.generateCallbackId();
      const timer = setTimeout(() => {
        this.pendingCallbacks.delete(callbackId);
        reject(new Error(`${eventName} event timed out`));
      }, timeout);

      this.pendingCallbacks.set(callbackId, (error, response) => {
        clearTimeout(timer);
        error ? reject(error) : resolve(response as T);
      });

      this.socket?.emit(eventName, { ...data, callbackId });
    });
  }

  /**
   * cleanup
   * Cleans up the socket connection and all associated listeners and pending callbacks.
   */
  public cleanup(): void {
    this.pendingCallbacks.clear();
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * getSocket
   * Retrieves the current Socket.IO instance.
   * @returns {Socket | null} The socket instance or null if not initialized.
   */
  public getSocket(): Socket | null {
    return this.socket;
  }

  // --------------------
  // Event Handlers
  // --------------------

  private handleConnect(): void {
    this.reconnectAttempts = 0;
    this.onConnectionChange?.(true);
  }

  private handleDisconnect(reason: string): void {
    this.onConnectionChange?.(false);
    // Reject all pending callbacks on disconnect.
    this.pendingCallbacks.forEach(callback => {
      callback(new Error('Socket disconnected'));
    });
    this.pendingCallbacks.clear();

    // If the disconnect was initiated by the server, try reconnecting.
    if (reason === 'io server disconnect') {
      this.socket?.connect();
    }
  }

  private handleError(error: Error): void {
    this.reconnectAttempts++;
    if (this.reconnectAttempts >= SOCKET_CONFIG.options.reconnectionAttempts) {
      this.onError?.('Failed to connect after multiple attempts');
      this.socket?.disconnect();
    }
  }

  private handleTimeout(): void {
    this.onError?.('Connection timeout - please try again');
  }

  private handleAcknowledgement({ id, error, data }: { id: string; error?: string; data: any }): void {
    const callback = this.pendingCallbacks.get(id);
    if (callback) {
      this.pendingCallbacks.delete(id);
      error ? callback(new Error(error)) : callback(null, data);
    }
  }
}

/**
 * @hook useSocket
 * @description Custom React hook that initializes and manages the Socket.IO connection,
 * provides connection status, error handling, and game action methods.
 * @created 2025-02-25 06:00:10
 */
export const useSocket = (events?: Partial<GameEvents>) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const managerRef = useRef<SocketManager | null>(null);

  // Initialize the socket manager on mount.
  useEffect(() => {
    managerRef.current = new SocketManager(
      SOCKET_CONFIG,
      setIsConnected,
      setError
    );
    
    const socket = managerRef.current.init();

    // Register additional custom event handlers if provided.
    if (events) {
      Object.entries(events).forEach(([event, handler]) => {
        if (handler) socket.on(event, handler);
      });
    }

    setIsInitializing(false);

    // Cleanup on unmount.
    return () => {
      managerRef.current?.cleanup();
    };
  }, [events]);

  // --------------------
  // Game Action Methods
  // --------------------

  /**
   * createGame
   * Sends a request to create a new game.
   */
  const createGame = useCallback(async (payload: CreateGamePayload): Promise<CreateGameResponse> => {
    // Validate game settings before emitting.
    const validationError = SocketUtils.validateGameSettings(payload.settings);
    if (validationError) throw new Error(validationError);

    try {
      return await managerRef.current!.emit<CreateGameResponse>(
        'createGame',
        payload,
        SOCKET_TIMEOUTS.CREATE_GAME
      );
    } catch (error) {
      throw new Error(SocketUtils.formatError(error));
    }
  }, []);

  /**
   * joinGame
   * Sends a request for a player to join a game.
   */
  const joinGame = useCallback(async (payload: JoinGamePayload): Promise<void> => {
    try {
      await managerRef.current!.emit('joinGame', payload);
    } catch (error) {
      throw new Error(SocketUtils.formatError(error));
    }
  }, []);

  /**
   * playCard
   * Sends a request to play a card in the game.
   */
  const playCard = useCallback(async (payload: PlayCardPayload): Promise<void> => {
    try {
      await managerRef.current!.emit('playCard', payload);
    } catch (error) {
      throw new Error(SocketUtils.formatError(error));
    }
  }, []);

  /**
   * drawCard
   * Sends a request to draw a card from the deck.
   */
  const drawCard = useCallback(async (roomCode: string): Promise<void> => {
    try {
      await managerRef.current!.emit('drawCard', { roomCode });
    } catch (error) {
      throw new Error(SocketUtils.formatError(error));
    }
  }, []);

  return {
    socket: managerRef.current?.getSocket() ?? null,
    error,
    isInitializing,
    createGame,
    joinGame,
    playCard,
    drawCard,
    isConnected
  };
};
