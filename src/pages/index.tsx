import { useState } from 'react'
import { useRouter } from 'next/router'
import { useSocket } from '../hooks/useSocket'
import Head from 'next/head'

export default function Home() {
  const router = useRouter()
  const { joinLobby, createRoom } = useSocket()
  const [playerName, setPlayerName] = useState('')
  const [showOptions, setShowOptions] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [showJoinInput, setShowJoinInput] = useState(false)

  const handleContinue = () => {
    if (playerName.trim()) {
      joinLobby(playerName)
      setShowOptions(true)
    }
  }

  const handleCreateGame = () => {
    createRoom()
    router.push('/create-game')
  }

  const handleJoinGame = () => {
    if (showJoinInput && joinCode.trim()) {
      router.push(`/game?code=${joinCode}`)
    } else {
      setShowJoinInput(true)
    }
  }

  return (
    <>
      <Head>
        <title>UNO Game Lobby</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-800 to-blue-900 py-4 px-2">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <h1 className="text-4xl font-extrabold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
            UNO Game
          </h1>

          {!showOptions ? (
            // Name Input Screen
            <div className="space-y-6">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors"
              />
              <button
                onClick={handleContinue}
                disabled={!playerName.trim()}
                className={`w-full py-3 rounded-lg text-white font-semibold transition-all duration-300 ${playerName.trim()
                    ? 'bg-purple-500 hover:bg-purple-600'
                    : 'bg-gray-400 cursor-not-allowed'
                  }`}
              >
                Continue
              </button>
            </div>
          ) : (
            // Game Options Screen
            <div className="space-y-6">
              <p className="text-center text-gray-700 text-lg">
                Welcome, <span className="font-bold">{playerName}</span>!
              </p>

              <button
                onClick={handleCreateGame}
                className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all duration-300"
              >
                Create New Game
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {showJoinInput ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter game code"
                    className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors uppercase"
                    maxLength={6}
                  />
                  <button
                    onClick={handleJoinGame}
                    disabled={!joinCode.trim()}
                    className={`w-full py-3 rounded-lg text-white font-semibold transition-all duration-300 ${joinCode.trim()
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-gray-400 cursor-not-allowed'
                      }`}
                  >
                    Join Game
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleJoinGame}
                  className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all duration-300"
                >
                  Join Existing Game
                </button>
              )}

              <button
                onClick={() => {
                  setShowOptions(false)
                  setShowJoinInput(false)
                  setJoinCode('')
                }}
                className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                Change Name
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}