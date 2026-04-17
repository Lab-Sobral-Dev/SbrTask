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

export default socket;
