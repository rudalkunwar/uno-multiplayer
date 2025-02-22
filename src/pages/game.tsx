import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useGame } from '../context/GameContext'
import { GameBoard } from '../components/GameBoard'

export default function Game() {
  const router = useRouter()
  const { state } = useGame()

  useEffect(() => {
    if (!state.roomCode) {
      router.push('/lobby')
    }
  }, [state.roomCode, router])

  if (!state.roomCode) {
    return null
  }

  return <GameBoard />
}