import { Card, CardColor, CardType, GameState, Player } from '@/types/game';

export class GameService {
  private static generateDeck(): Card[] {
    const deck: Card[] = [];
    const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];
    
    // Generate number cards (0-9)
    colors.forEach(color => {
      // One 0 card per color
      deck.push({ id: `${color}-0`, color, type: 'number', value: 0 });
      
      // Two of each number 1-9
      for (let i = 1; i <= 9; i++) {
        deck.push({ id: `${color}-${i}-1`, color, type: 'number', value: i });
        deck.push({ id: `${color}-${i}-2`, color, type: 'number', value: i });
      }
      
      // Action cards (two of each per color)
      ['skip', 'reverse', 'drawTwo'].forEach(type => {
        deck.push({ id: `${color}-${type}-1`, color, type: type as CardType });
        deck.push({ id: `${color}-${type}-2`, color, type: type as CardType });
      });
    });
    
    // Wild cards (4 of each)
    for (let i = 1; i <= 4; i++) {
      deck.push({ id: `wild-${i}`, color: 'wild', type: 'wild' });
      deck.push({ id: `wild-draw-four-${i}`, color: 'wild', type: 'wildDrawFour' });
    }
    
    return deck;
  }

  private static shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  public static initializeGame(roomId: string, players: Player[]): GameState {
    const deck = this.shuffleDeck(this.generateDeck());
    const discardPile: Card[] = [];
    
    // Deal initial cards to players
    players.forEach(player => {
      player.hand = deck.splice(0, 7);
    });
    
    // Place first card
    let firstCard = deck.pop();
    while (firstCard && (firstCard.type === 'wild' || firstCard.type === 'wildDrawFour')) {
      deck.unshift(firstCard);
      firstCard = deck.pop();
    }
    
    if (firstCard) {
      discardPile.push(firstCard);
    }

    return {
      roomId,
      players,
      currentPlayerIndex: 0,
      deck,
      discardPile,
      direction: 1,
      isGameStarted: true,
      lastCard: firstCard || null,
      winner: null,
      currentColor: firstCard?.color || 'red',
    };
  }

  public static isValidPlay(card: Card, topCard: Card, currentColor: CardColor): boolean {
    if (card.type === 'wild' || card.type === 'wildDrawFour') {
      return true;
    }

    return card.color === currentColor || 
           (card.type === topCard.type) || 
           (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value);
  }

  public static drawCards(gameState: GameState, playerId: string, count: number): GameState {
    const newState = { ...gameState };
    const playerIndex = newState.players.findIndex(p => p.id === playerId);
    
    if (playerIndex === -1) return gameState;

    // Reshuffle discard pile if deck is empty
    if (newState.deck.length < count) {
      const topCard = newState.discardPile.pop();
      newState.deck = this.shuffleDeck(newState.discardPile);
      newState.discardPile = topCard ? [topCard] : [];
    }

    // Draw cards
    const drawnCards = newState.deck.splice(0, count);
    newState.players[playerIndex].hand.push(...drawnCards);

    return newState;
  }

  public static playCard(gameState: GameState, playerId: string, cardId: string, chosenColor?: CardColor): GameState {
    const newState = { ...gameState };
    const playerIndex = newState.players.findIndex(p => p.id === playerId);
    
    if (playerIndex === -1 || playerIndex !== newState.currentPlayerIndex) {
      return gameState;
    }

    const cardIndex = newState.players[playerIndex].hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return gameState;

    const card = newState.players[playerIndex].hand[cardIndex];
    const topCard = newState.lastCard;

    if (!topCard || !this.isValidPlay(card, topCard, newState.currentColor)) {
      return gameState;
    }

    // Remove card from player's hand
    newState.players[playerIndex].hand.splice(cardIndex, 1);

    // Add card to discard pile
    newState.discardPile.push(card);
    newState.lastCard = card;

    // Update current color for wild cards
    if (card.type === 'wild' || card.type === 'wildDrawFour') {
      if (!chosenColor) return gameState;
      newState.currentColor = chosenColor;
    } else {
      newState.currentColor = card.color;
    }

    // Handle special cards
    switch (card.type) {
      case 'skip':
        newState.currentPlayerIndex = this.getNextPlayerIndex(newState, 2);
        break;
      case 'reverse':
        newState.direction *= -1;
        newState.currentPlayerIndex = this.getNextPlayerIndex(newState);
        break;
      case 'drawTwo':
        const nextPlayer = this.getNextPlayerIndex(newState);
        this.drawCards(newState, newState.players[nextPlayer].id, 2);
        newState.currentPlayerIndex = this.getNextPlayerIndex(newState, 2);
        break;
      case 'wildDrawFour':
        const nextPlayerIndex = this.getNextPlayerIndex(newState);
        this.drawCards(newState, newState.players[nextPlayerIndex].id, 4);
        newState.currentPlayerIndex = this.getNextPlayerIndex(newState, 2);
        break;
      default:
        newState.currentPlayerIndex = this.getNextPlayerIndex(newState);
    }

    // Check for winner
    if (newState.players[playerIndex].hand.length === 0) {
      newState.winner = playerId;
      newState.isGameStarted = false;
    }

    return newState;
  }

  private static getNextPlayerIndex(gameState: GameState, skip: number = 1): number {
    const { currentPlayerIndex, players, direction } = gameState;
    let nextIndex = currentPlayerIndex;
    
    for (let i = 0; i < skip; i++) {
      nextIndex = (nextIndex + direction + players.length) % players.length;
    }
    
    return nextIndex;
  }
}