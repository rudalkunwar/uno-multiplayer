'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';

export default function GamePage() {
  const { isConnected, joinGame, playCard } = useSocket();
  const [roomId, setRoomId] = useState<string>('');

  useEffect(() => {
    if (isConnected) {
      console.log('Connected to socket server');
    }
  }, [isConnected]);

  const handleJoinGame = () => {
    if (roomId) {
      joinGame(roomId);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <p>Connection Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      </div>
      
      <div className="mb-4">
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter Room ID"
          className="border p-2 mr-2"
        />
        <button
          onClick={handleJoinGame}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Join Game
        </button>
      </div>
    </div>
  );
}