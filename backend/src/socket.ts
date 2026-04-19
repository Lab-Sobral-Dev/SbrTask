import { Server } from 'socket.io';

let _io: Server;

export const initSocket = (io: Server): void => {
  _io = io;
};

export const getIo = (): Server => {
  if (!_io) throw new Error('Socket.io not initialised');
  return _io;
};
