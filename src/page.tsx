"use client"

import React, { useState } from 'react';
import GameBoard from './components/GameBoard';
import Controls from './components/Controls';

const GamePage: React.FC = () => {
  const [players, setPlayers] = useState([
    { id: 1, name: "Player 1", cards: [], isCurrentTurn: true },
    { id: 2, name: "Player 2", cards: [], isCurrentTurn: false }
  ]);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [discardPile, setDiscardPile] = useState([]);

  const handleCardPlay = (card) => {
    // Logic to handle card play
  };

  const handleDrawCard = () => {
    // Logic to handle drawing a card
  };

  const handlePlayCard = () => {
    // Logic to handle play card action
  };

  const handlePauseGame = () => {
    // Logic to handle pause game action
  };

  const handleReversePlay = () => {
    // Logic to handle reverse play action
  };

  const handleAddTwoCards = () => {
    // Logic to handle add two cards action
  };

  const handleAddFourCards = () => {
    // Logic to handle add four cards action
  };

  const handleShuffleDeck = () => {
    // Logic to handle shuffle deck action
  };

  const handleBlockPlayer = () => {
    // Logic to handle block player action
  };

  return (
    <div className="game-page">
      <GameBoard
        players={players}
        currentPlayer={currentPlayer}
        discardPile={discardPile}
        onCardPlay={handleCardPlay}
        onDrawCard={handleDrawCard}
      />
      <Controls
        onPlayCard={handlePlayCard}
        onPauseGame={handlePauseGame}
        onReversePlay={handleReversePlay}
        onAddTwoCards={handleAddTwoCards}
        onAddFourCards={handleAddFourCards}
        onShuffleDeck={handleShuffleDeck}
        onBlockPlayer={handleBlockPlayer}
      />
    </div>
  );
};

export default GamePage;