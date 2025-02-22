'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { GameState, Player, Card, CardColor } from '@/types/game';
import { Loader } from 'lucide-react';

interface GameRoomProps {
  initialRoomId?: string;
  username: string;
}

export default function GameRoom({ initialRoomId, username }: GameRoomProps) {
  const [gameState, setGameState] = useState<Partial<GameState> | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<CardColor | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const {
    isConnected,
    error,
    createGame,
    joinGame,
    startGame,
    playCard,
    drawCard
  } = useSocket({
    onGameCreated: (data) => {
      console.log('Game created:', data);
      setPlayerId(data.playerId);
      setGameState({ roomId: data.roomId, players: [] });
    },
    onGameStateUpdated: (newState) => {
      console.log('Game state updated:', newState);
      setGameState(newState);
    },
    onPlayerJoined: (data) => {
      console.log('Player joined:', data);
      setGameState(data.gameState);
    },
    onGameStarted: (data) => {
      console.log('Game started:', data);
      setGameState(data.gameState);
    },
    onGameEnded: (data) => {
      alert(`Game Over! Winner: ${data.winner.username}`);
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  useEffect(() => {
    if (isConnected) {
      if (initialRoomId) {
        joinGame(initialRoomId, username);
      } else {
        createGame(username);
      }
    }
  }, [isConnected, initialRoomId, username]);

  const handleCardClick = (card: Card) => {
    if (!gameState?.roomId || !isCurrentTurn) return;

    if (card.type === 'wild' || card.type === 'wildDrawFour') {
      setSelectedCard(card);
      setShowColorPicker(true);
    } else {
      playCard(gameState.roomId, card.id);
    }
  };

  const handleColorSelection = (color: CardColor) => {
    if (!gameState?.roomId || !selectedCard) return;

    playCard(gameState.roomId, selectedCard.id, color);
    setShowColorPicker(false);
    setSelectedCard(null);
  };

  const handleDrawCard = () => {
    if (gameState?.roomId && isCurrentTurn) {
      drawCard(gameState.roomId);
    }
  };

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const currentPlayer = gameState.players?.find(p => p.id === playerId);
  const isCurrentTurn = gameState.currentPlayerIndex === gameState.players?.findIndex(p => p.id === playerId);

  const getCardColor = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-500';
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      default: return 'bg-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Game Header */}
      <div className="mb-8 bg-white rounded-lg p-4 shadow-md">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Room: {gameState.roomId}</h2>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {/* Players List */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        {gameState.players?.map((player) => (
          <div
            key={player.id}
            className={`p-4 rounded-lg shadow-md ${
              gameState.currentPlayerIndex === gameState.players?.indexOf(player)
                ? 'bg-yellow-100'
                : 'bg-white'
            }`}
          >
            <p className="font-bold">{player.username} {player.isHost && '👑'}</p>
            <p className="text-sm text-gray-600">
              Cards: {typeof player.hand === 'number' ? player.hand : player.hand.length}
            </p>
          </div>
        ))}
      </div>

      {/* Game Controls */}
      {currentPlayer?.isHost && !gameState.isGameStarted && (
        <button
          onClick={() => gameState.roomId && startGame(gameState.roomId)}
          className="w-full md:w-auto mb-8 bg-green-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-600 transition-colors"
        >
          Start Game
        </button>
      )}

      {/* Game Area */}
      {gameState.isGameStarted && (
        <div className="space-y-8">
          {/* Current Color & Last Card */}
          <div className="flex justify-center gap-8">
            <div className={`w-24 h-36 rounded-lg shadow-lg ${getCardColor(gameState.currentColor || 'red')}`}>
              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                Current Color
              </div>
            </div>
            {gameState.lastCard && (
              <div className={`w-24 h-36 rounded-lg shadow-lg ${getCardColor(gameState.lastCard.color)}`}>
                <div className="w-full h-full flex items-center justify-center text-white font-bold">
                  {gameState.lastCard.type === 'number' 
                    ? gameState.lastCard.value 
                    : gameState.lastCard.type}
                </div>
              </div>
            )}
          </div>

          {/* Player's Hand */}
          {currentPlayer && Array.isArray(currentPlayer.hand) && (
            <div className="flex flex-wrap justify-center gap-2">
              {currentPlayer.hand.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  disabled={!isCurrentTurn}
                  className={`w-20 h-32 rounded-lg shadow-md ${getCardColor(card.color)} 
                    ${isCurrentTurn ? 'hover:transform hover:scale-105 transition-transform' : 'opacity-75'}
                    disabled:cursor-not-allowed`}
                >
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {card.type === 'number' ? card.value : card.type}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Draw Card Button */}
          <div className="flex justify-center">
            <button
              onClick={handleDrawCard}
              disabled={!isCurrentTurn}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow-md 
                hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Draw Card
            </button>
          </div>

          {/* Color Picker Modal */}
          {showColorPicker && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg shadow-xl">
                <h3 className="text-lg font-bold mb-4">Choose a color:</h3>
                <div className="grid grid-cols-2 gap-4">
                  {['red', 'blue', 'green', 'yellow'].map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorSelection(color as CardColor)}
                      className={`w-24 h-24 rounded-lg ${getCardColor(color)} 
                        hover:transform hover:scale-105 transition-transform`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}