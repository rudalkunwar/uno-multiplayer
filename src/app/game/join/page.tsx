'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Loader2, Search } from 'lucide-react';
import { RoomCodeGenerator } from '@/utils/roomCode';
import { useSocket } from '@/hooks/useSocket';

// Removed unused JoinGameProps interface

export default function JoinGamePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isConnected, joinGame } = useSocket();

    const [username, setUsername] = useState('');
    const [roomCode, setRoomCode] = useState(searchParams?.get('code') || '');
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-format room code as user types
    const handleRoomCodeChange = (value: string) => {
        const formatted = value
            .toUpperCase()
            .replace(/[^A-Z0-9-]/g, '')
            .slice(0, 10); // UNO-XXXXX format
        setRoomCode(formatted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !roomCode.trim() || isJoining) return;

        setError(null);
        setIsJoining(true);

        try {
            if (!RoomCodeGenerator.isValidRoomCode(roomCode)) {
                throw new Error('Invalid room code format');
            }

            // Attempt to join the game
            joinGame(roomCode, username);

            // Navigation will happen after successful socket connection
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to join game');
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => router.push('/')}
                        className="text-white flex items-center gap-2 hover:bg-white/10 
                     rounded-lg px-4 py-2 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Home
                    </button>
                </motion.div>

                {/* Join Form */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-xl shadow-xl overflow-hidden"
                >
                    <div className="p-6 border-b">
                        <h1 className="text-2xl font-bold text-gray-800">Join Game</h1>
                        <p className="text-gray-600">Enter the room code to join a game</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Connection Status */}
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                                {isConnected ? 'Connected to server' : 'Connecting to server...'}
                            </span>
                        </div>

                        {/* Username Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Users size={18} className="inline mr-2" />
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 
                         focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your name"
                                required
                                minLength={3}
                                maxLength={20}
                            />
                        </div>

                        {/* Room Code Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Search size={18} className="inline mr-2" />
                                Room Code
                            </label>
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) => handleRoomCodeChange(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 
                         focus:ring-blue-500 focus:border-blue-500 font-mono uppercase"
                                placeholder="UNO-XXXXX"
                                required
                                title="Enter a valid room code (e.g., UNO-AB123)"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Format: UNO-XXXXX (provided by the game creator)
                            </p>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 text-red-600 p-4 rounded-lg text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Join Button */}
                        <button
                            type="submit"
                            disabled={!isConnected || isJoining || !username.trim() || !roomCode.trim()}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium
                       hover:bg-blue-700 transition-colors disabled:bg-gray-400
                       disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isJoining ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Joining Game...
                                </>
                            ) : (
                                'Join Game'
                            )}
                        </button>
                    </form>

                    {/* Quick Tips */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="p-6 bg-gray-50 border-t"
                    >
                        <h3 className="font-medium text-gray-700 mb-2">Quick Tips:</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Room codes are case-insensitive</li>
                            <li>• Make sure you have the correct code from the host</li>
                            <li>• Room codes expire after 24 hours</li>
                            <li>• You can't join a game that's already in progress</li>
                        </ul>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}