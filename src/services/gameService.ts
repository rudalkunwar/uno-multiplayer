import {
  GameState,
  Player,
  Card,
  CardColor,
  GameSettings,
  PlayerAction,
  Challenge,
  Direction,
  GameStatus,
  CardType,
  ActionType,
  GameEvent,
  ChatMessage,
  canPlayOnTop,
  isWildCard,
  isDrawCard,
  createNewDeck,
  shuffleArray,
  getCardPoints,
  GameRound,
  GameTimer,
  GameAction,
  createInitialGameState // <-- Import the helper to create a fresh game state
} from '../types/game';
import { GameStateManager } from './StateManager';
import { GameRuleValidator } from './RuleValidator';
import { GameEventEmitter } from './EventEmitter';

/**
 * @class GameService
 * @description Main service class for UNO game logic. All methods are immutable.
 */
export class GameService {
  private readonly stateManager: GameStateManager;
  private readonly validator: GameRuleValidator;
  private readonly eventEmitter: GameEventEmitter;

  /**
   * Create a new GameService instance
   * @param initialState - Initial game state
   */
  constructor(initialState: GameState) {
    this.stateManager = new GameStateManager(initialState);
    this.validator = new GameRuleValidator();
    this.eventEmitter = new GameEventEmitter();
  }

  /**
   * Get the current game state
   * @returns Current GameState
   */
  public getState(): GameState {
    return this.stateManager.getState();
  }

  /**
   * Create a new game
   * @param roomCode - Room code for the game
   * @param hostId - Host player ID
   * @param hostName - Host player name
   * @param settings - Optional custom game settings
   * @returns New GameService instance
   */
  public static createGame(
    roomCode: string,
    hostId: string,
    hostName: string,
    settings?: Partial<GameSettings>
  ): GameService {
    // Use the helper to create a fresh initial game state
    const state = createInitialGameState(roomCode, hostId, hostName);
    const defaultSettings = state.settings;

    const newState: GameState = {
      ...state,
      roomCode,
      settings: { ...defaultSettings, ...settings },
      players: [
        {
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
          joinedAt: Date.now(),
          stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            cardsPlayed: 0,
            specialCardsPlayed: 0,
            totalScore: 0
          }
        }
      ],
      lastUpdateAt: Date.now()
    };

    return new GameService(newState);
  }

  /**
   * Add a player to the game
   * @param playerId - Player ID
   * @param playerName - Player name
   * @param avatarId - Optional avatar ID
   * @returns New GameService instance
   */
  public addPlayer(playerId: string, playerName: string, avatarId?: string): GameService {
    const state = this.stateManager.getState();

    if (state.gameStatus !== 'waiting') {
      throw new Error('Cannot join game in progress');
    }

    if (state.players.length >= state.settings.maxPlayers) {
      throw new Error('Game is full');
    }

    if (state.players.some(p => p.id === playerId)) {
      throw new Error('Player already in game');
    }

    const newPlayer: Player = {
      id: playerId,
      username: playerName,
      cards: [],
      isHost: false,
      isCurrentTurn: false,
      isConnected: true,
      isReady: false,
      score: 0,
      roundScore: 0,
      hasCalledUno: false,
      joinedAt: Date.now(),
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        cardsPlayed: 0,
        specialCardsPlayed: 0,
        totalScore: 0
      },
      avatarId
    };

    const newState: GameState = {
      ...state,
      players: [...state.players, newPlayer],
      lastUpdateAt: Date.now()
    };

    const event: GameEvent = {
      type: 'PLAYER_JOINED',
      payload: { playerId, playerName },
      timestamp: Date.now()
    };

    this.eventEmitter.emit(event);

    return new GameService(newState);
  }

  /**
   * Remove a player from the game
   * @param playerId - Player ID to remove
   * @returns New GameService instance
   */
  public removePlayer(playerId: string): GameService {
    const state = this.stateManager.getState();
    const playerIndex = state.players.findIndex(p => p.id === playerId);

    if (playerIndex === -1) {
      throw new Error('Player not found');
    }

    let newState: GameState;

    // If game is in progress, mark player as disconnected instead of removing
    if (state.gameStatus === 'playing') {
      newState = {
        ...state,
        players: state.players.map(p =>
          p.id === playerId ? { ...p, isConnected: false } : p
        ),
        lastUpdateAt: Date.now()
      };

      // If it was this player's turn, advance to next player
      if (state.players[playerIndex].isCurrentTurn) {
        return new GameService(newState).nextTurn();
      }
    } else {
      // For waiting or finished games, remove player completely
      const isHost = state.players[playerIndex].isHost;
      let newPlayers = state.players.filter(p => p.id !== playerId);

      // If the host left and there are other players, assign new host
      if (isHost && newPlayers.length > 0) {
        newPlayers = newPlayers.map((p, idx) =>
          idx === 0 ? { ...p, isHost: true } : p
        );
      }

      newState = {
        ...state,
        players: newPlayers,
        lastUpdateAt: Date.now()
      };
    }

    const event: GameEvent = {
      type: 'PLAYER_LEFT',
      payload: { playerId },
      timestamp: Date.now()
    };

    this.eventEmitter.emit(event);

    return new GameService(newState);
  }

  /**
   * Set player ready status
   * @param playerId - Player ID
   * @param isReady - Ready status
   * @returns New GameService instance
   */
  public setPlayerReady(playerId: string, isReady: boolean): GameService {
    const state = this.stateManager.getState();

    if (state.gameStatus !== 'waiting') {
      throw new Error('Game already started');
    }

    const playerIndex = state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      throw new Error('Player not found');
    }

    const newState: GameState = {
      ...state,
      players: state.players.map(p =>
        p.id === playerId ? { ...p, isReady } : p
      ),
      lastUpdateAt: Date.now()
    };

    return new GameService(newState);
  }

  /**
   * Start the game
   * @param playerId - Player ID initiating start (must be host)
   * @returns New GameService instance
   */
  public startGame(playerId: string): GameService {
    const state = this.stateManager.getState();

    // Check if player is host
    const player = state.players.find(p => p.id === playerId);
    if (!player || !player.isHost) {
      throw new Error('Only host can start game');
    }

    // Check if enough players are ready
    const readyPlayers = state.players.filter(p => p.isReady);
    if (readyPlayers.length < state.settings.minPlayers - 1) {
      throw new Error('Not enough players are ready');
    }

    // Create and shuffle deck
    let deck = createNewDeck();
    deck = shuffleArray(deck);

    // Deal cards to players (7 cards each)
    const players = state.players.map(player => {
      const cards = deck.splice(0, 7);
      return {
        ...player,
        cards,
        isReady: true, // All players are now ready as game is starting
        isCurrentTurn: false,
        hasCalledUno: false
      };
    });

    // Pick starting card (non-action card)
    let startingCardIndex = 0;
    while (startingCardIndex < deck.length) {
      const card = deck[startingCardIndex];
      if (card.type === 'number') {
        break;
      }
      startingCardIndex++;
    }

    // If no number card found, reshuffle and try again
    if (startingCardIndex >= deck.length) {
      deck = shuffleArray(deck);
      startingCardIndex = 0;
    }

    // Move starting card to discard pile
    const startingCard = deck.splice(startingCardIndex, 1)[0];
    const discardPile = [startingCard];

    // Randomly select first player
    const firstPlayerIndex = Math.floor(Math.random() * players.length);
    players[firstPlayerIndex].isCurrentTurn = true;

    // Initialize game round
    const currentRound = 1;
    const roundStartTime = Date.now();
    const newRound: GameRound = {
      roundNumber: currentRound,
      startTime: roundStartTime,
      scores: {},
      firstPlayer: players[firstPlayerIndex].id
    };

    // Set up timer
    const timer: GameTimer = {
      startTime: roundStartTime,
      duration: state.settings.timePerTurn * 1000, // Convert to ms
      timeLeft: state.settings.timePerTurn * 1000,
      isActive: true
    };

    // Create new game state
    const newState: GameState = {
      ...state,
      players,
      currentPlayerIndex: firstPlayerIndex,
      direction: 1,
      deck,
      discardPile,
      currentColor: startingCard.color as CardColor,
      lastPlayedCard: startingCard,
      gameStatus: 'playing',
      currentRound,
      rounds: [newRound],
      timer,
      drawPileCount: deck.length,
      pendingCardsToDraw: 0,
      lastUpdateAt: Date.now(),
      actionHistory: []
    };

    const event: GameEvent = {
      type: 'GAME_STARTED',
      payload: { roundNumber: currentRound },
      timestamp: Date.now()
    };

    this.eventEmitter.emit(event);

    return new GameService(newState);
  }

  /**
   * Play a card
   * @param playerId - Player ID playing the card
   * @param cardId - Card ID to play
   * @param chosenColor - Chosen color for wild cards
   * @returns New GameService instance
   */
  public playCard(playerId: string, cardId: string, chosenColor?: CardColor): GameService {
    const state = this.stateManager.getState();

    // Validate it's player's turn
    const playerIndex = state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1 || !state.players[playerIndex].isCurrentTurn) {
      // Check for jump-in rule if enabled
      if (state.settings.jumpIn) {
        return this.handleJumpIn(playerId, cardId);
      }
      throw new Error('Not player\'s turn');
    }

    // Get player and card
    const player = state.players[playerIndex];
    const cardIndex = player.cards.findIndex(c => c.id === cardId);

    if (cardIndex === -1) {
      throw new Error('Card not found in player hand');
    }

    const card = player.cards[cardIndex];
    const topCard = state.discardPile[state.discardPile.length - 1];

    // Check if card can be played
    if (!canPlayOnTop(card, topCard, state.currentColor, state.settings)) {
      throw new Error('Invalid card play');
    }

    // Check for wild+4 no-bluffing rule
    if (state.settings.noBluffing && card.type === 'wild4') {
      const hasColorCard = player.cards.some(c =>
        c.id !== cardId && c.color === state.currentColor
      );
      if (hasColorCard) {
        throw new Error('Cannot play Wild+4 when you have a matching color card');
      }
    }

    // Required color for wild cards
    if (isWildCard(card) && !chosenColor) {
      throw new Error('Must choose a color for wild card');
    }

    // Update color for wild cards
    const newColor = isWildCard(card) ? chosenColor! : card.color;

    // Remove card from player's hand
    const newPlayerCards = player.cards.filter(c => c.id !== cardId);

    // Create action record
    const action: GameAction = {
      type: 'play',
      player: playerId,
      card,
      timestamp: Date.now(),
      newColor: isWildCard(card) ? chosenColor : undefined
    };

    // Check if player needs to call UNO
    const needsUnoCall = newPlayerCards.length === 1;
    const hasCalledUno = player.hasCalledUno;

    // Update player stats
    const isSpecialCard = card.type !== 'number';
    const playerStats = {
      ...player.stats,
      cardsPlayed: player.stats.cardsPlayed + 1,
      specialCardsPlayed: player.stats.specialCardsPlayed + (isSpecialCard ? 1 : 0)
    };

    // Process card effects
    let pendingCardsToDraw = state.pendingCardsToDraw;
    let nextPlayerIndex = state.currentPlayerIndex;
    let direction = state.direction;
    let mustCallUno = needsUnoCall && !hasCalledUno ? playerId : undefined;

    // Handle stacking of draw cards
    if (isDrawCard(card)) {
      if (card.type === 'draw2') {
        pendingCardsToDraw += 2;
      } else if (card.type === 'wild4') {
        pendingCardsToDraw += 4;
      }
    }

    // Handle special card effects
    switch (card.type) {
      case 'skip':
        // Skip next player
        nextPlayerIndex = this.getNextPlayerIndex(state, state.currentPlayerIndex);
        break;
      case 'reverse':
        // Reverse direction
        direction = state.direction === 1 ? -1 : 1;
        break;
      case 'draw2':
      case 'wild4':
        // Effect handled in stacking logic
        break;
      case 'number':
        // Special rule: 7s and 0s
        if (state.settings.sevenZero && (card.value === 7 || card.value === 0)) {
          return this.handleSevenZeroRule(state, card, playerIndex, action);
        }
        break;
    }

    // Update player
    const updatedPlayers = state.players.map((p, idx) => {
      if (idx === playerIndex) {
        return {
          ...p,
          cards: newPlayerCards,
          hasCalledUno: needsUnoCall ? hasCalledUno : false,
          lastAction: {
            type: 'play',
            timestamp: Date.now(),
            card
          },
          stats: playerStats
        };
      }
      return p;
    });

    // Check for winner
    let winner: Player | undefined;
    let gameStatus = state.gameStatus;
    let rounds = state.rounds;

    if (newPlayerCards.length === 0) {
      winner = { ...updatedPlayers[playerIndex] } as Player;
      gameStatus = 'finished';

      // Calculate round scores
      const roundEndTime = Date.now();
      const roundScores: Record<string, number> = {};

      updatedPlayers.forEach(p => {
        const points = p.cards.reduce((sum, c) => sum + c.points, 0);
        roundScores[p.id] = points;
      });

      const currentRound = {
        ...state.rounds[state.rounds.length - 1],
        endTime: roundEndTime,
        winner: playerId,
        scores: roundScores
      };

      rounds = [...state.rounds.slice(0, -1), currentRound];

      // Update player scores
      updatedPlayers.forEach((p, idx) => {
        if (p.id === playerId) {
          const winPoints = Object.values(roundScores).reduce((sum, points) => sum + points, 0);
          updatedPlayers[idx] = {
            ...p,
            score: p.score + winPoints,
            roundScore: winPoints,
            stats: {
              ...p.stats,
              gamesWon: p.stats.gamesWon + 1,
              totalScore: p.stats.totalScore + winPoints
            }
          };
        } else {
          const losePoints = roundScores[p.id] || 0;
          updatedPlayers[idx] = {
            ...p,
            roundScore: -losePoints,
            stats: {
              ...p.stats,
              totalScore: p.stats.totalScore - losePoints
            }
          };
        }
      });
    }

    // Update action history
    const actionHistory = [action, ...state.actionHistory].slice(0, 20);

    // Update game state
    const newState: GameState = {
      ...state,
      players: updatedPlayers.map(p => ({
        ...p,
        lastAction: p.lastAction ? { ...p.lastAction, type: p.lastAction.type as ActionType } : undefined
      })) as Player[],
      currentPlayerIndex: nextPlayerIndex,
      direction,
      discardPile: [...state.discardPile, card],
      currentColor: newColor,
      lastPlayedCard: card,
      gameStatus,
      winner,
      rounds,
      lastAction: { ...action, type: action.type as ActionType },
      actionHistory,
      pendingCardsToDraw,
      mustCallUno,
      lastUpdateAt: Date.now()
    };

    const event: GameEvent = {
      type: 'CARD_PLAYED',
      payload: {
        playerId,
        card,
        newColor,
        isWinner: winner !== undefined
      },
      timestamp: Date.now()
    };

    this.eventEmitter.emit(event);

    // If game is finished, emit event
    if (winner) {
      const winEvent: GameEvent = {
        type: 'GAME_WON',
        payload: {
          playerId,
          score: winner.score
        },
        timestamp: Date.now()
      };

      this.eventEmitter.emit(winEvent);
      return new GameService(newState);
    }

    // Move to next player
    return new GameService(newState).nextTurn();
  }

  /**
   * Handle drawing card(s)
   * @param playerId - Player ID drawing cards
   * @returns New GameService instance
   */
  public drawCards(playerId: string): GameService {
    const state = this.stateManager.getState();

    // Validate it's player's turn
    const playerIndex = state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1 || !state.players[playerIndex].isCurrentTurn) {
      throw new Error('Not player\'s turn');
    }

    // Determine how many cards to draw
    const cardsToDraw = state.pendingCardsToDraw > 0 ? state.pendingCardsToDraw : 1;

    const newState = this.handleCardDraw(state, playerId, cardsToDraw);

    return new GameService(newState);
  }

  /**
   * Helper method to handle card drawing logic
   * @param state - Current game state
   * @param playerId - Player ID drawing cards
   * @param cardsToDraw - Number of cards to draw (default: 1)
   * @returns Updated game state
   */
  private handleCardDraw(
    state: GameState,
    playerId: string,
    cardsToDraw: number = 1
  ): GameState {
    const playerIndex = state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      throw new Error('Player not found');
    }

    let { deck, discardPile } = state;

    // If not enough cards in deck, shuffle discard pile except top card
    if (deck.length < cardsToDraw) {
      const topCard = discardPile[discardPile.length - 1];
      const cardsToShuffle = discardPile.slice(0, -1);

      deck = [...deck, ...shuffleArray(cardsToShuffle)];
      discardPile = [topCard];
    }

    // Draw cards
    const drawnCards = deck.splice(0, cardsToDraw);

    // Add cards to player's hand
    const updatedPlayers = state.players.map((p, idx) => {
      if (idx === playerIndex) {
        return {
          ...p,
          cards: [...p.cards, ...drawnCards],
          hasCalledUno: false,
          lastAction: {
            type: 'draw',
            timestamp: Date.now()
          }
        };
      }
      return p;
    });

    const action: GameAction = {
      type: 'draw',
      player: playerId,
      timestamp: Date.now()
    };

    const actionHistory = [action, ...state.actionHistory].slice(0, 20);

    const newState: GameState = {
      ...state,
      players: updatedPlayers.map(p => ({
        ...p,
        lastAction: p.lastAction ? { ...p.lastAction, type: p.lastAction.type as ActionType } : undefined
      })) as Player[],
      deck,
      discardPile,
      drawPileCount: deck.length,
      pendingCardsToDraw: 0,
      lastAction: action,
      actionHistory,
      lastUpdateAt: Date.now()
    };

    const event: GameEvent = {
      type: 'CARDS_DRAWN',
      payload: {
        playerId,
        count: cardsToDraw
      },
      timestamp: Date.now()
    };

    this.eventEmitter.emit(event);

    if (state.settings.passAfterDraw) {
      return this.nextTurn(newState).getState();
    }

    return newState;
  }

  /**
   * Handle draw until playable match
   * @param playerId - Player ID drawing cards
   * @returns New GameService instance
   */
  public drawUntilMatch(playerId: string): GameService {
    const state = this.stateManager.getState();

    if (!state.settings.drawUntilMatch) {
      throw new Error('Draw until match rule is not enabled');
    }

    const playerIndex = state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1 || !state.players[playerIndex].isCurrentTurn) {
      throw new Error('Not player\'s turn');
    }

    const player = state.players[playerIndex];
    const topCard = state.discardPile[state.discardPile.length - 1];

    const hasPlayableCard = player.cards.some(card =>
      canPlayOnTop(card, topCard, state.currentColor, state.settings)
    );

    if (hasPlayableCard) {
      throw new Error('Player already has a playable card');
    }

    let currentState = state;
    let currentPlayer = player;
    let cardsDrawn = 0;
    const maxDraws = state.settings.drawCardLimit || 3;

    while (cardsDrawn < maxDraws) {
      currentState = this.handleCardDraw(currentState, playerId);
      const updatedPlayerIndex = currentState.players.findIndex(p => p.id === playerId);
      currentPlayer = currentState.players[updatedPlayerIndex];
      cardsDrawn++;

      const newCard = currentPlayer.cards[currentPlayer.cards.length - 1];
      if (
        canPlayOnTop(
          newCard,
          currentState.discardPile[currentState.discardPile.length - 1],
          currentState.currentColor,
          currentState.settings
        )
      ) {
        break;
      }
    }

    if (state.settings.passAfterDraw) {
      return new GameService(currentState).nextTurn();
    }

    return new GameService(currentState);
  }

  /**
   * Skip current player's turn
   * @param playerId - Player ID skipping turn
   * @returns New GameService instance
   */
  public skipTurn(playerId: string): GameService {
    const state = this.stateManager.getState();

    const playerIndex = state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1 || !state.players[playerIndex].isCurrentTurn) {
      throw new Error('Not player\'s turn');
    }

    const action: GameAction = {
      type: 'skip',
      player: playerId,
      timestamp: Date.now()
    };

    const updatedPlayers = state.players.map((p, idx) => {
      if (idx === playerIndex) {
        return {
          ...p,
          lastAction: {
            type: 'skip',
            timestamp: Date.now()
          }
        };
      }
      return p;
    });

    const actionHistory = [action, ...state.actionHistory].slice(0, 20);

    const newState: GameState = {
      ...state,
      players: updatedPlayers.map(p => ({
        ...p,
        lastAction: p.lastAction ? { ...p.lastAction, type: p.lastAction.type as ActionType } : undefined
      })) as Player[],
      lastAction: action,
      actionHistory,
      lastUpdateAt: Date.now()
    };

    const event: GameEvent = {
      type: 'TURN_SKIPPED',
      payload: { playerId },
      timestamp: Date.now()
    };

    this.eventEmitter.emit(event);

    return new GameService(newState).nextTurn();
  }

  /**
   * Challenge a wild+4 card play
   * @param challengerId - Player ID challenging
   * @param challengedId - Player ID being challenged
   * @returns New GameService instance
   */
  public challengeWildFour(challengerId: string, challengedId: string): GameService {
    const state = this.stateManager.getState();

    if (!state.settings.allowChallenges) {
      throw new Error('Challenges are not enabled in this game');
    }

    const lastAction = state.lastAction;
    if (!lastAction || lastAction.type !== 'play' || !lastAction.card || lastAction.card.type !== 'wild4') {
      throw new Error('Cannot challenge: last play was not a wild+4');
    }

    const challengerIndex = state.players.findIndex(p => p.id === challengerId);
    if (challengerIndex === -1 || challengerIndex !== state.currentPlayerIndex) {
      throw new Error('Only the affected player can challenge');
    }

    const challengedIndex = state.players.findIndex(p => p.id === challengedId);
    if (challengedIndex === -1 || lastAction.player !== challengedId) {
      throw new Error('Cannot challenge this player');
    }

    const challengedPlayer = state.players[challengedIndex];
    const prevCard = state.discardPile[state.discardPile.length - 2];
    const prevColor = prevCard.color;

    const playedCard = lastAction.card;
    const currentHand = challengedPlayer.cards;
    const handAtPlay = [...currentHand, playedCard];

    const hadMatchingCard = handAtPlay.some(card =>
      card.id !== playedCard.id && card.color === prevColor
    );

    let newState = state;
    const challenge: Challenge = {
      challenger: challengerId,
      challenged: challengedId,
      card: playedCard,
      timestamp: Date.now(),
      isValid: hadMatchingCard
    };
      newState = {
        ...newState,
        pendingCardsToDraw: 0
      };
    if (hadMatchingCard) {
      newState = this.handleCardDraw(state, challengedId, 4);
      newState = {
        ...newState,
        pendingCardsToDraw: 0
      };
    } else {
      newState = this.handleCardDraw(state, challengerId, 6);
      newState = {
        ...newState,
        pendingCardsToDraw: 0
      };
    }

    newState = {
      ...newState,
      challengePending: challenge,
      lastUpdateAt: Date.now()
    };

    const event: GameEvent = {
      type: 'WILD4_CHALLENGED',
      payload: {
        challengerId,
        challengedId,
        isSuccessful: hadMatchingCard
      },
      timestamp: Date.now()
    };

    this.eventEmitter.emit(event);

    return new GameService(newState);
  }

  /**
   * Move to next player's turn
   * @param stateOverride - Optional state override
   * @returns New GameService instance
   */
  private nextTurn(stateOverride?: GameState): GameService {
    const state = stateOverride || this.stateManager.getState();
    const nextPlayerIndex = this.getNextPlayerIndex(state);

    const timer: GameTimer = {
      startTime: Date.now(),
      duration: state.settings.timePerTurn * 1000,
      timeLeft: state.settings.timePerTurn * 1000,
      isActive: true
    };

    const updatedPlayers = state.players.map((player, index) => ({
      ...player,
      isCurrentTurn: index === nextPlayerIndex
    }));

    const newState: GameState = {
      ...state,
      players: updatedPlayers,
      currentPlayerIndex: nextPlayerIndex,
      timer,
      lastUpdateAt: Date.now()
    };

    const event: GameEvent = {
      type: 'TURN_CHANGED',
      payload: {
        playerId: state.players[nextPlayerIndex].id,
        timePerTurn: state.settings.timePerTurn
      },
      timestamp: Date.now()
    };

    this.eventEmitter.emit(event);

    return new GameService(newState);
  }

  /**
   * Get index of next player based on current direction
   * @param state - Current game state
   * @param startIndex - Optional starting index
   * @returns number
   */
  private getNextPlayerIndex(state: GameState, startIndex?: number): number {
    const currentIndex = startIndex ?? state.currentPlayerIndex;
    const playerCount = state.players.length;
    let nextIndex = (currentIndex + state.direction + playerCount) % playerCount;

    while (!state.players[nextIndex].isConnected) {
      nextIndex = (nextIndex + state.direction + playerCount) % playerCount;
      if (nextIndex === currentIndex) {
        break;
      }
    }

    return nextIndex;
  }

  /**
   * Placeholder for handling the seven-zero rule.
   * Implement swapping hands (7) or rotating all hands (0) as desired.
   */
  private handleSevenZeroRule(
    state: GameState,
    card: Card,
    playerIndex: number,
    action: GameAction
  ): GameService {
    // TODO: Implement seven-zero rule logic.
    // For now, we throw an error to indicate this needs implementation.
    throw new Error('Seven-zero rule not implemented yet');
  }

  /**
   * Placeholder for handling jump-in rule.
   * Implement jump-in logic as desired.
   */
  private handleJumpIn(playerId: string, cardId: string): GameService {
    // TODO: Implement jump-in rule logic.
    throw new Error('Jump-in rule not implemented yet');
  }
}
