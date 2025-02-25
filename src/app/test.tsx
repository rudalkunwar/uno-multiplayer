'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { GameState, GameSettings, CardColor } from '@/types/game';

/**
 * @component SocketTester
 * @description Test component for verifying socket functionality
 * @author rudalkunwar
 * @created 2025-02-25 06:10:41 UTC
 */
export default function SocketTester() {
    const [logs, setLogs] = useState<string[]>([]);
    const [roomCode, setRoomCode] = useState<string>('');
    const [gameState, setGameState] = useState<GameState | null>(null);

    // Initialize socket with event handlers
    const {
        isConnected,
        error,
        isInitializing,
        createGame,
        joinGame,
        playCard,
        drawCard
    } = useSocket({
        onGameStateUpdated: (state) => {
            addLog('Game state updated');
            setGameState(state);
        },
        onGameCreated: (data) => {
            addLog(`Game created with room code: ${data.roomCode}`);
            setRoomCode(data.roomCode);
        },
        onPlayerJoined: (data) => {
            addLog(`Player joined: ${data.newPlayer.username}`);
        },
        onGameStarted: (data) => {
            addLog('Game started!');
        },
        onGameEnded: (data) => {
            addLog(`Game ended! Winner: ${data.winner.username}`);
        },
        onError: (error) => {
            addLog(`Error: ${error.message}`);
        }
    });

    const addLog = (message: string) => {
        setLogs(prev => [`[${new Date().toISOString()}] ${message}`, ...prev]);
    };

    // Test game settings
    const testSettings: GameSettings = {
        roomName: 'Test Room',
        maxPlayers: 4,
        minPlayers: 2,
        timePerTurn: 30,
        isPrivate: false,
        scoreLimit: 500,
        stackDrawCards: true,
        forcePlay: false,
        jumpIn: false,
        drawUntilMatch: false,
        allowChallenges: true,
        strictUno: true,
        sevenZero: false,
        noBluffing: false,
        passAfterDraw: true,
        drawCardLimit: 3
    };

    // Test functions
    const handleCreateGame = async () => {
        try {
            const response = await createGame({
                username: 'TestPlayer1',
                settings: testSettings
            });
            addLog(`Created game with room code: ${response.roomCode}`);
        } catch (err) {
            addLog(`Error creating game: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleJoinGame = async () => {
        if (!roomCode) {
            addLog('No room code available');
            return;
        }
        try {
            await joinGame({
                roomCode,
                username: `TestPlayer${Math.floor(Math.random() * 1000)}`
            });
            addLog('Joined game successfully');
        } catch (err) {
            addLog(`Error joining game: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handlePlayCard = async () => {
        if (!roomCode || !gameState) {
            addLog('No active game');
            return;
        }
        try {
            // Get first card from current player's hand
            const currentPlayer = gameState.players.find(p => p.isCurrentTurn);
            if (!currentPlayer || currentPlayer.cards.length === 0) {
                addLog('No cards available to play');
                return;
            }

            const card = currentPlayer.cards[0];
            await playCard({
                roomCode,
                cardId: card.id,
                chosenColor: card.type === 'wild' || card.type === 'wild4' ? 'red' as CardColor : undefined
            });
            addLog(`Played card: ${card.type} ${card.color}`);
        } catch (err) {
            addLog(`Error playing card: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleDrawCard = async () => {
        if (!roomCode) {
            addLog('No room code available');
            return;
        }
        try {
            await drawCard(roomCode);
            addLog('Drew a card');
        } catch (err) {
            addLog(`Error drawing card: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Socket Tester</h1>

            {/* Connection Status */}
            <div className="mb-4">
                <p>Status: {isInitializing ? 'Initializing...' : isConnected ? 'Connected' : 'Disconnected'}</p>
                {error && <p className="text-red-500">Error: {error}</p>}
            </div>

            {/* Game Controls */}
            <div className="space-y-2 mb-4">
                <button
                    onClick={handleCreateGame}
                    disabled={!isConnected}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                >
                    Create Game
                </button>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        placeholder="Room Code"
                        className="px-2 py-1 border rounded"
                    />
                    <button
                        onClick={handleJoinGame}
                        disabled={!isConnected || !roomCode}
                        className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
                    >
                        Join Game
                    </button>
                </div>

                <button
                    onClick={handlePlayCard}
                    disabled={!isConnected || !roomCode || !gameState}
                    className="px-4 py-2 bg-yellow-500 text-white rounded disabled:opacity-50"
                >
                    Play Card
                </button>

                <button
                    onClick={handleDrawCard}
                    disabled={!isConnected || !roomCode || !gameState}
                    className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
                >
                    Draw Card
                </button>
            </div>

            {/* Game State */}
            {gameState && (
                <div className="mb-4">
                    <h2 className="text-xl font-bold">Game State</h2>
                    <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-60">
                        {JSON.stringify(gameState, null, 2)}
                    </pre>
                </div>
            )}

            {/* Logs */}
            <div>
                <h2 className="text-xl font-bold mb-2">Logs</h2>
                <div className="bg-black text-green-400 p-4 rounded font-mono h-60 overflow-auto">
                    {logs.map((log, index) => (
                        <div key={index} className="whitespace-pre-wrap">
                            {log}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}