// components/Sidebar.tsx
"use client";
import { useState, useEffect } from "react";

interface Sala {
    id: string;
    nome: string;
    icone: string;
}

interface User {
    id: number;
    nome: string;
    email: string;
    setor: string;
}

export default function Sidebar() {
    const [salaAtual, setSalaAtual] = useState("geral");
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [activeTab, setActiveTab] = useState<"salas" | "usuarios">("salas");

    // LISTA DE SALAS
    const salas: Sala[] = [
        { id: "geral", nome: "Geral", icone: "💬" },
        { id: "ti", nome: "Tecnologia", icone: "💻" },
        { id: "financeiro", nome: "Financeiro", icone: "💰" },
        { id: "rh", nome: "Recursos Humanos", icone: "👥" },
        { id: "vendas", nome: "Vendas", icone: "📊" },
        { id: "suporte", nome: "Suporte", icone: "🔧" }
    ];

    // Carregar lista de usuários
    useEffect(() => {
        const loadUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:3001/api/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setUsers(data.users);
                    }
                }
            } catch (error) {
                console.error('Erro ao carregar usuários:', error);
            } finally {
                setLoadingUsers(false);
            }
        };

        loadUsers();
    }, []);

    const mudarSala = (salaId: string) => {
        setSalaAtual(salaId);
        window.dispatchEvent(new CustomEvent('mudarSala', {
            detail: { sala: salaId }
        }));
    };

    const iniciarConversaPrivada = (userId: number) => {
        // Cria ID único para sala privada
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const ids = [currentUser.id, userId].sort((a, b) => a - b);
        const salaPrivada = `privada_${ids[0]}_${ids[1]}`;
        
        // Muda para a sala privada
        setSalaAtual(salaPrivada);
        window.dispatchEvent(new CustomEvent('mudarSala', {
            detail: { sala: salaPrivada }
        }));
    };

    const getSetorIcon = (setor: string) => {
        const icons: { [key: string]: string } = {
            ti: "💻",
            financeiro: "💰",
            rh: "👥",
            vendas: "📊",
            suporte: "🔧"
        };
        return icons[setor] || "👤";
    };

    return (
        <div className="w-64 md:w-1/4 h-screen bg-gray-900 text-white p-4 flex flex-col">
            {/* CABEÇALHO */}
            <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">EZ Chat</h2>
                <p className="text-gray-400 text-sm">Comunicação empresarial</p>
            </div>

            {/* ABAS */}
            <div className="flex mb-4 bg-gray-800 rounded-lg p-1">
                <button
                    onClick={() => setActiveTab("salas")}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === "salas" 
                            ? "bg-blue-600 text-white" 
                            : "text-gray-300 hover:text-white"
                    }`}
                >
                    Salas
                </button>
                <button
                    onClick={() => setActiveTab("usuarios")}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === "usuarios" 
                            ? "bg-green-600 text-white" 
                            : "text-gray-300 hover:text-white"
                    }`}
                >
                    Usuários
                </button>
            </div>

            {/* CONTEÚDO DAS ABAS */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === "salas" ? (
                    // LISTA DE SALAS
                    <div className="space-y-2">
                        {salas.map((sala) => (
                            <button
                                key={sala.id}
                                onClick={() => mudarSala(sala.id)}
                                className={`cursor-pointer w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center gap-3 ${
                                    salaAtual === sala.id
                                        ? "bg-blue-600 text-white shadow-lg"
                                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                }`}
                            >
                                <span className="text-lg">{sala.icone}</span>
                                <div>
                                    <div className="font-medium">{sala.nome}</div>
                                    <div className="text-xs opacity-70">
                                        {salaAtual === sala.id ? "Selecionada" : "Clique para entrar"}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    // LISTA DE USUÁRIOS
                    <div className="space-y-2">
                        {loadingUsers ? (
                            <div className="text-center text-gray-400 py-4">
                                Carregando usuários...
                            </div>
                        ) : (
                            users.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => iniciarConversaPrivada(user.id)}
                                    className="cursor-pointer w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center gap-3 bg-gray-800 text-gray-300 hover:bg-gray-700"
                                >
                                    <span className="text-lg">{getSetorIcon(user.setor)}</span>
                                    <div className="flex-1">
                                        <div className="font-medium">{user.nome}</div>
                                        <div className="text-xs opacity-70 capitalize">
                                            {user.setor} • Clique para conversar
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* RODAPÉ */}
            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-400">
                    <div><strong>Dica:</strong></div>
                    <div className="text-xs mt-1">
                        {activeTab === "salas" 
                            ? "Cada sala tem conversas separadas" 
                            : "Clique em um usuário para conversar privadamente"}
                    </div>
                </div>
            </div>
        </div>
    );
}