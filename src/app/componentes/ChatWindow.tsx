"use client";
import { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  id: string;
  text: string;
  from: "me" | "other";
  timestamp: string;
  room: string;
  senderName?: string;
}

export default function ChatWindow() {
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [salaAtual, setSalaAtual] = useState("geral");
  const [historicoPorSala, setHistoricoPorSala] = useState<Record<string, Message[]>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🔹 Função auxiliar: pega ID do usuário atual
  function getCurrentUserId() {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return Number(user.id);
    } catch {
      return null;
    }
  }

  // 🔹 Conexão Socket.io
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const opts = token ? { auth: { token } } : {};

    const newSocket = io("http://localhost:3001", opts);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
      newSocket.emit("join_room", salaAtual);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Erro de conexão:", err.message);
    });

    newSocket.on("error_message", (payload) => {
      alert(payload.message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 🔹 Recebendo mensagens
  useEffect(() => {
    if (!socket) return;

    const handler = (data: any) => {
      const currentUserId = getCurrentUserId();
      const from: "me" | "other" = data.sender?.id === currentUserId ? "me" : "other";

      const newMessage: Message = {
        id: Date.now().toString(),
        text: data.text,
        from,
        timestamp: data.timestamp || new Date().toISOString(),
        room: data.room,
        senderName: data.sender?.nome || "Desconhecido",
      };

      setHistoricoPorSala((prev) => ({
        ...prev,
        [data.room]: [...(prev[data.room] || []), newMessage],
      }));
    };

    socket.on("receive_message", handler);

    return () => {
      socket.off("receive_message", handler);
    };
  }, [socket]);

  // 🔹 Mudança de sala
  useEffect(() => {
    const handleMudarSala = (event: CustomEvent) => {
      const novaSala = event.detail.sala;
      if (socket && isConnected) {
        socket.emit("leave_room", salaAtual);
        socket.emit("join_room", novaSala);
      }
      setSalaAtual(novaSala);
    };

    window.addEventListener("mudarSala", handleMudarSala as EventListener);
    return () => {
      window.removeEventListener("mudarSala", handleMudarSala as EventListener);
    };
  }, [socket, isConnected, salaAtual]);

  // 🔹 Carrega histórico do backend
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3001/api/rooms/${salaAtual}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          const formatted = data.messages.map((msg: any) => ({
            id: msg.id.toString(),
            text: msg.content,
            from: msg.usuario_id === getCurrentUserId() ? "me" : "other",
            timestamp: msg.criado_em,
            room: salaAtual,
            senderName: msg.usuario_nome,
          }));
          setHistoricoPorSala((prev) => ({ ...prev, [salaAtual]: formatted }));
        }
      } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
      }
    };
    if (isConnected && salaAtual) loadMessages();
  }, [salaAtual, isConnected]);

  // 🔹 Rolagem automática
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historicoPorSala[salaAtual]]);

  // 🔹 Envio de mensagens (corrigido)
  const sendMessage = () => {
  if (!input.trim() || !socket) return;

  const text = input;
  setInput(""); // Só limpa o input

  socket.emit("send_message", {
    text,
    room: salaAtual,
  });
};

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  // 🔹 Configuração das salas
  const salas = [
    { id: "geral", nome: "Geral", icone: "💬" },
    { id: "ti", nome: "Tecnologia", icone: "💻" },
    { id: "financeiro", nome: "Financeiro", icone: "💰" },
    { id: "rh", nome: "Recursos Humanos", icone: "👥" },
    { id: "vendas", nome: "Vendas", icone: "📊" },
    { id: "suporte", nome: "Suporte", icone: "🔧" },
  ];

  const getRoomDisplayName = (roomId: string) => {
    const sala = salas.find((s) => s.id === roomId);
    if (sala) return sala.nome;
    if (roomId.startsWith("privada_")) return "Conversa Privada";
    return roomId;
  };

  const salaInfo = {
    nome: getRoomDisplayName(salaAtual),
    icone:
      salas.find((s) => s.id === salaAtual)?.icone ||
      (salaAtual.startsWith("privada_") ? "🔒" : "💬"),
  };

  const mensagensAtuais = historicoPorSala[salaAtual] || [];

  // 🔹 Renderização
  return (
    <div className="flex-1 h-screen flex flex-col bg-gray-100">
      {/* Cabeçalho */}
      <div className="p-4 bg-blue-600 border-b flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{salaInfo.icone}</span>
          <div>
            <h2 className="font-bold text-white text-lg">{salaInfo.nome}</h2>
            <p className="text-blue-100 text-sm">
              Sala: {salaAtual} • {isConnected ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
          <span className="text-white text-sm font-medium">
            {socket?.id ? `ID: ${socket.id.slice(0, 8)}...` : "Conectando..."}
          </span>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50">
        {mensagensAtuais.map((msg) => (
          <div
            key={msg.id}
            className={`p-4 rounded-2xl shadow-md max-w-md break-words whitespace-normal transition-all duration-200 ${
              msg.from === "me"
                ? "bg-blue-500 text-white ml-auto"
                : "bg-gray-900 text-white"
            }`}
          >
            {msg.from === "other" && msg.senderName && (
              <div className="text-xs font-semibold mb-1 opacity-80">{msg.senderName}</div>
            )}
            <div className="text-sm leading-relaxed">{msg.text}</div>
            <div
              className={`text-xs mt-2 ${
                msg.from === "me" ? "text-blue-100" : "text-gray-400"
              }`}
            >
              {new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
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
                : "Conectando..."
            }
            className="flex-1 px-4 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isConnected}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || input.trim() === ""}
            className="bg-blue-500 text-white px-6 font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
          >
            Enviar
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500 text-center">
          {isConnected && `Sala: ${salaAtual} • ${mensagensAtuais.length} mensagens`}
        </div>
      </div>
    </div>
  );
}