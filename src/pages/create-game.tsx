import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSocket } from '../hooks/useSocket';
import { useGame } from '../context/GameContext';

interface GameSettings {
  maxPlayers: number;
  timePerTurn: number;
  stackingEnabled: boolean;
  forcePlay: boolean;
  drawToMatch: boolean;
  jumpInRule: boolean;
  sevenZeroRule: boolean;
}

interface RuleDescription {
  title: string;
  description: string;
}

const ruleDescriptions: Record<keyof Omit<GameSettings, 'maxPlayers' | 'timePerTurn'>, RuleDescription> = {
  stackingEnabled: {
    title: "Card Stacking (+2/+4)",
    description: "Players can stack Draw 2 and Draw 4 cards, passing the accumulated sum to the next player."
  },
  forcePlay: {
    title: "Force Play",
    description: "Players must play a card if they have a valid one in their hand."
  },
  drawToMatch: {
    title: "Draw to Match",
    description: "Players must keep drawing cards until they get a playable card."
  },
  jumpInRule: {
    title: "Jump-In Rule",
    description: "Players can play an exact matching card out of turn to skip to their turn."
  },
  sevenZeroRule: {
    title: "Seven-Zero Rule",
    description: "Playing a 7 lets you swap hands with another player. Playing a 0 makes all players rotate hands."
  }
};

export default function CreateGame() {
    const router = useRouter();
    const { createRoom } = useSocket();
    const { state } = useGame();
    const [roomName, setRoomName] = useState('');
    const [showRuleInfo, setShowRuleInfo] = useState<string | null>(null);
    const [settings, setSettings] = useState<GameSettings>({
        maxPlayers: 4,
        timePerTurn: 30,
        stackingEnabled: true,
        forcePlay: false,
        drawToMatch: true,
        jumpInRule: false,
        sevenZeroRule: false,
    });

    const handleSettingChange = (setting: keyof GameSettings, value: any) => {
        setSettings(prev => ({
            ...prev,
            [setting]: value
        }));
    };

    const handleCreateRoom = async () => {
        try {
            if (!state.isConnected) {
                throw new Error('Not connected to server');
            }

            // Create room through socket connection
            createRoom({
                name: roomName,
                settings: settings
            });

            // Router push is now handled by the socket event listener in useSocket
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-800 to-blue-900 py-8 px-4">
            <Head>
                <title>Create UNO Game Room</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
                <h1 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
                    Create UNO Game Room
                </h1>

                <div className="space-y-8">
                    {/* Connection Status */}
                    <div className={`text-center p-2 rounded-lg ${state.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {state.isConnected ? '🟢 Connected to server' : '🔴 Not connected to server'}
                    </div>

                    {/* Room Name Input */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                            Room Name
                        </label>
                        <input
                            type="text"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            placeholder="Enter room name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                    </div>

                    {/* Player Settings */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Game Settings</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Max Players */}
                            <div>
                                <label className="block text-gray-700 mb-2">Max Players</label>
                                <select
                                    value={settings.maxPlayers}
                                    onChange={(e) => handleSettingChange('maxPlayers', parseInt(e.target.value))}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    {[2,3,4,5,6,7,8,9,10].map(num => (
                                        <option key={num} value={num}>{num} players</option>
                                    ))}
                                </select>
                            </div>

                            {/* Time per Turn */}
                            <div>
                                <label className="block text-gray-700 mb-2">Time per Turn</label>
                                <select
                                    value={settings.timePerTurn}
                                    onChange={(e) => handleSettingChange('timePerTurn', parseInt(e.target.value))}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    {[15, 30, 45, 60, 90, 120].map(num => (
                                        <option key={num} value={num}>{num} seconds</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Game Rules */}
                        <div className="mt-6 space-y-3">
                            {Object.entries(ruleDescriptions).map(([key, rule]) => (
                                <div key={key} className="relative">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={key}
                                            checked={settings[key as keyof GameSettings] as boolean}
                                            onChange={(e) => handleSettingChange(key as keyof GameSettings, e.target.checked)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <label htmlFor={key} className="ml-2 text-gray-700">
                                            {rule.title}
                                        </label>
                                        <button
                                            type="button"
                                            className="ml-2 text-gray-400 hover:text-gray-600"
                                            onClick={() => setShowRuleInfo(showRuleInfo === key ? null : key)}
                                        >
                                            ⓘ
                                        </button>
                                    </div>
                                    {showRuleInfo === key && (
                                        <div className="mt-2 ml-6 p-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                                            {rule.description}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Create Button */}
                    <div className="flex space-x-4">
                        <button
                            onClick={() => router.back()}
                            className="flex-1 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all duration-300"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleCreateRoom}
                            disabled={!roomName.trim() || !state.isConnected}
                            className={`flex-1 py-3 rounded-lg text-white font-semibold transition-all duration-300 
                                ${(roomName.trim() && state.isConnected)
                                    ? 'bg-green-500 hover:bg-green-600' 
                                    : 'bg-gray-400 cursor-not-allowed'}`}
                        >
                            Create Room
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}