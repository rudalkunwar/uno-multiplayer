import { NextApiRequest } from 'next';
import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponseWithSocket } from '@/types/socket';
import { SocketServer } from '@/server/socket';

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    const httpServer: NetServer = res.socket.server as any;
    res.socket.server.io = new SocketServer(httpServer);
    console.log('Socket server initialized');
  }

  res.end();
};

export default SocketHandler;