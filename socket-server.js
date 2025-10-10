// SERVIDOR SOCKET.IO COM SALAS
 const { Server } = require('socket.io');
 const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
 });

console.log('Servidor Socket.IO com salas iniciado na porta 3001...');

io.on('connection', (socket) => {
  console.log(`USUÁRIO CONECTADO: ${socket.id}`);

// ENTRAR EM UMA SALA
  socket.on('leave_room', (roomId) => {
  socket.leave(roomId);
  console.log(`${socket.id} saiu da sala: ${roomId}`);
});

// ENVIAR MENSAGEM PARA UMA SALA
  socket.on('send_message', (data) => {
    const { room, message, sender } = data;
  console.log('MENSAGEM RECEBIDA:', data);

  socket.to(room).emit('receive_message', {
    room,
    message,
    sender,
  });

// A MENSAGEM É ENVIADA APENAS PARA UMA SALA ESPECÍFICA
    io.to(data.room).emit('receive_message', {
      text: data.text,
      from: 'other',
      senderId: socket.id,
      room: data.room,  //SALA
      timestamp: new Date().toISOString()
    });
});

socket.on('disconnect', () => {
  console.log(`CLIENTE DESCONECTADO: ${socket.id}`);
});
});