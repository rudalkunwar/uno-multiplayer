interface Card {
    color: 'red' | 'blue' | 'green' | 'yellow' | 'wild'
    value: number | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wildDraw4'
  }
  
  interface Player {
    id: string
    name: string
    cards: Card[]
  }
  
  interface GameState {
    gameId: string
    roomCode: string
    players: Player[]
    currentPlayer: number
    direction: 1 | -1
    topCard: Card
    deck: Card[]
    discardPile: Card[]
    winner?: string
  }
  
  export class GameManager {
    private games: Map<string, GameState>
  
    constructor() {
      this.games = new Map()
    }
  
    private createDeck(): Card[] {
      const colors: ('red' | 'blue' | 'green' | 'yellow')[] = ['red', 'blue', 'green', 'yellow']
      const numbers = Array.from({ length: 10 }, (_, i) => i) // 0-9
      const deck: Card[] = []
  
      // Add number cards
      colors.forEach(color => {
        numbers.forEach(num => {
          deck.push({ color, value: num })
          if (num !== 0) { // Add second copy of non-zero numbers
            deck.push({ color, value: num })
          }
        })
      })
  
      // Add special cards
      colors.forEach(color => {
        // Two of each special card per color
        ['skip', 'reverse', 'draw2'].forEach(value => {
          deck.push({ color, value: value as Card['value'] })
          deck.push({ color, value: value as Card['value'] })
        })
      })
  
      // Add wild cards
      for (let i = 0; i < 4; i++) {
        deck.push({ color: 'wild', value: 'wild' })
        deck.push({ color: 'wild', value: 'wildDraw4' })
      }
  
      return this.shuffleDeck(deck)
    }
  
    private shuffleDeck(deck: Card[]): Card[] {
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[deck[i], deck[j]] = [deck[j], deck[i]]
      }
      return deck
    }
  
    public createGame(players: { id: string, name: string }[]): string {
      const gameId = Math.random().toString(36).substring(2, 15)
      const deck = this.createDeck()
      
      // Deal 7 cards to each player
      const gamePlayers = players.map(player => ({
        ...player,
        cards: deck.splice(0, 7)
      }))
  
      const initialTopCard = deck.splice(0, 1)[0]
  
      const gameState: GameState = {
        gameId,
        roomCode: gameId, // Using gameId as roomCode for simplicity
        players: gamePlayers,
        currentPlayer: 0,
        direction: 1,
        topCard: initialTopCard,
        deck,
        discardPile: [initialTopCard]
      }
  
      this.games.set(gameId, gameState)
      return gameId
    }
  
    public playCard(gameId: string, playerId: string, cardIndex: number): GameState | null {
      const game = this.games.get(gameId)
      if (!game) return null
  
      const playerIndex = game.players.findIndex(p => p.id === playerId)
      if (playerIndex !== game.currentPlayer) return null
  
      const player = game.players[playerIndex]
      const card = player.cards[cardIndex]
  
      // Validate if card can be played
      if (this.isValidPlay(card, game.topCard)) {
        // Remove card from player's hand
        player.cards.splice(cardIndex, 1)
  
        // Update game state
        game.topCard = card
        game.discardPile.push(card)
  
        // Handle special cards
        this.handleSpecialCard(game, card)
  
        // Check for winner
        if (player.cards.length === 0) {
          game.winner = playerId
        }
  
        // Move to next player
        this.moveToNextPlayer(game)
  
        return game
      }
  
      return null
    }
  
    public drawCard(gameId: string, playerId: string): GameState | null {
      const game = this.games.get(gameId)
      if (!game) return null
  
      const playerIndex = game.players.findIndex(p => p.id === playerId)
      if (playerIndex !== game.currentPlayer) return null
  
      // If deck is empty, shuffle discard pile
      if (game.deck.length === 0) {
        const topCard = game.discardPile.pop()!
        game.deck = this.shuffleDeck(game.discardPile)
        game.discardPile = [topCard]
      }
  
      // Draw card
      const drawnCard = game.deck.pop()!
      game.players[playerIndex].cards.push(drawnCard)
  
      // Move to next player
      this.moveToNextPlayer(game)
  
      return game
    }
  
    private isValidPlay(card: Card, topCard: Card): boolean {
      return card.color === 'wild' || 
             card.color === topCard.color || 
             card.value === topCard.value
    }
  
    private handleSpecialCard(game: GameState, card: Card): void {
      switch (card.value) {
        case 'skip':
          this.moveToNextPlayer(game) // Skip next player
          break
        case 'reverse':
          game.direction *= -1
          break
        case 'draw2':
          const nextPlayer = this.getNextPlayer(game)
          // Draw 2 cards for next player
          for (let i = 0; i < 2; i++) {
            if (game.deck.length === 0) {
              const topCard = game.discardPile.pop()!
              game.deck = this.shuffleDeck(game.discardPile)
              game.discardPile = [topCard]
            }
            game.players[nextPlayer].cards.push(game.deck.pop()!)
          }
          break
        case 'wildDraw4':
          const nextPlayerIndex = this.getNextPlayer(game)
          // Draw 4 cards for next player
          for (let i = 0; i < 4; i++) {
            if (game.deck.length === 0) {
              const topCard = game.discardPile.pop()!
              game.deck = this.shuffleDeck(game.discardPile)
              game.discardPile = [topCard]
            }
            game.players[nextPlayerIndex].cards.push(game.deck.pop()!)
          }
          break
      }
    }
  
    private moveToNextPlayer(game: GameState): void {
      game.currentPlayer = this.getNextPlayer(game)
    }
  
    private getNextPlayer(game: GameState): number {
      return (game.currentPlayer + game.direction + game.players.length) % game.players.length
    }
  
    public handlePlayerDisconnect(playerId: string): void {
      // End any games where this player was participating
      this.games.forEach((game, gameId) => {
        if (game.players.some(p => p.id === playerId)) {
          this.games.delete(gameId)
        }
      })
    }
  }