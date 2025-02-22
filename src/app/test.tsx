
'use client';

import { useSocket } from '@/hooks/useSocket';
import { useEffect, useState } from 'react';

const Test = () => {
    const { socket, isConnected } = useSocket();
    const [message, setMessage] = useState('');
    const [receivedMessages, setReceivedMessages] = useState<string[]>([]);

    useEffect(() => {
        if (!socket) return;

        // Listen for test messages
        socket.on('test-response', (msg: string) => {
            setReceivedMessages(prev => [...prev, msg]);
        });

        return () => {
            socket.off('test-response');
        };
    }, [socket]);

    const sendTestMessage = () => {
        if (socket && message) {
            socket.emit('test-message', message);
            setMessage('');
        }
    };

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

            <div className="mb-4">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="border p-2 mr-2 rounded"
                    placeholder="Type a test message"
                />
                <button
                    onClick={sendTestMessage}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    disabled={!isConnected}
                >
                    Send Test Message
                </button>
            </div>

            <div>
                <h3 className="font-bold mb-2">Received Messages:</h3>
                <div className="border rounded p-2">
                    {receivedMessages.map((msg, index) => (
                        <p key={index}>{msg}</p>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Test;