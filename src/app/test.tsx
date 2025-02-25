'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { ConnectionStatus } from '@/app/ConnectionStatus';

/**
 * @component LoadingSpinner
 * @description Simple loading spinner component
 */
const LoadingSpinner = () => (
    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white"></div>
);

/**
 * @component SocketTestPage
 * @description Socket testing page with loading states and animations
 * @author rudalkunwar
 * @created 2025-02-25 07:44:13
 */
export default function SocketTestPage() {
    const [roomInput, setRoomInput] = useState('');
    const [username, setUsername] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [lastRoomCode, setLastRoomCode] = useState<string>('');
    const [isClient, setIsClient] = useState(false); // Prevents SSR mismatch

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Loading states
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);

    // Socket hook
    const {
        isConnected,
        error,
        socket,
        createGame,
        joinGame,
        playCard,
        drawCard
    } = useSocket({
        onGameStateUpdated: (state) => {
            addLog('🔄 Game State Updated', state);
        },
        onPlayerJoined: (data) => {
            addLog('👤 Player Joined', data);
        },
        onGameStarted: (data) => {
            addLog('🎮 Game Started', data);
        },
        onGameEnded: (data) => {
            addLog('🏁 Game Ended', data);
        },
        onError: (error) => {
            addLog('❌ Socket Error', error);
        }
    });

    // Enhanced logging helper with timestamp
    const addLog = (type: string, data?: any) => {
        const now = new Date();
        const timestamp = now.toISOString();
        let logMessage = type;

        if (data) {
            if (data instanceof Error) {
                logMessage += `: ${data.message}`;
            } else if (typeof data === 'object') {
                logMessage += `: ${JSON.stringify(data, null, 2)}`;
            } else {
                logMessage += `: ${data}`;
            }
        }

        setLogs(prev => [`[${timestamp}] ${logMessage}`, ...prev]);
    };

    if (!isClient) return null; // Prevents hydration error

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                WebSocket Test Page
                {!isConnected && (
                    <div className="inline-block animate-pulse text-yellow-500 text-sm font-normal">
                        Connecting...
                    </div>
                )}
            </h1>

            {/* Connection Status */}
            <ConnectionStatus isConnected={isConnected} error={error} socket={socket} />

            {/* Controls */}
            <div className="mb-6 space-y-4 p-4 rounded border bg-white shadow-sm">
                <h2 className="text-xl font-semibold mb-2">Test Controls</h2>

                <div className="space-y-4">
                    <div className="form-group">
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="form-group">
                        <label className="block text-sm font-medium mb-1">Room Code</label>
                        <input
                            type="text"
                            value={roomInput}
                            onChange={(e) => setRoomInput(e.target.value)}
                            placeholder="Room Code"
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => { }}
                        disabled={!isConnected || isCreating}
                        className={`p-2 bg-blue-500 text-white rounded transition-all
              ${!isConnected || isCreating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}
              flex items-center justify-center gap-2`}
                    >
                        {isCreating ? <LoadingSpinner /> : null}
                        {isCreating ? 'Creating...' : 'Create Game'}
                    </button>

                    <button
                        onClick={() => { }}
                        disabled={!isConnected || !roomInput || isJoining}
                        className={`p-2 bg-green-500 text-white rounded transition-all
              ${!isConnected || !roomInput || isJoining ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'}
              flex items-center justify-center gap-2`}
                    >
                        {isJoining ? <LoadingSpinner /> : null}
                        {isJoining ? 'Joining...' : 'Join Game'}
                    </button>
                </div>
            </div>

            {/* Logs */}
            <div className="p-4 rounded border bg-white shadow-sm">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    Event Logs
                    <span className="text-xs text-gray-500">{new Date().toLocaleString()}</span>
                </h2>
                <div className="bg-gray-900 text-green-400 p-4 rounded font-mono h-96 overflow-auto">
                    {logs.map((log, index) => (
                        <div
                            key={index}
                            className={`whitespace-pre-wrap mb-1 ${log.includes('❌') ? 'text-red-400' :
                                log.includes('✅') ? 'text-green-400' :
                                    'text-blue-400'
                                } ${index === 0 ? 'animate-fade-in' : ''}`}
                        >
                            {log}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
