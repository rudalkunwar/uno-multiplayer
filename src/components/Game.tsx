'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Card, GameState, Player } from '@/types/game';
import PlayerHand from './PlayerHand';
import GameBoard from './GameBoard';
import GameControls from './GameControls';
import GameInfo from './GameInfo';
import { motion, AnimatePresence } from 'framer-motion';

interface GameProps {
  roomCode: string;
  username: string;
}

export default function Game({ roomCode, username }: GameProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [colorSelectOpen, setColorSelectOpen] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);

  const {
    isConnected,
    error: socketError,
    playCard,
    drawCard,
  } = useSocket({
    onGameStateUpdated: (newState: GameState) => {
      setGameState(newState);
      // Reset UI states when game state updates
      setSelectedCard(null);
      setColorSelectOpen(false);
    },
    onError: (error) => {
      setGameError(error.message);
      // Show error toast or notification
    },
  });

  const currentPlayer = gameState?.players.find(p => p.id === username);
  const isMyTurn = currentPlayer?.isCurrentTurn;

  const handleCardSelect = (card: Card) => {
    if (!isMyTurn) return;
    setSelectedCard(card);

    if (card.isWild) {
      setColorSelectOpen(true);
    }
  };

  const handleCardPlay = async (card: Card, selectedColor?: string) => {
    if (!isMyTurn || !gameState) return;

    try {
      await playCard({
        roomCode: gameState.roomCode,
        cardId: card.id,
        chosenColor: selectedColor,
      });
    } catch (error) {
      setGameError('Failed to play card. Please try again.');
    }
  };

  const handleDrawCard = async () => {
    if (!isMyTurn || !gameState) return;

    try {
      await drawCard(gameState.roomCode);
    } catch (error) {
      setGameError('Failed to draw card. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-4">
      <AnimatePresence>
        {gameError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg"
          >
            {gameError}
            <button
              onClick={() => setGameError(null)}
              className="ml-3 text-white font-bold"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <GameInfo
          gameState={gameState}
          currentPlayer={currentPlayer}
          isConnected={isConnected}
        />

        <div className="relative mt-8">
          <GameBoard
            gameState={gameState}
            onDrawCard={handleDrawCard}
            canDraw={isMyTurn}
          />

          {currentPlayer && (
            <PlayerHand
              cards={currentPlayer.cards}
              canPlay={isMyTurn}
              selectedCard={selectedCard}
              onCardSelect={handleCardSelect}
            />
          )}

          <GameControls
            isMyTurn={isMyTurn}
            selectedCard={selectedCard}
            colorSelectOpen={colorSelectOpen}
            onColorSelect={(color) => {
              if (selectedCard) {
                handleCardPlay(selectedCard, color);
                setColorSelectOpen(false);
              }
            }}
            onCancelPlay={() => {
              setSelectedCard(null);
              setColorSelectOpen(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}