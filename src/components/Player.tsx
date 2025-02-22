import type React from "react"
import { motion } from "framer-motion"
import Card from "./Card"

interface PlayerProps {
    id: number
    name: string
    cards: {
        color: "red" | "blue" | "green" | "yellow" | "black"
        value: string | number
    }[]
    isCurrentTurn: boolean
    onCardPlay?: (card: { color: string; value: string | number }) => void
}

const Player: React.FC<PlayerProps> = ({ id, name, cards, isCurrentTurn, onCardPlay }) => {
    return (
        <div className={`flex flex-col items-center bg-gray-800 rounded-lg p-4 m-2 shadow-lg ${isCurrentTurn ? "border-4 border-yellow-500" : ""}`}>
            <div className="text-white text-lg font-semibold mb-2">
                <span>{name}</span>
            </div>
            <motion.div className="flex space-x-2 mt-2">
                {cards.map((card, index) => (
                    <motion.div
                        key={index}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-16 h-24 cursor-pointer rounded-md transition-all duration-200 ${isCurrentTurn ? "opacity-100" : "opacity-50"}`}
                        onClick={isCurrentTurn ? () => onCardPlay?.(card) : undefined}
                    >
                        <Card color={card.color} value={card.value} />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    )
}

export default Player
