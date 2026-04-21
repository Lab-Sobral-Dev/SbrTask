import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.REACT_APP_API_URL ||
  'http://localhost:3001/api';

export const connectSocket = (userId: string) => {
  if (socket?.connected) {
    return socket;
  }

  const SOCKET_URL = API_URL.replace('/api', '');

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    socket?.emit('join-user-room', userId);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

let _publicSocket: Socket | null = null;

export const connectPublicSocket = (): Socket => {
  if (_publicSocket?.connected) return _publicSocket;

  const SOCKET_URL = API_URL.replace('/api', '');
  _publicSocket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
  });

  _publicSocket.on('connect', () => {
    _publicSocket?.emit('join-ranking');
  });

  return _publicSocket;
};

export const disconnectPublicSocket = (): void => {
  if (_publicSocket) {
    _publicSocket.disconnect();
    _publicSocket = null;
  }
};

export default socket;
