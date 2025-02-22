// create a configuration file to use these environment variables in your application:

export const env = {
    server: {
      socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
      port: parseInt(process.env.PORT || '3000', 10),
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
    },
    game: {
      maxPlayersPerRoom: parseInt(process.env.MAX_PLAYERS_PER_ROOM || '4', 10),
      minPlayersToStart: parseInt(process.env.MIN_PLAYERS_TO_START || '2', 10),
      initialCardsPerPlayer: parseInt(process.env.INITIAL_CARDS_PER_PLAYER || '7', 10),
    },
    websocket: {
      pingInterval: parseInt(process.env.WS_PING_INTERVAL || '25000', 10),
      pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '20000', 10),
    },
    room: {
      cleanupInterval: parseInt(process.env.ROOM_CLEANUP_INTERVAL || '3600000', 10),
      playerTimeout: parseInt(process.env.PLAYER_TIMEOUT || '300000', 10),
    },
    security: {
      rateLimitRequests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100', 10),
      rateLimitDuration: parseInt(process.env.RATE_LIMIT_DURATION || '60', 10),
    },
  } as const;
  
  // Type for the environment configuration
  export type EnvConfig = typeof env;