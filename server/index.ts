import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { LobbyManager } from './lobbyManager'
import { GameManager } from './gameManager'

export class UnoGameServer {
  private io: SocketIOServer
  private lobbyManager: LobbyManager
  private gameManager: GameManager

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    this.lobbyManager = new LobbyManager()
    this.gameManager = new GameManager()

    this.initializeSocketHandlers()
  }

  private initializeSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Player connected: ${socket.id}`)

      // Handle player joining lobby
      socket.on('joinLobby', (playerName: string) => {
        this.lobbyManager.addPlayer(socket.id, playerName)
        socket.emit('lobbyJoined', { playerId: socket.id })
      })

      // Handle create game room
      socket.on('createRoom', () => {
        const roomCode = this.lobbyManager.createRoom(socket.id)
        socket.join(roomCode)
        socket.emit('roomCreated', { roomCode })
      })

      // Handle join game room
      socket.on('joinRoom', (roomCode: string) => {
        const joinResult = this.lobbyManager.joinRoom(socket.id, roomCode)
        if (joinResult.success) {
          socket.join(roomCode)
          socket.emit('roomJoined', { roomCode })
          
          // Start game if room is full (4 players)
          if (this.lobbyManager.isRoomFull(roomCode)) {
            const players = this.lobbyManager.getPlayersInRoom(roomCode)
            const gameId = this.gameManager.createGame(players)
            this.io.to(roomCode).emit('gameStart', { gameId })
          }
        } else {
          socket.emit('error', { message: joinResult.error })
        }
      })

      // Handle game actions
      socket.on('playCard', (data: { gameId: string, cardIndex: number }) => {
        const gameState = this.gameManager.playCard(data.gameId, socket.id, data.cardIndex)
        if (gameState) {
          this.io.to(gameState.roomCode).emit('gameStateUpdate', gameState)
        }
      })

      socket.on('drawCard', (gameId: string) => {
        const gameState = this.gameManager.drawCard(gameId, socket.id)
        if (gameState) {
          this.io.to(gameState.roomCode).emit('gameStateUpdate', gameState)
        }
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`)
        this.lobbyManager.removePlayer(socket.id)
        this.gameManager.handlePlayerDisconnect(socket.id)
      })
    })
  }
}

// Export a function to create the server instance
export const createUnoServer = (httpServer: HTTPServer): UnoGameServer => {
  return new UnoGameServer(httpServer)
}