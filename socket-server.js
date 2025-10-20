
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3001;
const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT || 5432),
});


const app = express();
app.use(helmet());
app.use(cors({ origin: FRONT_URL }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: FRONT_URL, methods: ['GET', 'POST'] }
});


function signToken(user) {
  const payload = { id: user.id, nome: user.nome, email: user.email, setor: user.setor };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
}

async function getSalaByName(nome) {
  const r = await pool.query('SELECT id, nome FROM salas WHERE nome = $1', [nome]);
  return r.rows[0];
}

// Helper para criar ID único de sala privada
function criarSalaPrivada(userId1, userId2) {
  const ids = [Number(userId1), Number(userId2)].sort((a, b) => a - b);
  return `privada_${ids[0]}_${ids[1]}`;
}


// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nome, email, senha, setor } = req.body;
    if (!nome || !email || !senha || !setor) return res.status(400).json({ success: false, message: 'Campos faltando' });

    const exists = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (exists.rowCount > 0) return res.status(409).json({ success: false, message: 'Email já cadastrado' });

    const hash = await bcrypt.hash(senha, 12);
    const insert = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, setor) VALUES ($1,$2,$3,$4) RETURNING id, nome, email, setor',
      [nome, email, hash, setor]
    );
    const user = insert.rows[0];
    const token = signToken(user);
    return res.json({ success: true, message: 'Registrado', token, user });
  } catch (err) {
    console.error('ERR register', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ success: false, message: 'Campos faltando' });

    const r = await pool.query('SELECT id, nome, email, senha, setor FROM usuarios WHERE email = $1', [email]);
    const user = r.rows[0];
    if (!user) return res.status(401).json({ success: false, message: 'Credenciais inválidas' });

    const ok = await bcrypt.compare(senha, user.senha);
    if (!ok) return res.status(401).json({ success: false, message: 'Credenciais inválidas' });

    const token = signToken(user);
    const safeUser = { id: user.id, nome: user.nome, email: user.email, setor: user.setor };
    return res.json({ success: true, message: 'Logado', token, user: safeUser });
  } catch (err) {
    console.error('ERR login', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

// Rota para buscar usuários (para conversas privadas)
app.get('/api/users', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ success: false, message: 'Sem token' });
      const token = auth.split(' ')[1];
       let currentUser;
       try { 
        currentUser = jwt.verify(token, process.env.JWT_SECRET); 
        } catch (e) { 
      return res.status(401).json({ success: false, message: 'Token inválido' }); 
    }
    const users = await pool.query(
    'SELECT id, nome, email, setor FROM usuarios WHERE id != $1 ORDER BY nome',
    [currentUser.id]
    );
    return res.json({ success: true, users: users.rows });
    } catch (err) {
    console.error('ERR /api/users', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

// Rota para buscar histórico de mensagens de uma sala - CORRIGIDA
app.get('/api/rooms/:roomName/messages', async (req, res) => {
  try {
    const auth = req.headers.authorization;
      if (!auth) return res.status(401).json({ success: false, message: 'Sem token' });
      const token = auth.split(' ')[1];
      let payload;
      try { 
        payload = jwt.verify(token, process.env.JWT_SECRET); 
    } catch (e) { 
    return res.status(401).json({ success: false, message: 'Token inválido' }); 
    }

    const roomName = req.params.roomName;

    // Se for sala privada, verifica se o usuário é participante
    if (roomName.startsWith('privada_')) {
      const [_, userId1, userId2] = roomName.split('_');
      const participantes = [parseInt(userId1), parseInt(userId2)];
      
      if (!participantes.includes(payload.id)) {
        return res.status(403).json({ success: false, message: 'Acesso negado a esta conversa' });
      }

      const msgs = await pool.query(
        `SELECT m.id, m.usuario_id, u.nome as usuario_nome, m.content, m.criado_em
         FROM mensagens m
         JOIN usuarios u ON u.id = m.usuario_id
         WHERE m.setor_destino = $1
         ORDER BY m.criado_em ASC`,
        [roomName]
      );

      return res.json({ success: true, messages: msgs.rows });
    }

    // Para salas normais - CORREÇÃO: Verifica permissão do usuário
    const sala = await pool.query('SELECT id FROM salas WHERE nome = $1', [roomName]);
    if (sala.rowCount === 0) return res.status(404).json({ success: false, message: 'Sala não encontrada' });
    
    //  VERIFICAÇÃO DE PERMISSÃO: Só permite acesso se for sala geral ou do mesmo setor
    if (roomName !== 'geral' && payload.setor !== roomName) {
      return res.status(403).json({ success: false, message: 'Acesso negado a esta sala' });
    }
    
    const salaId = sala.rows[0].id;
    const msgs = await pool.query(
      `SELECT m.id, m.usuario_id, u.nome as usuario_nome, m.content, m.criado_em
       FROM mensagens m
       JOIN usuarios u ON u.id = m.usuario_id
       WHERE m.sala_id = $1
       ORDER BY m.criado_em ASC`,
      [salaId]
    );

    return res.json({ success: true, messages: msgs.rows });
  } catch (err) {
    console.error('ERR /rooms/:room/messages', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

// ------- SOCKET.IO AUTH ----------
io.use((socket, next) => {
  const token = (socket.handshake.auth && socket.handshake.auth.token) || (socket.handshake.headers && socket.handshake.headers.authorization && socket.handshake.headers.authorization.split(' ')[1]);
  if (!token) return next(new Error('token ausente'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = payload;
    return next();
  } catch (err) {
    return next(new Error('token inválido'));
  }
});

// ------- SOCKET.IO EVENTS ----------
io.on('connection', (socket) => {
  console.log('usuário conectado', socket.id, socket.user);

  // join_room: CORRIGIDO - Verifica permissões
  socket.on('join_room', async (roomName) => {
    try {
      // Para salas privadas
      if (roomName.startsWith('privada_')) {
        const [_, userId1, userId2] = roomName.split('_');
        const participantes = [parseInt(userId1), parseInt(userId2)];
        
        if (!participantes.includes(socket.user.id)) {
          socket.emit('error_message', { message: 'Acesso negado a esta conversa' });
          return;
        }

        socket.join(roomName);
        console.log(`${socket.user.nome} entrou na conversa privada ${roomName}`);
        socket.emit('joined_room', { room: roomName });
        return;
      }

      // Para salas normais - CORREÇÃO: Verifica permissão
      const sala = await getSalaByName(roomName);
      if (!sala) {
        socket.emit('error_message', { message: 'Sala inexistente' });
        return;
      }

      // Só permite entrar se for sala geral ou do mesmo setor
      if (roomName !== 'geral' && socket.user.setor !== roomName) {
        socket.emit('error_message', { message: 'Você não tem acesso a esta sala' });
        return;
      }

      socket.join(roomName);
      console.log(`${socket.user.nome} entrou na sala ${roomName}`);
      socket.emit('joined_room', { room: roomName });
    } catch (err) {
      console.error('ERR join_room', err);
      socket.emit('error_message', { message: 'Erro ao entrar na sala' });
    }
  });

  socket.on('leave_room', (roomName) => {
    socket.leave(roomName);
    socket.emit('left_room', { room: roomName });
  });

  // send_message: CORRIGIDO - Sem duplicação
  socket.on('send_message', async (data) => {
    try {
      const { text, room } = data;
      if (!text || !room) return socket.emit('error_message', { message: 'Dados incompletos' });

      console.log(` ${socket.user.nome} enviando para: ${room}`);

      if (room === 'geral') {
        //  Sala GERAL - todos recebem
        const sala = await getSalaByName('geral');
        await pool.query(
          'INSERT INTO mensagens (usuario_id, sala_id, content, setor_destino) VALUES ($1,$2,$3,$4)',
          [socket.user.id, sala.id, text, 'geral']
        );
        
        // Envia para TODOS os usuários
        io.emit('receive_message', {
          text,
          sender: { id: socket.user.id, nome: socket.user.nome, setor: socket.user.setor },
          room: 'geral',
          timestamp: new Date().toISOString()
        });

      } else if (room.startsWith('privada_')) {
        // Sala PRIVADA - só os 2 participantes recebem
        const [_, userId1, userId2] = room.split('_');
        const participantes = [parseInt(userId1), parseInt(userId2)];
        
        if (!participantes.includes(socket.user.id)) {
          return socket.emit('error_message', { message: 'Você não pode enviar nesta conversa' });
        }

        await pool.query(
          'INSERT INTO mensagens (usuario_id, sala_id, content, setor_destino) VALUES ($1,$2,$3,$4)',
          [socket.user.id, 0, text, room]
        );

        // Envia apenas para os 2 participantes
        io.to(room).emit('receive_message', {
          text,
          sender: { id: socket.user.id, nome: socket.user.nome, setor: socket.user.setor },
          room: room,
          timestamp: new Date().toISOString()
        });

      } else {
        // Sala de SETOR - só o setor recebe
        const sala = await getSalaByName(room);
        if (!sala) return socket.emit('error_message', { message: 'Sala inválida' });

        // Verifica se o usuário pertence ao setor
        if (socket.user.setor !== room) {
          return socket.emit('error_message', { message: 'Você não pode enviar nesta sala' });
        }

        await pool.query(
          'INSERT INTO mensagens (usuario_id, sala_id, content, setor_destino) VALUES ($1,$2,$3,$4)',
          [socket.user.id, sala.id, text, room]
        );

        // Envia apenas para usuários do mesmo setor
        io.to(room).emit('receive_message', {
          text,
          sender: { id: socket.user.id, nome: socket.user.nome, setor: socket.user.setor },
          room: room,
          timestamp: new Date().toISOString()
        });
      }

    } catch (err) {
      console.error('ERR send_message', err);
      socket.emit('error_message', { message: 'Erro ao enviar mensagem' });
    }
  });

  socket.on('disconnect', () => {
    console.log('usuário desconectado', socket.id);
  });
});

// start
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});