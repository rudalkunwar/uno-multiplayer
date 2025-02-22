"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Pause, RotateCcw, Plus, Shuffle, Ban } from "lucide-react"

interface CardProps {
  color: "red" | "blue" | "green" | "yellow" | "black"
  value: string | number
  onClick?: () => void
  disabled?: boolean
  isSelected?: boolean
}

const colorSchemes = {
  red: { bg: "from-red-600 to-red-400", text: "text-red-600", shadow: "shadow-red-700/50" },
  blue: { bg: "from-blue-600 to-blue-400", text: "text-blue-600", shadow: "shadow-blue-700/50" },
  green: { bg: "from-green-600 to-green-400", text: "text-green-600", shadow: "shadow-green-700/50" },
  yellow: { bg: "from-yellow-500 to-yellow-300", text: "text-yellow-600", shadow: "shadow-yellow-600/50" },
  black: { bg: "from-gray-800 to-gray-600", text: "text-gray-800", shadow: "shadow-gray-900/50" },
}

const specialIcons = {
  SKIP: Pause,
  REVERSE: RotateCcw,
  "+2": Plus,
  "+4": Plus,
  WILD: Shuffle,
  BLOCK: Ban,
}

const Card: React.FC<CardProps> = ({ color, value, onClick, disabled = false, isSelected = false }) => {
  const scheme = colorSchemes[color] || colorSchemes.black
  const SpecialIcon = specialIcons[value as keyof typeof specialIcons]
  const isSpecial = SpecialIcon !== undefined

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={!disabled ? { scale: 1.05, y: -5, transition: { type: "spring", stiffness: 300 } } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      className={`
        relative w-full aspect-[2/3] max-w-[200px] rounded-2xl 
        ${disabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer"} 
        transition-all duration-200 ${scheme.shadow}
        ${isSelected ? "ring-4 ring-white/50" : ""}
      `}
      onClick={!disabled ? onClick : undefined}
    >
      <motion.div
        className={`
          absolute inset-0 bg-gradient-to-br ${scheme.bg}
          rounded-2xl border-[3px] sm:border-4 border-white overflow-hidden
        `}
      >
        <ShineEffect />
        <CardContent value={value} SpecialIcon={SpecialIcon} isSpecial={isSpecial} scheme={scheme} />
        <CardCorners value={value} isSpecial={isSpecial} />
        <CardBranding />
      </motion.div>
    </motion.div>
  )
}

const ShineEffect: React.FC = () => (
  <motion.div
    initial={{ x: "-100%" }}
    animate={{
      x: "200%",
      transition: { repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "linear" },
    }}
    className="absolute top-0 left-0 w-1/4 h-full 
      bg-gradient-to-r from-transparent via-white/30 to-transparent 
      transform -skew-x-12"
  />
)

const CardContent: React.FC<{
  value: string | number
  SpecialIcon?: React.ElementType
  isSpecial: boolean
  scheme: any
}> = ({ value, SpecialIcon, isSpecial, scheme }) => (
  <div className="absolute inset-[12%] flex items-center justify-center">
    <div className="relative w-full h-full">
      <div className="absolute inset-0 bg-white rounded-full transform rotate-45" />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
        className={`
          absolute inset-0 flex items-center justify-center
          ${scheme.text} text-4xl sm:text-5xl md:text-6xl font-bold
        `}
        style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.1)" }}
      >
        {isSpecial && SpecialIcon ? <SpecialIcon className="w-3/5 h-3/5" /> : value}
      </motion.div>
    </div>
  </div>
)

const CardCorners: React.FC<{ value: string | number; isSpecial: boolean }> = ({ value, isSpecial }) => (
  <>
    <div className="absolute top-2 left-2 text-white text-lg sm:text-xl font-bold drop-shadow-md">
      {isSpecial ? "" : value}
    </div>
    <div className="absolute bottom-2 right-2 text-white text-lg sm:text-xl font-bold rotate-180 drop-shadow-md">
      {isSpecial ? "" : value}
    </div>
  </>
)

const CardBranding: React.FC = () => (
  <div
    className="absolute top-2 right-2 
    text-white text-base sm:text-lg font-bold tracking-widest
    drop-shadow-[0_0_3px_rgba(0,0,0,0.5)]"
  >
    UNO
  </div>
)

export default Card

