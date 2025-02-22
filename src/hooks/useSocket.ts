import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { env } from '@/config/env';

export const useSocket = () => {
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
          console.log('Socket connected');
          setIsConnected(true);
          setError(null);
        });

        socketRef.current.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
        });

        socketRef.current.on('roomFull', ({ roomId }) => {
          setError(`Room ${roomId} is full (max ${env.game.maxPlayersPerRoom} players)`);
        });

        socketRef.current.on('gameReady', ({ playersCount }) => {
          console.log(`Game ready with ${playersCount} players`);
        });
      } catch (err) {
        setError('Failed to connect to server');
        console.error('Socket connection error:', err);
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const joinGame = useCallback((roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('joinGame', roomId);
    }
  }, []);

  const playCard = useCallback((roomId: string, card: any) => {
    if (socketRef.current) {
      socketRef.current.emit('playCard', { roomId, card });
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    joinGame,
    playCard,
  };
};