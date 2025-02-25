import { NextResponse } from 'next/server';
import { setupSocketServer } from '@/server/socket.server';
import { createServer } from 'http';

const server = createServer();
const io = setupSocketServer(server);

server.listen(parseInt(process.env.SOCKET_PORT || '3000'), () => {
  console.log(`Socket server running on port ${process.env.SOCKET_PORT || 3000}`);
});

export async function GET() {
  return NextResponse.json({ status: 'Socket server is running' });
}