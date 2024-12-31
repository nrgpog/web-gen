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

interface ResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

const SocketHandler = async (req: any, res: ResponseWithSocket) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    if (!res.socket.server.io) {
      console.log('Iniciando nuevo servidor Socket.IO...');
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
        transports: ['polling', 'websocket'],
        pingTimeout: 60000,
        pingInterval: 25000,
      });

      io.on('connection', (socket) => {
        console.log('Cliente conectado:', socket.id);

        socket.on('message', (message) => {
          try {
            io.emit('message', message);
          } catch (error) {
            console.error('Error al emitir mensaje:', error);
          }
        });

        socket.on('error', (error) => {
          console.error('Error de socket:', error);
        });

        socket.on('disconnect', () => {
          console.log('Cliente desconectado:', socket.id);
        });
      });

      res.socket.server.io = io;
    }

    res.end();
  } catch (error) {
    console.error('Error en el manejador de Socket.IO:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default SocketHandler; 