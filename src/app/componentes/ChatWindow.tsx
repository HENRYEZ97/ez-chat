"use client";
import { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";

// estrutura de uma mensagem
interface Message {
  text: string;
  from: "me" | "bot";
  room?: string; // Sala/departamento (opcional por enquanto)
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Olá! Em qual setor posso ajudar?", from: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efeito para inicializar o Socket.IO quando o componente montar
  useEffect(() => {
    // Inicializa a conexão com o servidor Socket.IO
    const newSocket = io({
      path: "/api/socket",
    });
    setSocket(newSocket);

    // Configura o listener para receber mensagens do servidor
    newSocket.on("receive_message", (data: { text: string }) => {
      // Adiciona a mensagem recebida ao estado, tratando como "bot"
      setMessages((prev) => [...prev, { text: data.text, from: "bot" }]);
    });

    // Limpeza: desconecta o socket quando o componente desmontar
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Efeito para scroll automático quando novas mensagens chegarem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Função para enviar uma mensagem
  const sendMessage = () => {
    if (input.trim() === "" || !socket) return;

    // Adiciona a própria mensagem localmente
    const newMessage: Message = { text: input, from: "me" };
    setMessages((prev) => [...prev, newMessage]);
    setInput(""); // Limpa o input

    // Envia a mensagem para o servidor Socket.IO
    // O parâmetro 'room' pode ser dinâmico (ex: vindo do Sidebar)
    socket.emit("send_message", {
      text: input,
      room: "ti", // Por enquanto, fixo. Vamos dinamizar depois!
    });
  };

  // Função para enviar mensagem com a tecla Enter
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="flex-1 h-screen flex flex-col bg-gray-100">
      {/* CABEÇALHO */}
      <div className="p-4 bg-blue-500 border-b">
        <h2 className="font-semibold text-center cursor-pointer">
          Chat - Suporte (TI) {/* Indica a sala atual */}
        </h2>
      </div>

      {/* ÁREA DE MENSAGENS */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`cursor-pointer p-2 rounded-lg shadow max-w-xs break-words whitespace-normal ${
              msg.from === "me"
                ? "bg-blue-500 text-white self-end ml-auto"
                : "bg-gray-300 dark:bg-gray-700 text-white self-start"
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT DE MENSAGEM */}
      <div className="p-4 border-t bg-gray-200 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Digite sua mensagem..."
          className="flex-1 rounded-l-lg px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded cursor-pointer hover:bg-cyan-500 ml-1"
        >
          Enviar
        </button>
        {/* Removemos o botão de simulação, pois agora é real! */}
      </div>
    </div>
  );
}