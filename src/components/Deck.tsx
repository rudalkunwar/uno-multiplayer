import type React from "react"
import { motion } from "framer-motion"
import Card from "./Card"
import { Shuffle } from "lucide-react"

interface DeckProps {
  onDrawCard?: () => void
  disabled?: boolean
}

const Deck: React.FC<DeckProps> = ({ onDrawCard, disabled = false }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative group w-20 h-32 bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer shadow-xl"
      onClick={!disabled ? onDrawCard : undefined}
    >
      <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center z-10 group-hover:opacity-100 opacity-0 transition duration-300">
        <Shuffle className="w-8 h-8 text-white" />
      </div>

      <div className="stacked-cards absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center z-0">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="stacked-card"
            style={{
              transform: `translate(${i * 3}px, ${i * 3}px)`,
            }}
          >
            <Card color="black" value="" disabled />
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default Deck
