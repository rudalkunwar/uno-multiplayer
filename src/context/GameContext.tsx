'use client';

import React, { createContext, useContext, useReducer } from 'react';
import { Card as CardType, GameState, Player } from '@/types/game';

interface GameContextType {
  gameState: GameState | null;
  currentPlayer: Player | null;
  isMyTurn: boolean;
  canPlayCard: (card: CardType) => boolean;
  dispatch: React.Dispatch<GameAction>;
}

type GameAction =
  | { type: 'SET_GAME_STATE'; payload: GameState }
  | { type: 'PLAY_CARD'; payload: { cardId: string; chosenColor?: string } }
  | { type: 'DRAW_CARD' }
  | { type: 'JOIN_GAME'; payload: { roomId: string; username: string } }
  | { type: 'CREATE_GAME'; payload: { username: string } };

const GameContext = createContext<GameContextType | undefined>(undefined);

function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return action.payload;
    default:
      return state;
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, dispatch] = useReducer(gameReducer, null);
  const playerId = typeof window !== 'undefined' ? sessionStorage.getItem('playerId') : null;

  const currentPlayer = gameState?.players?.find(p => p.id === playerId) || null;
  const isMyTurn =
    gameState?.currentPlayerIndex !== undefined &&
    gameState?.players?.[gameState.currentPlayerIndex]?.id === playerId;

  const canPlayCard = (card: CardType) => {
    if (!gameState || !isMyTurn) return false;

    const topCard = gameState.lastCard;
    if (!topCard) return true;

    return (
      card.color === gameState.currentColor ||
      card.type === topCard.type ||
      card.type === 'wild' ||
      card.type === 'wildDrawFour' ||
      (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value)
    );
  };

  return (
    <GameContext.Provider value={{ gameState, currentPlayer, isMyTurn, canPlayCard, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
