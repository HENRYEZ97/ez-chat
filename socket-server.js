// socket-server.js - Servidor Socket.IO independente
const { Server } = require('socket.io');

const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

console.log('🔄 Servidor Socket.IO iniciado na porta 3001...');

io.on('connection', (socket) => {
  console.log(`✅ CLIENTE CONECTADO: ${socket.id}`);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`🚪 ${socket.id} entrou na sala: ${roomId}`);
  });

  socket.on('send_message', (data) => {
    console.log('📨 MENSAGEM RECEBIDA:', data);
    
    // Envia para TODOS na sala (funciona!)
    io.to(data.room).emit('receive_message', {
      text: data.text,
      from: 'other',
      senderId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ CLIENTE DESCONECTADO: ${socket.id}`);
  });
});