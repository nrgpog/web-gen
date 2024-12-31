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
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? ['https://custom-gen.vercel.app']
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Manejar conexiones
    io.on('connection', (socket) => {
      console.log('Cliente conectado:', socket.id);

      socket.on('message', (message) => {
        io.emit('message', message);
      });

      socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
      });
    });

    res.socket.server.io = io;
  }
  return res.socket.server.io;
}; 