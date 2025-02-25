'use client';

import { useEffect, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '@/types/game';

interface UseSocketProps {
    onGameStateUpdated?: (state: GameState) => void;
    onPlayerJoined?: (data: any) => void;
    onGameStarted?: (data: any) => void;
    onGameEnded?: (data: any) => void;
    onError?: (error: Error) => void;
}

/**
 * @hook useSocket
 * @description Custom hook for Socket.IO client integration
 * @author rudalkunwar
 * @created 2025-02-25 08:18:15
 */
export const useSocket = ({
    onGameStateUpdated,
    onPlayerJoined,
    onGameStarted,
    onGameEnded,
    onError
}: UseSocketProps) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize socket connection
    useEffect(() => {
        // Create socket instance with proper configuration
        const socketInstance = io('http://localhost:3000', {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            path: '/socket.io'
        });

        // Connection event handlers
        socketInstance.on('connect', () => {
            console.log('Socket connected:', socketInstance.id);
            setIsConnected(true);
            setError(null);
        });

        socketInstance.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            setError(`Connection error: ${err.message}`);
            setIsConnected(false);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);
            if (reason === 'io server disconnect') {
                // Server disconnected the socket, try reconnecting
                socketInstance.connect();
            }
        });

        // Game event handlers
        socketInstance.on('gameStateUpdated', (state: GameState) => {
            console.log('Game state updated:', state);
            onGameStateUpdated?.(state);
        });

        socketInstance.on('playerJoined', (data) => {
            console.log('Player joined:', data);
            onPlayerJoined?.(data);
        });

        socketInstance.on('gameStarted', (data) => {
            console.log('Game started:', data);
            onGameStarted?.(data);
        });

        socketInstance.on('gameEnded', (data) => {
            console.log('Game ended:', data);
            onGameEnded?.(data);
        });

        socketInstance.on('error', (error) => {
            console.error('Socket error:', error);
            setError(error.message);
            onError?.(error);
        });

        // Store socket instance
        setSocket(socketInstance);

        // Cleanup function
        return () => {
            if (socketInstance) {
                console.log('Cleaning up socket connection...');
                socketInstance.removeAllListeners();
                socketInstance.close();
            }
        };
    }, []); // Empty dependency array as we only want to initialize once

    // Game actions
    const createGame = useCallback(async (data: { username: string; settings: any }) => {
        if (!socket || !isConnected) {
            throw new Error('Socket not connected');
        }

        return new Promise((resolve, reject) => {
            socket.emit('createGame', data, (response: any) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });
    }, [socket, isConnected]);

    const joinGame = useCallback(async (data: { roomCode: string; username: string }) => {
        if (!socket || !isConnected) {
            throw new Error('Socket not connected');
        }

        return new Promise((resolve, reject) => {
            socket.emit('joinGame', data, (response: any) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });
    }, [socket, isConnected]);

    const playCard = useCallback(async (data: { roomCode: string; cardId: string; chosenColor?: string }) => {
        if (!socket || !isConnected) {
            throw new Error('Socket not connected');
        }

        return new Promise((resolve, reject) => {
            socket.emit('playCard', data, (response: any) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });
    }, [socket, isConnected]);

    const drawCard = useCallback(async (roomCode: string) => {
        if (!socket || !isConnected) {
            throw new Error('Socket not connected');
        }

        return new Promise((resolve, reject) => {
            socket.emit('drawCard', { roomCode }, (response: any) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });
    }, [socket, isConnected]);

    return {
        socket,
        isConnected,
        error,
        createGame,
        joinGame,
        playCard,
        drawCard
    };
};