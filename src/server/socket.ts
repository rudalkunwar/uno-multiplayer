import { Server as NetServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '@/config/env';
import { GameService } from '@/services/GameService';
import { GameState, Player, GameSettings } from '@/types/game';
import { RoomCodeGenerator } from '@/utils/roomCode';

interface GameRoom {
  gameState: GameState;
  settings: GameSettings;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
}

export class SocketServer {
  private io: SocketIOServer | null = null;
  private games: Map<string, GameRoom> = new Map();
  private readonly ROOM_CLEANUP_INTERVAL = 1000 * 60 * 5; // 5 minutes
  private readonly ROOM_EXPIRY_TIME = 1000 * 60 * 60 * 24; // 24 hours

  constructor(server: NetServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: env.server.socketUrl,
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingInterval: env.websocket.pingInterval,
      pingTimeout: env.websocket.pingTimeout,
      transports: ['websocket', 'polling']
    });

    this.io.on('connection', this.handleConnection.bind(this));
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupInactiveRooms();
    }, this.ROOM_CLEANUP_INTERVAL);
  }

  private cleanupInactiveRooms(): void {
    const now = new Date();
    for (const [roomCode, room] of this.games.entries()) {
      const isExpired = now > room.expiresAt;
      const isInactive = now.getTime() - room.lastActivity.getTime() > 1000 * 60 * 30; // 30 minutes

      if (isExpired || (isInactive && !room.gameState.isGameStarted)) {
        this.io?.to(roomCode).emit('roomClosed', { 
          reason: isExpired ? 'expired' : 'inactive' 
        });
        this.games.delete(roomCode);
        RoomCodeGenerator.releaseRoomCode(roomCode);
      }
    }
  }

  private handleConnection(socket: Socket): void {
    console.log(`Client connected: ${socket.id} at ${new Date().toISOString()}`);

    socket.on('createGame', this.handleCreateGame(socket));
    socket.on('joinGame', this.handleJoinGame(socket));
    socket.on('startGame', this.handleStartGame(socket));
    socket.on('playCard', this.handlePlayCard(socket));
    socket.on('drawCard', this.handleDrawCard(socket));
    socket.on('disconnect', this.handleDisconnect(socket));
  }

  private handleCreateGame(socket: Socket) {
    return async (data: { username: string; settings: GameSettings }) => {
      try {
        const roomCode = RoomCodeGenerator.generateRoomCode(data.username);
        const player: Player = {
          id: socket.id,
          username: data.username,
          hand: [],
          isHost: true,
          isConnected: true
        };

        const now = new Date();
        const gameRoom: GameRoom = {
          gameState: {
            roomId: roomCode,
            roomName: data.settings.roomName,
            players: [player],
            currentPlayerIndex: 0,
            deck: [],
            discardPile: [],
            direction: 1,
            isGameStarted: false,
            lastCard: null,
            winner: null,
            currentColor: 'red',
            host: player.id,
            settings: data.settings,
            createdAt: now,
            expiresAt: new Date(now.getTime() + this.ROOM_EXPIRY_TIME)
          },
          settings: data.settings,
          createdAt: now,
          expiresAt: new Date(now.getTime() + this.ROOM_EXPIRY_TIME),
          lastActivity: now
        };

        socket.join(roomCode);
        this.games.set(roomCode, gameRoom);

        socket.emit('gameCreated', {
          roomCode,
          gameState: this.getPublicGameState(gameRoom.gameState, socket.id),
          settings: gameRoom.settings
        });

      } catch (error) {
        console.error('Create game error:', error);
        socket.emit('error', { 
          message: 'Failed to create game',
          code: 'CREATE_GAME_ERROR'
        });
      }
    };
  }

  private handleJoinGame(socket: Socket) {
    return async (data: { roomCode: string; username: string }) => {
      try {
        const gameRoom = this.games.get(data.roomCode);
        
        if (!gameRoom) {
          throw new Error('Game not found');
        }

        if (gameRoom.gameState.isGameStarted) {
          throw new Error('Game already started');
        }

        if (gameRoom.gameState.players.length >= gameRoom.settings.maxPlayers) {
          throw new Error('Room is full');
        }

        const player: Player = {
          id: socket.id,
          username: data.username,
          hand: [],
          isHost: false,
          isConnected: true
        };

        socket.join(data.roomCode);
        gameRoom.gameState.players.push(player);
        gameRoom.lastActivity = new Date();

        this.io?.to(data.roomCode).emit('playerJoined', {
          gameState: this.getPublicGameState(gameRoom.gameState, socket.id),
          newPlayer: player
        });

        if (gameRoom.gameState.players.length >= env.game.minPlayersToStart) {
          this.io?.to(data.roomCode).emit('gameReady', {
            playersCount: gameRoom.gameState.players.length
          });
        }

      } catch (error) {
        console.error('Join game error:', error);
        socket.emit('error', { 
          message: error instanceof Error ? error.message : 'Failed to join game',
          code: 'JOIN_GAME_ERROR'
        });
      }
    };
  }

  private handleStartGame(socket: Socket) {
    return (roomCode: string) => {
      try {
        const gameRoom = this.games.get(roomCode);
        
        if (!gameRoom) {
          throw new Error('Game not found');
        }

        const player = gameRoom.gameState.players.find(p => p.id === socket.id);
        if (!player?.isHost) {
          throw new Error('Only host can start the game');
        }

        if (gameRoom.gameState.players.length < env.game.minPlayersToStart) {
          throw new Error(`Need at least ${env.game.minPlayersToStart} players to start`);
        }

        const initializedGame = GameService.initializeGame(
          roomCode,
          gameRoom.gameState.players
        );

        gameRoom.gameState = initializedGame;
        gameRoom.lastActivity = new Date();

        initializedGame.players.forEach(player => {
          this.io?.to(player.id).emit('gameStarted', {
            gameState: this.getPublicGameState(initializedGame, player.id)
          });
        });

      } catch (error) {
        console.error('Start game error:', error);
        socket.emit('error', { 
          message: error instanceof Error ? error.message : 'Failed to start game',
          code: 'START_GAME_ERROR'
        });
      }
    };
  }

  private handlePlayCard(socket: Socket) {
    return (data: { roomCode: string; cardId: string; chosenColor?: string }) => {
      try {
        const gameRoom = this.games.get(data.roomCode);
        
        if (!gameRoom) {
          throw new Error('Game not found');
        }

        const updatedGame = GameService.playCard(
          gameRoom.gameState,
          socket.id,
          data.cardId,
          data.chosenColor as any
        );

        if (updatedGame !== gameRoom.gameState) {
          gameRoom.gameState = updatedGame;
          gameRoom.lastActivity = new Date();

          updatedGame.players.forEach(player => {
            this.io?.to(player.id).emit('gameStateUpdated', 
              this.getPublicGameState(updatedGame, player.id)
            );
          });

          if (updatedGame.winner) {
            this.io?.to(data.roomCode).emit('gameEnded', {
              winner: updatedGame.players.find(p => p.id === updatedGame.winner),
              gameState: this.getPublicGameState(updatedGame, '')
            });
          }
        }

      } catch (error) {
        console.error('Play card error:', error);
        socket.emit('error', { 
          message: error instanceof Error ? error.message : 'Failed to play card',
          code: 'PLAY_CARD_ERROR'
        });
      }
    };
  }

  private handleDrawCard(socket: Socket) {
    return (roomCode: string) => {
      try {
        const gameRoom = this.games.get(roomCode);
        
        if (!gameRoom) {
          throw new Error('Game not found');
        }

        const updatedGame = GameService.drawCards(gameRoom.gameState, socket.id, 1);
        gameRoom.gameState = updatedGame;
        gameRoom.lastActivity = new Date();

        updatedGame.players.forEach(player => {
          this.io?.to(player.id).emit('gameStateUpdated', 
            this.getPublicGameState(updatedGame, player.id)
          );
        });

      } catch (error) {
        console.error('Draw card error:', error);
        socket.emit('error', { 
          message: error instanceof Error ? error.message : 'Failed to draw card',
          code: 'DRAW_CARD_ERROR'
        });
      }
    };
  }

  private handleDisconnect(socket: Socket) {
    return () => {
      console.log(`Client disconnected: ${socket.id} at ${new Date().toISOString()}`);
      
      for (const [roomCode, gameRoom] of this.games.entries()) {
        const playerIndex = gameRoom.gameState.players.findIndex(p => p.id === socket.id);
        
        if (playerIndex !== -1) {
          const player = gameRoom.gameState.players[playerIndex];
          
          if (gameRoom.gameState.isGameStarted) {
            // Mark player as disconnected but keep them in the game
            player.isConnected = false;
            gameRoom.lastActivity = new Date();
            
            this.io?.to(roomCode).emit('playerDisconnected', {
              playerId: socket.id,
              gameState: this.getPublicGameState(gameRoom.gameState, '')
            });
          } else {
            // Remove player if game hasn't started
            gameRoom.gameState.players.splice(playerIndex, 1);
            
            if (gameRoom.gameState.players.length === 0) {
              this.games.delete(roomCode);
              RoomCodeGenerator.releaseRoomCode(roomCode);
            } else {
              // Transfer host if needed
              if (player.isHost) {
                gameRoom.gameState.players[0].isHost = true;
              }
              
              this.io?.to(roomCode).emit('playerLeft', {
                playerId: socket.id,
                gameState: this.getPublicGameState(gameRoom.gameState, '')
              });
            }
          }
          break;
        }
      }
    };
  }

  private getPublicGameState(gameState: GameState, playerId: string) {
    return {
      ...gameState,
      players: gameState.players.map(player => ({
        ...player,
        hand: player.id === playerId ? player.hand : player.hand.length
      })),
      deck: gameState.deck.length
    };
  }
}