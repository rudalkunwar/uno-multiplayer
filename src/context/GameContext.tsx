import { createContext, useContext, useReducer, ReactNode } from 'react'

// Types
export interface Card {
  color: 'red' | 'blue' | 'green' | 'yellow' | 'wild'
  value: number | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wildDraw4'
}

export interface Player {
  id: string
  name: string
  cards: Card[]
  isCurrentTurn: boolean
}

interface GameState {
  isConnected: boolean
  roomCode: string | null
  players: Player[]
  currentPlayer: string | null
  topCard: Card | null
  myCards: Card[]
  gameStatus: 'waiting' | 'playing' | 'finished'
  winner: string | null
}

type GameAction =
  | { type: 'SET_CONNECTION'; payload: boolean }
  | { type: 'JOIN_ROOM'; payload: string }
  | { type: 'UPDATE_GAME_STATE'; payload: Partial<GameState> }
  | { type: 'PLAY_CARD'; payload: { cardIndex: number } }
  | { type: 'DRAW_CARD' }
  | { type: 'GAME_OVER'; payload: { winner: string } }

const initialState: GameState = {
  isConnected: false,
  roomCode: null,
  players: [],
  currentPlayer: null,
  topCard: null,
  myCards: [],
  gameStatus: 'waiting',
  winner: null,
}

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_CONNECTION':
      return { ...state, isConnected: action.payload }
    case 'JOIN_ROOM':
      return { ...state, roomCode: action.payload }
    case 'UPDATE_GAME_STATE':
      return { ...state, ...action.payload }
    case 'PLAY_CARD':
      return {
        ...state,
        myCards: state.myCards.filter((_, index) => index !== action.payload.cardIndex),
      }
    case 'DRAW_CARD':
      return state
    case 'GAME_OVER':
      return { ...state, gameStatus: 'finished', winner: action.payload.winner }
    default:
      return state
  }
}

const GameContext = createContext<{
  state: GameState
  dispatch: React.Dispatch<GameAction>
} | null>(null)

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}