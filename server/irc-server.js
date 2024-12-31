const { Server } = require('socket.io');
const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

console.log('Servidor IRC iniciado en el puerto 3001');

io.on('connection', (socket) => {
  console.log('Cliente conectado. Total de clientes:', io.engine.clientsCount);

  socket.on('message', (message) => {
    // Broadcast el mensaje a todos los clientes conectados
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado. Total de clientes:', io.engine.clientsCount);
  });

  socket.on('error', (error) => {
    console.error('Error de Socket.IO:', error);
  });
});