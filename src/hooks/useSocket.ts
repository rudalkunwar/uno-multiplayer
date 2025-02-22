'use client';

import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { env } from '@/config/env';
import { GameState, Player } from '@/types/game';

interface GameEvents {
  onGameCreated?: (data: { roomId: string; playerId: string }) => void;
  onGameStateUpdated?: (gameState: Partial<GameState>) => void;
  onPlayerJoined?: (data: { gameState: Partial<GameState>; newPlayer: Partial<Player> }) => void;
  onGameReady?: () => void;
  onGameStarted?: (data: { gameState: Partial<GameState> }) => void;
  onGameEnded?: (data: { winner: Partial<Player> }) => void;
  onError?: (error: { message: string }) => void;
}

export const useSocket = (events?: GameEvents) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const initSocket = async () => {
      try {
        await fetch(`${env.server.apiBaseUrl}/socket`);
        
        socketRef.current = io(env.server.socketUrl, {
          reconnectionDelayMax: 10000,
        });

        socketRef.current.on('connect', () => {
          console.log('Connected to Socket.IO server');
          setIsConnected(true);
          setError(null);
        });

        socketRef.current.on('disconnect', () => {
          console.log('Disconnected from Socket.IO server');
          setIsConnected(false);
        });

        // Game events
        if (events) {
          if (events.onGameCreated) {
            socketRef.current.on('gameCreated', events.onGameCreated);
          }
          if (events.onGameStateUpdated) {
            socketRef.current.on('gameStateUpdated', events.onGameStateUpdated);
          }
          if (events.onPlayerJoined) {
            socketRef.current.on('playerJoined', events.onPlayerJoined);
          }
          if (events.onGameReady) {
            socketRef.current.on('gameReady', events.onGameReady);
          }
          if (events.onGameStarted) {
            socketRef.current.on('gameStarted', events.onGameStarted);
          }
          if (events.onGameEnded) {
            socketRef.current.on('gameEnded', events.onGameEnded);
          }
          if (events.onError) {
            socketRef.current.on('error', events.onError);
          }
        }

      } catch (err) {
        console.error('Socket initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to server');
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [events]);

  const createGame = (username: string) => {
    socketRef.current?.emit('createGame', username);
  };

  const joinGame = (roomId: string, username: string) => {
    socketRef.current?.emit('joinGame', { roomId, username });
  };

  const startGame = (roomId: string) => {
    socketRef.current?.emit('startGame', roomId);
  };

  const playCard = (roomId: string, cardId: string, chosenColor?: string) => {
    socketRef.current?.emit('playCard', { roomId, cardId, chosenColor });
  };

  const drawCard = (roomId: string) => {
    socketRef.current?.emit('drawCard', roomId);
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    createGame,
    joinGame,
    startGame,
    playCard,
    drawCard,
  };
};