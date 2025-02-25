import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { GameService } from '@/services/GameService';

export function setupSocketServer(httpServer: HttpServer) {
    const io = new SocketIOServer(httpServer, {
        path: '/socket.io',
        cors: {
            origin: '*', // In production, set this to your specific domain
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket']
    });

    // Store active games
    const games = new Map();

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on('createGame', async (data, callback) => {
            try {
                const { username, settings } = data;
                const game = GameService.createGame(settings.roomCode, socket.id, username, settings);
                games.set(settings.roomCode, game);
                
                socket.join(settings.roomCode);
                callback({ success: true, roomCode: settings.roomCode, gameState: game.getState() });
            } catch (error) {
                console.error('Create game error:', error);
                callback({ error: error instanceof Error ? error.message : 'Failed to create game' });
            }
        });

        socket.on('joinGame', async (data, callback) => {
            try {
                const { roomCode, username } = data;
                const game = games.get(roomCode);
                
                if (!game) {
                    throw new Error('Game not found');
                }

                game.addPlayer(socket.id, username);
                socket.join(roomCode);
                
                io.to(roomCode).emit('gameStateUpdated', game.getState());
                callback({ success: true });
            } catch (error) {
                console.error('Join game error:', error);
                callback({ error: error instanceof Error ? error.message : 'Failed to join game' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
            // Handle player disconnection
            games.forEach((game, roomCode) => {
                try {
                    if (game.hasPlayer(socket.id)) {
                        game.removePlayer(socket.id);
                        io.to(roomCode).emit('gameStateUpdated', game.getState());
                    }
                } catch (error) {
                    console.error('Error handling disconnect:', error);
                }
            });
        });
    });

    return io;
}