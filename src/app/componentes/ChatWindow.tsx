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
      text: "Bem-vindo ao chat geral! ",
      from: "other",
      timestamp: new Date().toISOString(),
      room: "geral"
    }],
    ti: [{
      id: "2",
      text: "Sala de Tecnologia ativa! ",
      from: "other",
      timestamp: new Date().toISOString(),
      room: "ti"
    }],
    financeiro: [{
      id: "3",
      text: "Sala do Financeiro aberta! ",
      from: "other",
      timestamp: new Date().toISOString(),
      room: "financeiro"
    }],
    rh: [{
      id: "4",
      text: "Recursos Humanos online! ",
      from: "other",
      timestamp: new Date().toISOString(),
      room: "rh"
    }],
    vendas: [{
      id: "5",
      text: "Vendas!",
      from: "other",
      timestamp: new Date().toISOString(),
      room: "vendas"
    }],
    suporte: [{
      id: "6",
      text: "Suporte Online!",
      from: "other",
      timestamp: new Date().toISOString(),
      room: "suporte"
    }]
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Conexão inicial (sem listener de receive aqui)
  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("CONECTADO AO SERVIDOR!");
      setIsConnected(true);
      // entra na sala inicial
      newSocket.emit("join_room", salaAtual);
      console.log("🚪 Entrou na sala:", salaAtual);
    });

    newSocket.on("disconnect", () => {
      console.log("DESCONECTADO DO SERVIDOR");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("ERRO DE CONEXÃO:", error);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []); // roda só uma vez

  // Listener para receber mensagens — depende de `socket` (sem usar salaAtual aqui)
  useEffect(() => {
    if (!socket) return;

    const handler = (data: any) => {
      console.log("Mensagem recebida:", data);

      const messageFrom: "me" | "other" = data.senderId === socket.id ? "me" : "other";
      const newMessage: Message = {
        id: Date.now().toString(),
        text: data.text,
        from: messageFrom,
        timestamp: data.timestamp || new Date().toISOString(),
        room: data.room
      };

      // Sempre acrescenta no histórico da sala correta (mesmo que não seja a sala atual)
      setHistoricoPorSala(prev => ({
        ...prev,
        [data.room]: [...(prev[data.room] || []), newMessage]
      }));
    };

    socket.on("receive_message", handler);

    return () => {
      socket.off("receive_message", handler);
    };
  }, [socket]);

  // Ouve evento do Sidebar para trocar de sala
  useEffect(() => {
    const handleMudarSala = (event: CustomEvent) => {
      const novaSala = event.detail.sala;
      console.log(`Mudando para sala: ${novaSala}`);

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

  // Scroll automático quando o histórico da sala atual muda
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }, [historicoPorSala[salaAtual]]);

  // Enviar mensagem — sem otimista por enquanto (servidor vai repassar e o listener adiciona)
  const sendMessage = () => {
    if (input.trim() === "" || !socket) {
      console.log("Mensagem vazia ou socket não conectado");
      return;
    }

    const textToSend = input;
    setInput("");

    socket.emit("send_message", {
      text: textToSend,
      room: salaAtual,
    });

    console.log("Mensagem enviada para o servidor:", textToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  const salas = [
    { id: "geral", nome: "Geral", icone: "💬" },
    { id: "ti", nome: "Tecnologia", icone: "💻" },
    { id: "financeiro", nome: "Financeiro", icone: "💰" },
    { id: "rh", nome: "Recursos Humanos", icone: "👥" },
    { id: "vendas", nome: "Vendas" },
    { id: "suporte", nome: "Suporte" }
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
              Sala: {salaAtual} • {isConnected ? '✅ Online' : '❌ Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-white text-sm font-medium">
            {socket?.id ? `ID: ${socket.id.slice(0, 8)}...` : 'Conectando...'}
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50">
        {mensagensAtuais.map((msg) => (
          <div key={msg.id} className={`p-4 rounded-2xl shadow-lg max-w-md break-words whitespace-normal transition-all duration-300 ${msg.from === "me" ? "bg-blue-500 text-white ml-auto hover:bg-blue-600" : "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50"}`}>
            <div className="text-sm leading-relaxed">{msg.text}</div>
            <div className={`text-xs mt-2 ${msg.from === "me" ? "text-blue-100" : "text-gray-500"}`}>
              {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white shadow-inner">
        <div className="flex rounded-lg overflow-hidden border border-gray-300 shadow-sm">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyPress}
            placeholder={isConnected ? `Digite sua mensagem para ${salaInfo.nome}...` : "Conectando ao servidor..."}
            className="flex-1 px-4 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled={!isConnected} />
          <button onClick={sendMessage} disabled={!isConnected || input.trim() === ""} className="bg-blue-500 text-white px-6 font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2 cursor-pointer">
            <span>Enviar</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500 text-center">
          {isConnected && `Sala: ${salaAtual} • Mensagens: ${mensagensAtuais.length} • Histórico separado por departamento`}
        </div>
      </div>
    </div>
  );
}