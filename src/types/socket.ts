import { GameState, Player, GameSettings, CardColor } from './game';

/**
 * @description Socket event and payload type definitions
 * @created 2025-02-25 07:13:11
 * @author rudalkunwar
 */

export interface GameEvents {
  onGameCreated: (data: CreateGameResponse) => void;
  onGameStateUpdated: (gameState: GameState) => void;
  onPlayerJoined: (data: { gameState: GameState; newPlayer: Player }) => void;
  onGameReady: (data: { playersCount: number }) => void;
  onGameStarted: (data: { gameState: GameState }) => void;
  onGameEnded: (data: { winner: Player; gameState: GameState }) => void;
  onError: (error: SocketError) => void;
}

export interface CreateGamePayload {
  username: string;
  settings: GameSettings & { roomCode?: string };
}

export interface CreateGameResponse {
  roomCode: string;
  gameState: GameState;
  settings: GameSettings;
}

export interface JoinGamePayload {
  roomCode: string;
  username: string;
}

export interface PlayCardPayload {
  roomCode: string;
  cardId: string;
  chosenColor?: CardColor;
}

export interface SocketError {
  message: string;
  code?: string;
}