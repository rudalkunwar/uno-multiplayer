/**
 * UNO Game Type Definitions
 * This is the complete and final type structure for the UNO card game.
 * All game logic and components will be built on top of these definitions.
 */

// -------------------- Core Types --------------------

export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'black' | 'wild'; // wild is temporary before color selection
export type CardType = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';
export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';
export type Direction = 1 | -1; // 1 for clockwise, -1 for counter-clockwise
export type ActionType = 'play' | 'draw' | 'skip' | 'challenge' | 'color_change' | 'uno_call' | 'penalty' | 'join' | 'leave' | 'timeout';
export type CardValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // Explicit number card values

// -------------------- Card Interfaces --------------------

export interface Card {
  id: string;           // Unique identifier for each card
  color: CardColor;     // Card color
  type: CardType;       // Card type
  value?: CardValue;    // Value for number cards
  points: number;       // Points value for scoring
}

// -------------------- Player Interfaces --------------------

export interface PlayerAction {
  type: ActionType;
  timestamp: number;
  card?: Card;
  targetPlayer?: string;
  calledUno?: boolean;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  cardsPlayed: number;
  specialCardsPlayed: number;
  totalScore: number;
}

export interface Player {
  id: string;
  username: string;
  cards: Card[];
  isHost: boolean;
  isCurrentTurn: boolean;
  isConnected: boolean;
  isReady: boolean;     // Player readiness state before game starts
  score: number;        // Score accumulated across rounds
  roundScore: number;   // Score for the current round
  hasCalledUno: boolean; // Whether player has called UNO with 1 card left
  lastAction?: PlayerAction;
  stats: PlayerStats;
  avatarId?: string;
  joinedAt: number;     // Timestamp when player joined
}

// -------------------- Game Settings --------------------

export interface GameSettings {
  roomName: string;
  maxPlayers: number;   // 2-10 players
  minPlayers: number;   // Minimum players to start (usually 2)
  timePerTurn: number;  // In seconds (0 for no time limit)
  isPrivate: boolean;   // Whether room requires a code to join
  scoreLimit: number;   // Score needed to win the whole game (0 for single round)
  
  // Rule variations
  stackDrawCards: boolean;     // Allow stacking +2/+4 cards
  forcePlay: boolean;          // Force player to play a card if they have a valid one
  jumpIn: boolean;             // Allow playing out of turn with identical cards
  drawUntilMatch: boolean;     // Keep drawing until player gets a playable card
  allowChallenges: boolean;    // Allow challenging wild+4 cards
  strictUno: boolean;          // Penalize players who don't call UNO
  sevenZero: boolean;          // Special rule: 7s = swap hands, 0s = rotate all hands
  noBluffing: boolean;         // Wild+4 can only be played if no other option
  passAfterDraw: boolean;      // Skip turn after drawing a card
  drawCardLimit: number;       // Maximum number of cards to draw when drawUntilMatch is true
}

// -------------------- Game State Interfaces --------------------

export interface GameAction extends PlayerAction {
  player: string;       // Player ID
  newColor?: CardColor; // For wild cards
}

export interface GameTimer {
  startTime: number;    // When the timer started
  duration: number;     // Total allowed duration in ms
  timeLeft: number;     // Time remaining in ms
  isActive: boolean;    // Whether timer is currently running
}

export interface Challenge {
  challenger: string;   // Player ID who initiated challenge
  challenged: string;   // Player ID being challenged
  card: Card;           // The card being challenged
  timestamp: number;
  isValid?: boolean;    // Result of challenge
}

export interface GameRound {
  roundNumber: number;
  startTime: number;
  endTime?: number;
  winner?: string;      // Player ID
  scores: Record<string, number>; // Player ID to score
  firstPlayer: string;  // Player who went first
}

export interface GameState {
  // Core identifiers
  id: string;           // Unique game ID
  roomCode: string;     // Shareable room code
  
  // Players
  players: Player[];
  spectators: string[]; // IDs of players who are watching
  currentPlayerIndex: number;
  
  // Game state
  direction: Direction;
  deck: Card[];
  discardPile: Card[];
  currentColor: CardColor;
  lastPlayedCard?: Card;
  gameStatus: GameStatus;
  
  // Round management
  winner?: Player;
  currentRound: number;  // Current round number
  rounds: GameRound[];   // History of rounds
  
  // Settings and timing
  settings: GameSettings;
  timer: GameTimer;
  
  // Action tracking
  lastAction?: GameAction;
  actionHistory: GameAction[]; // Recent actions (limited to last 20)
  
  // Special states
  challengePending?: Challenge; // For wild+4 challenges
  mustCallUno?: string;  // Player ID who must call UNO or face penalty
  drawPileCount: number; // Number of cards left in draw pile
  pendingCardsToDraw: number; // Accumulated +2/+4 cards when stacking
  gameCreatedAt: number; // When the game was created
  lastUpdateAt: number;  // Last state update timestamp
}

// -------------------- Events & Messages --------------------

export interface GameEvent {
  type: string;
  payload: any;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
  isSystem: boolean;
}

// -------------------- Helper Functions --------------------

/**
 * Checks if a card is a wild card (wild or wild4)
 */
export const isWildCard = (card: Card): boolean => {
  return card.type === 'wild' || card.type === 'wild4';
};

/**
 * Checks if a card is an action card (non-number)
 */
export const isActionCard = (card: Card): boolean => {
  return card.type !== 'number';
};

/**
 * Checks if a card is a draw card (draw2 or wild4)
 */
export const isDrawCard = (card: Card): boolean => {
  return card.type === 'draw2' || card.type === 'wild4';
};

/**
 * Calculates the point value of a card
 */
export const getCardPoints = (card: Card): number => {
  if (card.type === 'number') return card.value || 0;
  if (card.type === 'skip' || card.type === 'reverse' || card.type === 'draw2') return 20;
  return 50; // wild and wild4
};

/**
 * Determines if a card can be played on top of the current card
 */
export const canPlayOnTop = (
  cardToPlay: Card, 
  topCard: Card, 
  currentColor: CardColor,
  settings: GameSettings
): boolean => {
  // Wild cards can always be played
  if (isWildCard(cardToPlay)) {
    // For strict no-bluffing rule, wild+4 can only be played if no other option
    if (settings.noBluffing && cardToPlay.type === 'wild4') {
      return false; // This should be checked separately with the player's hand
    }
    return true;
  }
  
  // Same color as current color
  if (cardToPlay.color === currentColor) return true;
  
  // Same value/type as top card (number cards need same value, action cards need same type)
  if (cardToPlay.type === 'number' && topCard.type === 'number' && cardToPlay.value === topCard.value) return true;
  if (cardToPlay.type !== 'number' && cardToPlay.type === topCard.type) return true;
  
  return false;
};

/**
 * Creates a new complete UNO deck
 */
export const createNewDeck = (): Card[] => {
  const deck: Card[] = [];
  let id = 0;
  
  // For each color (red, blue, green, yellow)
  ['red', 'blue', 'green', 'yellow'].forEach(color => {
    // Add one 0 card
    deck.push({
      id: (id++).toString(),
      color: color as CardColor,
      type: 'number',
      value: 0,
      points: 0
    });
    
    // Add two of each 1-9 number card
    for (let value = 1; value <= 9; value++) {
      for (let j = 0; j < 2; j++) {
        deck.push({
          id: (id++).toString(),
          color: color as CardColor,
          type: 'number',
          value: value as CardValue,
          points: value
        });
      }
    }
    
    // Add two of each action card (skip, reverse, draw2)
    ['skip', 'reverse', 'draw2'].forEach(type => {
      for (let j = 0; j < 2; j++) {
        deck.push({
          id: (id++).toString(),
          color: color as CardColor,
          type: type as CardType,
          points: 20
        });
      }
    });
  });
  
  // Add 4 wild cards and 4 wild+4 cards
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: (id++).toString(),
      color: 'black',
      type: 'wild',
      points: 50
    });
    
    deck.push({
      id: (id++).toString(),
      color: 'black',
      type: 'wild4',
      points: 50
    });
  }
  
  return deck;
};

/**
 * Creates default game settings
 */
export const getDefaultGameSettings = (): GameSettings => {
  return {
    roomName: 'UNO Game',
    maxPlayers: 10,
    minPlayers: 2,
    timePerTurn: 30,
    isPrivate: false,
    scoreLimit: 500,
    stackDrawCards: true,
    forcePlay: false,
    jumpIn: false,
    drawUntilMatch: false,
    allowChallenges: true,
    strictUno: true,
    sevenZero: false,
    noBluffing: false,
    passAfterDraw: true,
    drawCardLimit: 3
  };
};

/**
 * Creates an initial game state
 */
export const createInitialGameState = (roomCode: string, hostId: string, hostName: string): GameState => {
  const settings = getDefaultGameSettings();
  const creationTime = Date.now();
  
  return {
    id: `game_${creationTime}`,
    roomCode,
    players: [{
      id: hostId,
      username: hostName,
      cards: [],
      isHost: true,
      isCurrentTurn: false,
      isConnected: true,
      isReady: false,
      score: 0,
      roundScore: 0,
      hasCalledUno: false,
      joinedAt: creationTime,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        cardsPlayed: 0,
        specialCardsPlayed: 0,
        totalScore: 0
      }
    }],
    spectators: [],
    currentPlayerIndex: 0,
    direction: 1,
    deck: [],
    discardPile: [],
    currentColor: 'red',
    gameStatus: 'waiting',
    currentRound: 0,
    rounds: [],
    settings,
    timer: {
      startTime: 0,
      duration: 0,
      timeLeft: 0,
      isActive: false
    },
    actionHistory: [],
    drawPileCount: 0,
    pendingCardsToDraw: 0,
    gameCreatedAt: creationTime,
    lastUpdateAt: creationTime
  };
};

/**
 * Shuffles an array using the Fisher-Yates algorithm
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};