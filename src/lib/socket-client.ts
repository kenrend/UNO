'use client';

import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

interface SocketOptions {
  path?: string;
  transports?: string[];
  autoConnect?: boolean;
}

export const getSocket = (): Socket => {
  if (socketInstance) {
    return socketInstance;
  }

  // Determine the base URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  
  // Socket.IO configuration
  const options: SocketOptions = {
    path: '/api/socketio',
    transports: ['websocket', 'polling'],
    autoConnect: false,
  };

  // If we have a custom site URL, use it as the base
  if (baseUrl) {
    socketInstance = io(baseUrl, options);
  } else {
    // Use same-origin by not specifying a URL
    socketInstance = io(options);
  }

  return socketInstance;
};

export const connectSocket = (): Socket => {
  const socket = getSocket();
  
  if (!socket.connected) {
    socket.connect();
  }
  
  return socket;
};

export const disconnectSocket = (): void => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

// Export the singleton instance getter
export default getSocket;