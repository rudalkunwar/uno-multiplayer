export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardType = 
  | 'number' 
  | 'skip' 
  | 'reverse' 
  | 'drawTwo' 
  | 'wild' 
  | 'wildDrawFour';

export interface Card {
  id: string;
  color: CardColor;
  type: CardType;
  value?: number; // for number cards
}

export interface Player {
  id: string;
  username: string;
  hand: Card[];
  isHost: boolean;
}

export interface GameState {
  roomId: string;
  players: Player[];
  currentPlayerIndex: number;
  deck: Card[];
  discardPile: Card[];
  direction: 1 | -1; // 1 for clockwise, -1 for counter-clockwise
  isGameStarted: boolean;
  lastCard: Card | null;
  winner: string | null;
  currentColor: CardColor; // for wild cards
}