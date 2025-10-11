// SERVIDOR SOCKET.IO COM SALAS
 const { timeStamp } = require('console');
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

    //JOIN ADICIONADO (ENTRAR NA SALA)
    socket.on('join_room', (roomId) => {   
    socket.join(roomId);
    console.log(`${socket.id} entrou na sala: ${roomId}`);
  });

// SAIR DA SALA
  socket.on('leave_room', (roomId) => {
  socket.leave(roomId);
  console.log(`${socket.id} saiu da sala: ${roomId}`);
});


// ENVIAR MENSAGEM PARA UMA SALA
  socket.on('send_message', (data) => {
    console.log('MENSAGEM RECEBIDA!', data);

    io.to(data.room).emit('receive_message', {
      text: data.text,
      senderId: socket.id,
      room: data.room,
      timestamp: new Date().toISOString()
    });
  });

socket.on('disconnect', () => {
  console.log(`CLIENTE DESCONECTADO: ${socket.id}`);
});
});