'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    try {
      // We'll implement the actual game creation later
      router.push(`/game/create?username=${encodeURIComponent(username)}`);
    } catch (error) {
      console.error('Failed to create game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-6xl font-bold text-white mb-2 font-game">UNO</h1>
          <p className="text-white text-lg">Online Multiplayer Card Game</p>
        </motion.div>

        {/* Main Menu */}
        {!showCreateForm ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-4"
          >
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full bg-white text-blue-600 font-bold py-4 px-6 rounded-lg shadow-lg 
                         hover:bg-blue-50 transform transition-all duration-200 hover:scale-105"
            >
              Create New Game
            </button>
            <button
              onClick={() => router.push('/game/join')}
              className="w-full bg-transparent text-white font-bold py-4 px-6 rounded-lg 
                         border-2 border-white hover:bg-white/10 transform transition-all duration-200"
            >
              Join Game
            </button>
          </motion.div>
        ) : (
          // Create Game Form
          <motion.form
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            onSubmit={handleCreateGame}
            className="bg-white rounded-lg p-6 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Game</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 
                           focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 text-gray-600 rounded-lg border border-gray-300 
                           hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !username.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg 
                           hover:bg-blue-700 transition-colors disabled:bg-blue-400 
                           disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    'Create Game'
                  )}
                </button>
              </div>
            </div>
          </motion.form>
        )}

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-white text-sm"
        >
          Created by {'rudalkunwar'} • {new Date().getFullYear()}
        </motion.p>
      </div>
    </div>
  );
}