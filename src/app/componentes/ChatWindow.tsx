"use client";
import { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  id: string;
  text: string;
  from: "me" | "other";
  timestamp: string;
  room: string;
}

export default function ChatWindow() {
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [salaAtual, setSalaAtual] = useState("geral");

  const [historicoPorSala, setHistoricoPorSala] = useState<{[key: string]: Message[]}>({
    geral: [{
      id: "1",
      text: "Bem-vindo ao chat geral!",
      from: "other",
      timestamp: new Date().toISOString(),
      room: "geral"
    }],
    ti: [{
      id: "2",
      text: "Sala de Tecnologia ativa!",
      from: "other",
      timestamp: new Date().toISOString(),
      room: "ti"
    }],
    financeiro: [{
      id: "3",
      text: "Sala do Financeiro aberta!",
      from: "other",
      timestamp: new Date().toISOString(),
      room: "financeiro"
    }],
    rh: [{
      id: "4",
      text: "Recursos Humanos online!",
      from: "other",
      timestamp: new Date().toISOString(),
      room: "rh"
    }],
    vendas: [{
      id: "5",
      text: "Sala de Vendas disponível!",
      from: "other",
      timestamp: new Date().toISOString(),
      room: "vendas"
    }],
    suporte: [{
      id: "6",
      text: "Suporte técnico ativo!",
      from: "other",
      timestamp: new Date().toISOString(),
      room: "suporte"
    }]
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
      newSocket.emit("join_room", salaAtual);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handler = (data: any) => {
      const messageFrom: "me" | "other" = data.senderId === socket?.id ? "me" : "other";
      
      const newMessage: Message = {
        id: Date.now().toString(),
        text: data.text,
        from: messageFrom,
        timestamp: data.timestamp || new Date().toISOString(),
        room: data.room
      };

      setHistoricoPorSala(prev => ({
        ...prev,
        [data.room as string]: [...((prev as any)[data.room] || []), newMessage]
      }));
    };

    socket.on("receive_message", handler);

    return () => {
      socket.off("receive_message", handler);
    };
  }, [socket]);

  useEffect(() => {
    const handleMudarSala = (event: CustomEvent) => {
      const novaSala = event.detail.sala;

      if (socket && isConnected) {
        socket.emit("leave_room", salaAtual);
        socket.emit("join_room", novaSala);
      }

      setSalaAtual(novaSala);
    };

    window.addEventListener('mudarSala', handleMudarSala as EventListener);

    return () => {
      window.removeEventListener('mudarSala', handleMudarSala as EventListener);
    };
  }, [socket, isConnected, salaAtual]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }, [historicoPorSala[salaAtual]]);

  const sendMessage = () => {
    if (input.trim() === "" || !socket) return;

    const textToSend = input;
    setInput("");

    socket.emit("send_message", {
      text: textToSend,
      room: salaAtual,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  const salas = [
    { id: "geral", nome: "Geral", icone: "💬" },
    { id: "ti", nome: "Tecnologia", icone: "💻" },
    { id: "financeiro", nome: "Financeiro", icone: "💰" },
    { id: "rh", nome: "Recursos Humanos", icone: "👥" },
    { id: "vendas", nome: "Vendas", icone: "📊" },
    { id: "suporte", nome: "Suporte", icone: "🔧" }
  ];

  const salaInfo = salas.find(s => s.id === salaAtual) || salas[0];
  const mensagensAtuais = historicoPorSala[salaAtual] || [];

  return (
    <div className="flex-1 h-screen flex flex-col bg-gray-100">
      <div className="p-4 bg-blue-600 border-b flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{salaInfo.icone}</span>
          <div>
            <h2 className="font-bold text-white text-lg">{salaInfo.nome}</h2>
            <p className="text-blue-100 text-sm">
              Sala: {salaAtual} • {isConnected ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-white text-sm font-medium">
            {socket?.id ? `ID: ${socket.id.slice(0, 8)}...` : 'Conectando...'}
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50">
        {mensagensAtuais.map((msg) => (
          <div
            key={msg.id}
            className={`p-4 rounded-2xl shadow-lg max-w-md break-words whitespace-normal transition-all duration-300 ${
              msg.from === "me"
                ? "bg-blue-500 text-white ml-auto hover:bg-blue-600 cursor-pointer"
                : "bg-gray-900 text-white border border-gray-200 hover:bg-gray-800 cursor-pointer"
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

      <div className="p-4 border-t bg-white shadow-inner">
        <div className="flex rounded-lg overflow-hidden border border-gray-300 shadow-sm">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              isConnected 
                ? `Digite sua mensagem para ${salaInfo.nome}...` 
                : "Conectando ao servidor..."
            }
            className="flex-1 px-4 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isConnected}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || input.trim() === ""}
            className="bg-blue-500 text-white px-6 font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
          >
            <span>Enviar</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500 text-center">
          {isConnected && `Sala: ${salaAtual} • Mensagens: ${mensagensAtuais.length}`}
        </div>
      </div>
    </div>
  );
}