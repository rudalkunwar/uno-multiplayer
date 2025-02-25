/**
 * @description Custom server integrating Next.js with Socket.IO
 * @author rudalkunwar
 * @created 2025-02-25 07:19:34 UTC
 */

// Register module aliases first
import './src/utils/module-alias';

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { setupSocketServer } from './src/server/socket.server';
import { SOCKET_CONFIG } from './src/config/socket.config';
// Determine if we're in development mode
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

/**
 * @class ServerLogger
 * @description Handles server logging with timestamps and formatting
 */
class ServerLogger {
  private static formatTime(): string {
    return new Date().toISOString();
  }

  static info(message: string): void {
    console.log(`[${this.formatTime()}] INFO: ${message}`);
  }

  static error(message: string, error?: any): void {
    console.error(`[${this.formatTime()}] ERROR: ${message}`);
    if (error) {
      console.error(error);
    }
  }

  static warn(message: string): void {
    console.warn(`[${this.formatTime()}] WARN: ${message}`);
  }
}

/**
 * @class ServerHealthCheck
 * @description Manages server health checks and statistics
 */
class ServerHealthCheck {
  private static startTime = Date.now();
  private static connections = new Set<string>();

  static addConnection(id: string): void {
    this.connections.add(id);
  }

  static removeConnection(id: string): void {
    this.connections.delete(id);
  }

  static getStatus(): object {
    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      activeConnections: this.connections.size,
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
    };
  }
}

// Prepare and start the server
app.prepare().then(() => {
  ServerLogger.info('Initializing server...');

  const server = createServer(async (req, res) => {
    try {
      // Handle health check endpoint
      if (req.url === '/health') {
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(ServerHealthCheck.getStatus()));
        res.end();
        return;
      }

      // Parse the URL
      const parsedUrl = parse(req.url!, true);
      
      // Let Next.js handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      ServerLogger.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Setup error handling for the server
  server.on('error', (err) => {
    ServerLogger.error('Server error:', err);
  });

  // Setup Socket.IO with our custom configuration
  const io = setupSocketServer(server);

  // Add additional Socket.IO error handling
  io.on('connect_error', (err) => {
    ServerLogger.error('Socket connection error:', err);
  });

  io.on('connection', (socket) => {
    ServerHealthCheck.addConnection(socket.id);
    
    socket.on('disconnect', () => {
      ServerHealthCheck.removeConnection(socket.id);
    });
  });

  // Start listening
  server.listen(port, () => {
    ServerLogger.info(`
    ====================================
    🎮 UNO Game Server
    ------------------------------------
    🌍 Environment: ${dev ? 'development' : 'production'}
    🚀 Server ready at: http://${hostname}:${port}
    🔌 Socket.IO path: ${SOCKET_CONFIG.options.path}
    ⏰ Started at: ${new Date().toISOString()}
    ====================================
    `);
  });
}).catch((err) => {
  ServerLogger.error('Error starting server:', err);
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  ServerLogger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  ServerLogger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  ServerLogger.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  ServerLogger.error('Unhandled Rejection at:', promise);
  ServerLogger.error('Reason:', reason);
  process.exit(1);
});