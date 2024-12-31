const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3001 });
const clients = new Set();

console.log('Servidor IRC iniciado en el puerto 3001');

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Cliente conectado. Total de clientes:', clients.size);

  ws.on('message', (message) => {
    // Broadcast el mensaje a todos los clientes conectados
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Cliente desconectado. Total de clientes:', clients.size);
  });

  ws.on('error', (error) => {
    console.error('Error de WebSocket:', error);
    clients.delete(ws);
  });
}); 