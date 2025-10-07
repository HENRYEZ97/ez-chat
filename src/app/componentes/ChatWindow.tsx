"use client";
import { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";

// 📝 INTERFACE - define o formato das mensagens
interface Message {
  id: string;           // ID único para cada mensagem
  text: string;         // Texto da mensagem
  from: "me" | "other"; // Quem enviou
  timestamp: string;    // Quando foi enviada
  room?: string;        // Sala/departamento
}

export default function ChatWindow() {
  // 🎯 ESTADOS - dados que mudam durante o uso
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: "1", 
      text: "Chat em tempo real ATIVO! 🚀", 
      from: "other", 
      timestamp: new Date().toISOString() 
    },
  ]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState("geral");
  
  // 📜 REF - para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🔥 EFFECT #1 - CONEXÃO SOCKET (roda quando componente carrega)
  useEffect(() => {
    console.log("🎯 Iniciando conexão Socket.IO...");
    
    // Conecta com o servidor na porta 3001
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    // 📡 OUVINTES DE EVENTOS - escutam o servidor
    newSocket.on("connect", () => {
      console.log("✅ CONECTADO AO SERVIDOR!");
      setIsConnected(true);
      
      // Entra na sala "geral" automaticamente
      newSocket.emit("join_room", "geral");
      console.log("🚪 Entrou na sala: geral");
    });

    // 💬 RECEBER MENSAGENS DE OUTROS USUÁRIOS
    newSocket.on("receive_message", (data: any) => {
      console.log("📩 Mensagem recebida:", data);
      
      // ✅ CORREÇÃO: Determina se a mensagem é "minha" ou "de outros"
      const messageFrom = data.senderId === newSocket.id ? "me" : "other";
      
      // Adiciona a mensagem com ID único
      const newMessage: Message = {
        id: Date.now().toString(),
        text: data.text,
        from: messageFrom, // ← AGORA USA A LÓGICA CORRETA
        timestamp: new Date().toISOString(),
        room: data.room
      };
      
      setMessages((prev) => [...prev, newMessage]);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ DESCONECTADO DO SERVIDOR");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("💥 ERRO DE CONEXÃO:", error);
    });

    // 🧹 LIMPEZA - desconecta quando componente é destruído
    return () => {
      console.log("🧹 Limpando conexão Socket.IO...");
      newSocket.disconnect();
    };
  }, []);

  // 📜 EFFECT #2 - SCROLL AUTOMÁTICO (roda quando messages muda)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "nearest"
    });
  }, [messages]);

  // 📤 FUNÇÃO - ENVIAR MENSAGEM (CORRIGIDA!)
  const sendMessage = () => {
    if (input.trim() === "" || !socket) {
      console.log("⛔ Mensagem vazia ou socket não conectado");
      return;
    }

    // ✅ CORREÇÃO: NÃO adiciona a mensagem localmente
    // Apenas envia para o servidor, que vai repassar para todos
    
    setInput(""); // Limpar input

    // 🚀 ENVIAR PARA O SERVIDOR (que repassa para todos)
    socket.emit("send_message", {
      text: input,
      room: currentRoom
    });
    
    console.log("📤 Mensagem enviada para o servidor:", input);
  };

  // ⌨️ FUNÇÃO - TECLA ENTER
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  //  RENDER - interface do usuário
  return (
    <div className="flex-1 h-screen flex flex-col bg-gray-100">
      {/*  CABEÇALHO */}
      <div className="p-4 bg-blue-600 border-b justify-between flex items-center shadow-lg">
        <div>
          <h2 className="font-bold text-white text-lg">
            Chat Empresarial
          </h2>
          <p className="text-blue-100 text-sm">
            Sala: {currentRoom} • {isConnected ? '✅ Online' : '❌ Offline'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            isConnected ? 'bg-green-400' : 'bg-red-400'
          }`} />
          <span className="text-white text-sm font-medium">
            {socket?.id ? `ID: ${socket.id.slice(0, 8)}...` : 'Conectando...'}
          </span>
        </div>
      </div>

      {/*  ÁREA DE MENSAGENS */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-4 rounded-2xl shadow-lg max-w-md break-words whitespace-normal transition-all duration-300 ${
              msg.from === "me"
                ? "bg-blue-500 text-white ml-auto hover:bg-blue-600 mb-15 cursor-pointer"
                : "bg-gray-700 text-white border border-gray-200 hover:bg-gray-900 mb-15 cursor-pointer"
            }`}
          >
            <div className="text-sm leading-relaxed">{msg.text}</div>
            <div className={`text-xs mt-2 ${
              msg.from === "me" ? "text-blue-100" : "text-gray-500"
            }`}>
              {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ÁREA DE DIGITAÇÃO */}
      <div className="p-4 border-t bg-white shadow-inner">
        <div className="flex rounded-lg overflow-hidden border border-gray-300 shadow-sm">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              isConnected 
                ? "Digite sua mensagem..." 
                : "Conectando ao servidor..."
            }
            className="flex-1 px-4 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isConnected}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || input.trim() === ""}
            className="bg-blue-500 text-white px-6 cursor-pointer font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
          >
            <span>Enviar</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        {/* 📊 INFO DE DEBUG */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          {isConnected && `Conectado • Mensagens: ${messages.length} • Use duas abas para testar`}
        </div>
      </div>
    </div>
  );
}