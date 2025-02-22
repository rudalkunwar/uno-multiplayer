import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, RotateCcw } from 'lucide-react';
import Card from './Card';

interface Player {
    id: number;
    name: string;
    cards: CardType[];
    isCurrentTurn: boolean;
}

interface CardType {
    color: "red" | "blue" | "green" | "yellow" | "black";
    value: string | number;
}

interface GameBoardProps {
    players: Player[];
    currentPlayer: number;
    discardPile: CardType[];
    onCardPlay?: (card: CardType) => void;
    onDrawCard?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
    players,
    currentPlayer,
    discardPile,
    onCardPlay,
    onDrawCard
}) => {
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);

    return (
        <div className="relative w-full h-screen bg-green-800 p-4">
            {/* Center game area */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                flex items-center justify-center gap-8">

                {/* Draw pile */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative cursor-pointer"
                    onClick={onDrawCard}
                >
                    <div className="relative">
                        {/* Stacked cards effect */}
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute"
                                style={{
                                    transform: `translate(${i * 2}px, ${i * 2}px)`,
                                    zIndex: i
                                }}
                            >
                                <Card
                                    color="black"
                                    value=""
                                    disabled={currentPlayer !== players[0].id}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                        text-white/80">
                        <Shuffle className="w-12 h-12" />
                    </div>
                </motion.div>

                {/* Discard pile */}
                <div className="relative">
                    {discardPile.slice(-3).map((card, index) => (
                        <div
                            key={index}
                            className="absolute"
                            style={{
                                transform: `rotate(${(index - 1) * 15}deg)`,
                                zIndex: index
                            }}
                        >
                            <Card
                                color={card.color}
                                value={card.value}
                                disabled={true}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Current player's hand */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <motion.div className="flex gap-2">
                    {players[0].cards.map((card, index) => (
                        <motion.div
                            key={index}
                            animate={{
                                y: hoveredCard === index ? -20 : 0
                            }}
                            className="relative"
                            onHoverStart={() => setHoveredCard(index)}
                            onHoverEnd={() => setHoveredCard(null)}
                        >
                            <Card
                                color={card.color}
                                value={card.value}
                                onClick={() => onCardPlay?.(card)}
                                disabled={currentPlayer !== players[0].id}
                                isSelected={hoveredCard === index}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Opponent hands (face down) */}
            {players.slice(1).map((player, index) => {
                const position = getPlayerPosition(index + 1, players.length - 1);
                return (
                    <div
                        key={player.id}
                        className={`absolute ${position} flex gap-1`}
                    >
                        <div className={`text-white mb-2 ${player.isCurrentTurn ? 'text-yellow-300' : ''}`}>
                            {player.name}
                        </div>
                        <div className="flex gap-1">
                            {[...Array(player.cards.length)].map((_, cardIndex) => (
                                <Card
                                    key={cardIndex}
                                    color="black"
                                    value=""
                                    disabled={true}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Current turn indicator */}
            <div className="absolute top-4 left-4 text-white text-xl">
                Current Turn: {players.find(p => p.id === currentPlayer)?.name}
            </div>

            {/* Direction indicator */}
            <div className="absolute top-4 right-4 text-white">
                <RotateCcw className="w-8 h-8" />
            </div>
        </div>
    );
};

// Helper function to position players around the board
const getPlayerPosition = (playerIndex: number, totalPlayers: number): string => {
    if (totalPlayers <= 1) return 'top-4 left-1/2 -translate-x-1/2';

    switch (playerIndex) {
        case 0: return 'top-4 left-1/2 -translate-x-1/2';
        case 1: return 'top-1/2 -translate-y-1/2 right-4';
        case 2: return 'top-4 left-1/2 -translate-x-1/2';
        case 3: return 'top-1/2 -translate-y-1/2 left-4';
        default: return 'top-4 left-1/2 -translate-x-1/2';
    }
};

export default GameBoard;