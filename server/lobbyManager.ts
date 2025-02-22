interface Player {
    id: string
    name: string
  }
  
  interface Room {
    code: string
    players: Player[]
    host: string
  }
  
  export class LobbyManager {
    private rooms: Map<string, Room>
    private players: Map<string, Player>
  
    constructor() {
      this.rooms = new Map()
      this.players = new Map()
    }
  
    private generateRoomCode(): string {
      return Math.random().toString(36).substring(2, 8).toUpperCase()
    }
  
    public addPlayer(playerId: string, playerName: string): void {
      this.players.set(playerId, { id: playerId, name: playerName })
    }
  
    public removePlayer(playerId: string): void {
      this.players.delete(playerId)
      // Remove player from any rooms they're in
      this.rooms.forEach((room, roomCode) => {
        room.players = room.players.filter(p => p.id !== playerId)
        if (room.players.length === 0) {
          this.rooms.delete(roomCode)
        }
      })
    }
  
    public createRoom(hostId: string): string {
      const roomCode = this.generateRoomCode()
      const host = this.players.get(hostId)
      
      if (!host) {
        throw new Error('Player not found')
      }
  
      this.rooms.set(roomCode, {
        code: roomCode,
        players: [host],
        host: hostId
      })
  
      return roomCode
    }
  
    public joinRoom(playerId: string, roomCode: string): { success: boolean, error?: string } {
      const room = this.rooms.get(roomCode)
      const player = this.players.get(playerId)
  
      if (!room) {
        return { success: false, error: 'Room not found' }
      }
  
      if (!player) {
        return { success: false, error: 'Player not found' }
      }
  
      if (room.players.length >= 4) {
        return { success: false, error: 'Room is full' }
      }
  
      if (room.players.some(p => p.id === playerId)) {
        return { success: false, error: 'Player already in room' }
      }
  
      room.players.push(player)
      return { success: true }
    }
  
    public isRoomFull(roomCode: string): boolean {
      const room = this.rooms.get(roomCode)
      return room ? room.players.length === 4 : false
    }
  
    public getPlayersInRoom(roomCode: string): Player[] {
      const room = this.rooms.get(roomCode)
      return room ? [...room.players] : []
    }
  
    public getRoomByPlayerId(playerId: string): Room | undefined {
      return Array.from(this.rooms.values()).find(room => 
        room.players.some(player => player.id === playerId)
      )
    }
  }