export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'black';
export type CardType = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface Card {
  id: string;
  color: CardColor;
  type: CardType;
  value?: number;
  isWild?: boolean;
}

export interface Player {
  id: string;
  username: string;
  hand: Card[];
  isHost: boolean;
}

export interface GameState {
  roomCode: string;
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  deck: Card[];
  discardPile: Card[];
  currentColor: CardColor;
  lastPlayedCard?: Card;
  gameStatus: 'waiting' | 'playing' | 'finished';
  winner?: Player;
  settings: GameSettings;
  turnStartTime: number;
  turnTimeLeft: number;
  lastAction?: {
    type: string;
    player: string;
    card?: Card;
    timestamp: number;
  };
}

export interface Player {
  id: string;
  username: string;
  cards: Card[];
  isHost: boolean;
  isCurrentTurn: boolean;
  isConnected: boolean;
  score: number;
  lastAction?: {
    type: 'play' | 'draw' | 'skip';
    timestamp: number;
  };
}

export interface GameSettings {
  roomName: string;
  maxPlayers: number;
  timePerTurn: number;
  isPrivate: boolean;
}






