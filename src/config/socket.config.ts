/**
 * @description Socket configuration and timeouts
 * @created 2025-02-25 07:13:11
 * @author rudalkunwar
 */

export const SOCKET_CONFIG = {
  url: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
  options: {
    reconnectionDelayMax: 10000,
    reconnectionAttempts: 5,
    timeout: 15000,
    transports: ['websocket'],
    forceNew: true,
    reconnection: true,
    reconnectionDelay: 1000,
    path: '/socket.io'
  }
};

export const SOCKET_TIMEOUTS = {
  DEFAULT: 15000,
  CREATE_GAME: 20000,
  MAX_RETRIES: 2
};