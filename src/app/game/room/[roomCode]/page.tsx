'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { GameState } from '@/types/game';
import { Loader2 } from 'lucide-react';

export default function GameRoomPage() {
    const params = useParams();
    const router = useRouter();
    const { socket, isConnected } = useSocket();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!socket || !isConnected || !params) return;

        // Listen for game state updates
        socket.on('gameStateUpdated', (newState: GameState) => {
            setGameState(newState);
        });

        // Listen for errors
        socket.on('gameError', (error: string) => {
            setError(error);
        });

        // Join the room
        socket.emit('joinRoom', { roomCode: params.roomCode! });

        return () => {
            socket.off('gameStateUpdated');
            socket.off('gameError');
        };
    }, [socket, isConnected, params?.roomCode]);

    if (!gameState) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                <div className="text-white text-center">
                    <Loader2 className="animate-spin w-12 h-12 mx-auto mb-4" />
                    <p className="text-lg">Loading game room...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Game room content will go here */}
                <div className="bg-white rounded-xl shadow-xl p-6">
                    <h1 className="text-2xl font-bold mb-4">Game Room: {gameState.roomName}</h1>
                    {/* Add game components here */}
                </div>
            </div>
        </div>
    );
}