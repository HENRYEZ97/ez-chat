import { NextRequest, NextResponse } from "next/server";
import { Server } from "socket.io";

// Função criada para configurar o servidor Socket.io e conexões
export async function GET(req: NextRequest) {
  try {

    // Verifica se o servidor foi iniciado
    if (!global.io) {
                            // Cria uma nova instância do servidor Socket.IO
      const io = new Server({
        path: "/api/socket",
        addTrailingSlash: false,
      });


      // Define o que acontece ao um usuario se conectar
      io.on("connection", (socket) => {
        console.log(`⚡: Um usuário conectou-se! ID: ${socket.id}`);


        // Evento de um usuario entrar
        socket.on("join_room", (roomId) => {
          socket.join(roomId);
          console.log(`Usuário ${socket.id} entrou na sala: ${roomId}`);
        });


        // Evento para enviar uma mensagem para uma sala específica
        socket.on("send_message", (data) => {
          // Repassa a mensagem para todos os outros na mesma sala
          socket.to(data.room).emit("receive_message", data);
          console.log("Dados da mensagem:", data);
        });


        // Evento de quando o usuário se desconecta
        socket.on("disconnect", () => {
          console.log("🔥: Um usuário desconectou-se.", socket.id);
        });
      });


                    // reutilização da instância socket.io armazenando-as
      global.io = io;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao configurar o Socket.IO:", error);
    return NextResponse.json(
      { success: false, error: "Falha na configuração" },
      { status: 500 }
    );
  }
}


// função declarando variável global..
declare global {
  var io: Server | undefined;
}