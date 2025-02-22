import { NextApiResponse } from 'next';
import { Server as NetServer } from 'http';
import { Socket } from 'socket.io';

export interface NextApiResponseWithSocket extends NextApiResponse {
  socket: Socket & {
    server: NetServer & {
      io: any;
    };
  };
}