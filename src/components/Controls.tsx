import type React from "react"
import { motion } from "framer-motion"
import { Play, Pause, RotateCcw, Plus, Shuffle, Ban } from "lucide-react"

interface ControlsProps {
    onPlayCard: () => void
    onPauseGame: () => void
    onReversePlay: () => void
    onAddTwoCards: () => void
    onAddFourCards: () => void
    onShuffleDeck: () => void
    onBlockPlayer: () => void
}

const Controls: React.FC<ControlsProps> = ({
    onPlayCard,
    onPauseGame,
    onReversePlay,
    onAddTwoCards,
    onAddFourCards,
    onShuffleDeck,
    onBlockPlayer,
}) => {
    return (
        <div className="flex justify-center space-x-4 p-6 bg-gray-800 rounded-lg shadow-lg">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onPlayCard}
                className="bg-blue-500 text-white p-4 rounded-full hover:bg-blue-600 transition duration-300 ease-in-out transform"
            >
                <Play className="w-6 h-6" />
            </motion.button>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onPauseGame}
                className="bg-yellow-500 text-white p-4 rounded-full hover:bg-yellow-600 transition duration-300 ease-in-out transform"
            >
                <Pause className="w-6 h-6" />
            </motion.button>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onReversePlay}
                className="bg-green-500 text-white p-4 rounded-full hover:bg-green-600 transition duration-300 ease-in-out transform"
            >
                <RotateCcw className="w-6 h-6" />
            </motion.button>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onAddTwoCards}
                className="bg-pink-500 text-white p-4 rounded-full hover:bg-pink-600 transition duration-300 ease-in-out transform"
            >
                <Plus className="w-6 h-6" />
            </motion.button>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onAddFourCards}
                className="bg-purple-500 text-white p-4 rounded-full hover:bg-purple-600 transition duration-300 ease-in-out transform"
            >
                <Plus className="w-6 h-6" />
            </motion.button>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onShuffleDeck}
                className="bg-indigo-500 text-white p-4 rounded-full hover:bg-indigo-600 transition duration-300 ease-in-out transform"
            >
                <Shuffle className="w-6 h-6" />
            </motion.button>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onBlockPlayer}
                className="bg-red-500 text-white p-4 rounded-full hover:bg-red-600 transition duration-300 ease-in-out transform"
            >
                <Ban className="w-6 h-6" />
            </motion.button>
        </div>
    )
}

export default Controls
