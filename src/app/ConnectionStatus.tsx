'use client';

import { useEffect, useState } from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  error: string | null;
  socket: any;
}

export const ConnectionStatus = ({ isConnected, error, socket }: ConnectionStatusProps) => {
  const [connectionInfo, setConnectionInfo] = useState<string>('Initializing...');

  useEffect(() => {
    if (!socket) {
      setConnectionInfo('Initializing socket...');
      return;
    }
    setConnectionInfo(`Connected: ${socket.connected}, ID: ${socket.id}`);
  }, [socket]);

  return (
    <div className="mb-6 p-4 rounded border bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`} />
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
      <div className="mt-2 text-sm font-mono text-gray-600">
        {connectionInfo}
      </div>
      {error && (
        <div className="mt-2 text-red-500 animate-pulse">
          Error: {error}
        </div>
      )}
    </div>
  );
};