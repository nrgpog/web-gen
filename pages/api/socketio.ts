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
  if (req.method !== 'GET' && req.method !== 'POST') {
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
          methods: ['GET', 'POST', 'OPTIONS'],
          credentials: true,
          allowedHeaders: ['content-type', 'authorization']
        },
        transports: ['polling', 'websocket'],
        pingTimeout: 60000,
        pingInterval: 25000,
        upgradeTimeout: 30000,
        allowUpgrades: true,
        connectTimeout: 45000,
        cookie: {
          name: 'io',
          path: '/',
          httpOnly: true,
          sameSite: 'strict'
        }
      });

      io.on('connection', (socket) => {
        console.log('Cliente conectado:', socket.id);

        socket.on('message', (message) => {
          try {
            console.log('Mensaje recibido del cliente:', socket.id);
            io.emit('message', message);
          } catch (error) {
            console.error('Error al emitir mensaje:', error);
            socket.emit('error', { message: 'Error al procesar el mensaje' });
          }
        });

        socket.on('error', (error) => {
          console.error('Error de socket:', error);
        });

        socket.on('disconnect', (reason) => {
          console.log('Cliente desconectado:', socket.id, 'razón:', reason);
        });
      });

      res.socket.server.io = io;
    }

    if (req.method === 'GET') {
      res.end();
    } else {
      res.status(200).json({ status: 'ok' });
    }
  } catch (error) {
    console.error('Error en el manejador de Socket.IO:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export default SocketHandler; 