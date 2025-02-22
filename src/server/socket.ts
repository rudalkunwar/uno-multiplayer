import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Socket } from 'socket.io';
import { env } from '@/config/env';
import { GameService } from '@/services/GameService';
import { GameState, Player } from '@/types/game';

export class SocketServer {
  private io: SocketIOServer | null = null;
  private games: Map<string, GameState> = new Map();
  
  constructor(server: NetServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      pingInterval: env.websocket.pingInterval,
      pingTimeout: env.websocket.pingTimeout,
    });

    this.io.on('connection', this.handleConnection.bind(this));
  }

  private handleConnection(socket: Socket): void {
    console.log('Client connected:', socket.id);

    socket.on('createGame', (username: string) => {
      const roomId = Math.random().toString(36).substring(2, 8);
      const player: Player = {
        id: socket.id,
        username,
        hand: [],
        isHost: true
      };
      
      socket.join(roomId);
      this.games.set(roomId, {
        roomId,
        players: [player],
        currentPlayerIndex: 0,
        deck: [],
        discardPile: [],
        direction: 1,
        isGameStarted: false,
        lastCard: null,
        winner: null,
        currentColor: 'red'
      });

      socket.emit('gameCreated', { roomId, playerId: socket.id });
    });

    socket.on('joinGame', async (data: { roomId: string; username: string }) => {
      const game = this.games.get(data.roomId);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      if (game.players.length >= env.game.maxPlayersPerRoom) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      const player: Player = {
        id: socket.id,
        username: data.username,
        hand: [],
        isHost: false
      };

      socket.join(data.roomId);
      game.players.push(player);
      this.games.set(data.roomId, game);

      this.io?.to(data.roomId).emit('playerJoined', {
        game: this.getPublicGameState(game, socket.id)
      });

      if (game.players.length >= env.game.minPlayersToStart) {
        this.io?.to(data.roomId).emit('gameReady');
      }
    });

    socket.on('startGame', (roomId: string) => {
      const game = this.games.get(roomId);
      
      if (!game) return;
      
      const initializedGame = GameService.initializeGame(roomId, game.players);
      this.games.set(roomId, initializedGame);

      // Send each player their own game state
      initializedGame.players.forEach(player => {
        this.io?.to(player.id).emit('gameStarted', this.getPublicGameState(initializedGame, player.id));
      });
    });

    socket.on('playCard', (data: { roomId: string; cardId: string; chosenColor?: string }) => {
      const game = this.games.get(data.roomId);
      
      if (!game) return;

      const updatedGame = GameService.playCard(game, socket.id, data.cardId, data.chosenColor as any);
      
      if (updatedGame !== game) {
        this.games.set(data.roomId, updatedGame);
        
        // Notify all players of the update
        updatedGame.players.forEach(player => {
          this.io?.to(player.id).emit('gameStateUpdated', this.getPublicGameState(updatedGame, player.id));
        });

        if (updatedGame.winner) {
          this.io?.to(data.roomId).emit('gameEnded', {
            winner: updatedGame.players.find(p => p.id === updatedGame.winner)
          });
        }
      }
    });

    socket.on('drawCard', (roomId: string) => {
      const game = this.games.get(roomId);
      
      if (!game) return;

      const updatedGame = GameService.drawCards(game, socket.id, 1);
      this.games.set(roomId, updatedGame);

      // Update all players
      updatedGame.players.forEach(player => {
        this.io?.to(player.id).emit('gameStateUpdated', this.getPublicGameState(updatedGame, player.id));
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Handle player disconnection
      this.games.forEach((game, roomId) => {
        const playerIndex = game.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          game.players.splice(playerIndex, 1);
          if (game.players.length === 0) {
            this.games.delete(roomId);
          } else {
            this.io?.to(roomId).emit('playerLeft', {
              playerId: socket.id,
              game: this.getPublicGameState(game, socket.id)
            });
          }
        }
      });
    });
  }

  private getPublicGameState(game: GameState, playerId: string) {
    // Create a copy of the game state with hidden information
    return {
      ...game,
      players: game.players.map(player => ({
        ...player,
        hand: player.id === playerId ? player.hand : player.hand.length // Only send hand to the player who owns it
      })),
      deck: game.deck.length // Only send deck size
    };
  }
}