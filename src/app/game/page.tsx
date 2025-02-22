'use client';

import { useState } from 'react';
import GameRoom from '@/components/GameRoom';

export default function GamePage() {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    setHasJoined(true);
  };

  if (hasJoined) {
    return <GameRoom initialRoomId={isJoining ? roomId : undefined} username={username} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">UNO Game</h1>
        
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setIsJoining(false)}
              className={`flex-1 py-2 rounded-md ${
                !isJoining ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Create Game
            </button>
            <button
              type="button"
              onClick={() => setIsJoining(true)}
              className={`flex-1 py-2 rounded-md ${
                isJoining ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Join Game
            </button>
          </div>

          {isJoining && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter room ID"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600"
          >
            {isJoining ? 'Join Game' : 'Create Game'}
          </button>
        </form>
      </div>
    </div>
  );
}