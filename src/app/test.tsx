'use client';
import { useSocket } from '@/hooks/useSocket';
import { useEffect, useState } from 'react';

const Test = () => {
    const { socket, isConnected } = useSocket();
    useEffect(() => {
        if (!socket) return;
        return () => {
            socket.off('test-response');
        };
    }, [socket]);

    return (
        <div className="p-4">
            <div className="mb-4">
                <p className="text-lg font-bold">
                    Socket Status: {' '}
                    <span className={isConnected ? 'text-green-500' : 'text-red-500'}>
                        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Test;