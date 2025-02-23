'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { RoomCodeGenerator } from '@/utils/roomCode';
import {
  Settings,
  Users,
  Timer,
  DoorOpen,
  Copy,
  ArrowLeft,
  Loader2,
  Share2
} from 'lucide-react';

interface GameSettings {
  roomName: string;
  maxPlayers: number;
  timePerTurn: number;
  isPrivate: boolean;
}

interface RoomData {
  code: string;
  createdAt: string;
  expiresAt: string;
}

export default function CreateGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams?.get('username') || '';
  const { isConnected, createGame } = useSocket();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [settings, setSettings] = useState<GameSettings>({
    roomName: `${username}'s Room`,
    maxPlayers: 4,
    timePerTurn: 30,
    isPrivate: false,
  });
  const [isCreating, setIsCreating] = useState(false);

// Update the handleCreateRoom function in your CreateGamePage
const handleCreateRoom = async () => {
  if (!username || isCreating) return;
  setIsCreating(true);
  
  try {
    const newRoomData = generateUniqueRoomCode();
    createGame(username, settings); // Pass the settings to createGame
    setRoomData(newRoomData);
    
    // Navigation will be handled by the socket event listener
  } catch (error) {
    console.error('Failed to create room:', error);
  } finally {
    setIsCreating(false);
  }
};

  const generateUniqueRoomCode = () => {
    const code = RoomCodeGenerator.generateRoomCode(username);
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return {
      code,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString()
    };
  };

  const FormField = ({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        <div className="flex items-center gap-2 mb-1">
          <Icon size={18} className="text-gray-600" />
          {label}
        </div>
      </label>
      {children}
    </div>
  );

  const RoomCodeDisplay = () => {
    if (!roomData) return null;

    const copyRoomCode = () => {
      navigator.clipboard.writeText(roomData.code);
    };

    const shareGame = async () => {
      const shareUrl = `${window.location.origin}/game/join?code=${roomData.code}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Join my UNO game!',
            text: `Join my game room with code: ${roomData.code}`,
            url: shareUrl
          });
        } catch (err) {
          navigator.clipboard.writeText(shareUrl);
        }
      } else {
        navigator.clipboard.writeText(shareUrl);
      }
    };

    const expiryTime = new Date(roomData.expiresAt);
    const timeRemaining = expiryTime.getTime() - Date.now();
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Room Code</p>
            <p className="text-4xl font-mono font-bold text-gray-800 tracking-wider">
              {roomData.code}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyRoomCode}
              className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-gray-50 
                       text-gray-700 rounded-lg transition-colors flex items-center 
                       justify-center gap-2 shadow-sm"
            >
              <Copy size={18} />
              <span className="sm:hidden">Copy Code</span>
            </button>
            <button
              onClick={shareGame}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 
                       text-white rounded-lg transition-colors flex items-center 
                       justify-center gap-2 shadow-sm"
            >
              <Share2 size={18} />
              <span className="sm:hidden">Share</span>
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600 flex items-center gap-2">
          <Timer size={16} />
          Expires in: {hoursRemaining}h {minutesRemaining}m
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <button
            onClick={() => router.push('/')}
            className="text-white/90 hover:text-white flex items-center gap-2 
                     hover:bg-white/10 rounded-lg px-4 py-2 transition-all"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-xl shadow-xl overflow-hidden backdrop-blur-xl"
        >
          <div className="p-6 md:p-8 border-b bg-gradient-to-r from-gray-50 to-white">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Create Game Room</h1>
            <p className="text-gray-600 mt-1">Customize your UNO game settings</p>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Connected to server' : 'Connecting to server...'}
              </span>
            </div>

            <div className="space-y-6">
              <FormField label="Room Name" icon={DoorOpen}>
                <input
                  type="text"
                  value={settings.roomName}
                  onChange={(e) => setSettings({ ...settings, roomName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border bg-white focus:ring-2 
                           focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  placeholder="Enter room name"
                />
              </FormField>

              <FormField label="Maximum Players" icon={Users}>
                <select
                  value={settings.maxPlayers}
                  onChange={(e) => setSettings({ ...settings, maxPlayers: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-lg border bg-white focus:ring-2 
                           focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                >
                  {[2, 3, 4, 6].map(num => (
                    <option key={num} value={num}>{num} Players</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Time per Turn" icon={Timer}>
                <select
                  value={settings.timePerTurn}
                  onChange={(e) => setSettings({ ...settings, timePerTurn: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-lg border bg-white focus:ring-2 
                           focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                >
                  {[15, 30, 45, 60].map(sec => (
                    <option key={sec} value={sec}>{sec} seconds</option>
                  ))}
                </select>
              </FormField>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={settings.isPrivate}
                  onChange={(e) => setSettings({ ...settings, isPrivate: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPrivate" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Settings size={18} />
                  Make this room private
                </label>
              </div>
            </div>

            {roomData && <RoomCodeDisplay />}

            <button
              onClick={handleCreateRoom}
              disabled={!isConnected || isCreating || !settings.roomName.trim()}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium
                       hover:bg-blue-700 transition-all disabled:bg-gray-400
                       disabled:cursor-not-allowed flex items-center justify-center 
                       gap-2 shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {isCreating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Creating Room...
                </>
              ) : (
                'Create Room'
              )}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-center text-white/90"
        >
          Creating game as: <span className="font-bold text-white">{username}</span>
        </motion.div>
      </div>
    </div>
  );
}