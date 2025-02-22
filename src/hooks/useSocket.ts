import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useGame } from '../context/GameContext'

export const useSocket = () => {
  const socket = useRef<Socket | null>(null)
  const { dispatch } = useGame()

  useEffect(() => {
    // Initialize socket connection
    socket.current = io('http://localhost:3000')

    // Connection events
    socket.current.on('connect', () => {
      dispatch({ type: 'SET_CONNECTION', payload: true })
    })

    socket.current.on('disconnect', () => {
      dispatch({ type: 'SET_CONNECTION', payload: false })
    })

    // Game events
    socket.current.on('roomJoined', ({ roomCode }) => {
      dispatch({ type: 'JOIN_ROOM', payload: roomCode })
    })

    socket.current.on('gameStateUpdate', (gameState) => {
      dispatch({ type: 'UPDATE_GAME_STATE', payload: gameState })
    })

    socket.current.on('gameOver', ({ winner }) => {
      dispatch({ type: 'GAME_OVER', payload: { winner } })
    })

    return () => {
      socket.current?.disconnect()
    }
  }, [dispatch])

  const joinLobby = (playerName: string) => {
    socket.current?.emit('joinLobby', playerName)
  }

  const createRoom = (roomDetails: { name: string, settings: any }) => {
    socket.current?.emit('createRoom', roomDetails)
  }

  const joinRoom = (roomCode: string) => {
    socket.current?.emit('joinRoom', roomCode)
  }

  const playCard = (gameId: string, cardIndex: number) => {
    socket.current?.emit('playCard', { gameId, cardIndex })
  }

  const drawCard = (gameId: string) => {
    socket.current?.emit('drawCard', gameId)
  }

  return {
    joinLobby,
    createRoom,
    joinRoom,
    playCard,
    drawCard,
  }
}