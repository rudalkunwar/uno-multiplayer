//  create a type definition file for the environment variables to get TypeScript support:
declare global {
    namespace NodeJS {
      interface ProcessEnv {
        NEXT_PUBLIC_SOCKET_URL: string;
        PORT: string;
        MAX_PLAYERS_PER_ROOM: string;
        MIN_PLAYERS_TO_START: string;
        INITIAL_CARDS_PER_PLAYER: string;
        DATABASE_URL: string;
        NEXTAUTH_URL: string;
        NEXTAUTH_SECRET: string;
        RATE_LIMIT_REQUESTS: string;
        RATE_LIMIT_DURATION: string;
        WS_PING_INTERVAL: string;
        WS_PING_TIMEOUT: string;
        ROOM_CLEANUP_INTERVAL: string;
        PLAYER_TIMEOUT: string;
        NEXT_PUBLIC_API_BASE_URL: string;
      }
    }
  }
  
  export {};