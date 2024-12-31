import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';
import type { NextApiResponse } from 'next';
import { Server as NetServer } from 'http';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface SocketServer extends HTTPServer {
  io?: SocketIOServer | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

export interface ResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

export const initSocket = (res: ResponseWithSocket) => {
  if (!res.socket.server.io) {
    const httpServer: HTTPServer = res.socket.server as any;
    const io = new SocketIOServer(httpServer, {
      path: '/api/socketio',
      addTrailingSlash: false,
      transports: ['websocket', 'polling'],
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? [
              'https://custom-gen.vercel.app',
              'wss://custom-gen.vercel.app',
              'https://custom-gen.vercel.app:*'
            ]
          : ['http://localhost:3000', 'http://localhost:*'],
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true,
        allowedHeaders: [
          'content-type',
          'authorization',
          'x-requested-with'
        ]
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      connectTimeout: 10000,
      allowEIO3: true
    });

    io.on('connection', (socket) => {
      console.log('Cliente conectado:', socket.id);

      socket.on('error', (error) => {
        console.error('Socket error:', error);
        socket.emit('reconnect_attempt');
      });

      socket.on('message', (message) => {
        io.emit('message', message);
      });

      socket.on('disconnect', (reason) => {
        console.log('Cliente desconectado:', socket.id, 'reason:', reason);
        if (reason === 'transport error' || reason === 'transport close') {
          socket.emit('reconnect_attempt');
        }
      });
    });

    res.socket.server.io = io;
  }
  return res.socket.server.io;
}; 