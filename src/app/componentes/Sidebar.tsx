// components/Sidebar.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation'; // IMPORTADO PARA REDIRECIONAR

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
    const [activeTab, setActiveTab] = useState<"salas" | "usuarios">(null || "salas");
    const [meuUsuario, setMeuUsuario] = useState<User | null>(null); // ESTADO PARA O PERFIL LOGADO
    const router = useRouter();

    // LISTA DE SALAS
    const salas: Sala[] = [
        { id: "geral", nome: "Geral", icone: "💬" },
        { id: "ti", nome: "Tecnologia", icone: "💻" },
        { id: "financeiro", nome: "Financeiro", icone: "💰" },
        { id: "rh", nome: "Recursos Humanos", icone: "👥" },
        { id: "vendas", nome: "Vendas", icone: "📊" },
        { id: "suporte", nome: "Suporte", icone: "🔧" }
    ];

    // Carregar dados iniciais (Usuários e Perfil Logado)
    useEffect(() => {
        // Pega o usuário logado para exibir no perfil
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                setMeuUsuario(JSON.parse(userStr));
            } catch (e) {
                console.error("Erro ao ler dados do usuário logado", e);
            }
        }

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

    // FUNÇÃO DE LOGOUT
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login'); // Manda de volta pra tela de login
    };

    const mudarSala = (salaId: string) => {
        setSalaAtual(salaId);
        window.dispatchEvent(new CustomEvent('mudarSala', {
            detail: { sala: salaId }
        }));
    };

    const iniciarConversaPrivada = (userId: number) => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const ids = [currentUser.id, userId].sort((a, b) => a - b);
        const salaPrivada = `privada_${ids[0]}_${ids[1]}`;
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
        <div className="w-64 md:w-1/4 h-screen bg-gray-900 text-white p-4 flex flex-col justify-between border-r border-gray-800">
            {/* Bloco Superior */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* CABEÇALHO COM PERFIL DO USUÁRIO LOGADO */}
                <div className="mb-4 pb-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold uppercase shadow-md">
                            {meuUsuario?.nome ? meuUsuario.nome.charAt(0) : "U"}
                        </div>
                        <div className="overflow-hidden">
                            <h2 className="text-base font-bold truncate">{meuUsuario?.nome || "Carregando..."}</h2>
                            <p className="text-gray-400 text-xs truncate capitalize flex items-center gap-1">
                                <span>{meuUsuario ? getSetorIcon(meuUsuario.setor) : "👤"}</span>
                                <span>Setor: {meuUsuario?.setor || "Nenhum"}</span>
                            </p>
                        </div>
                    </div>
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
                <div className="flex-1 overflow-y-auto pr-1">
                    {activeTab === "salas" ? (
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
                                        <div className="font-medium text-sm">{sala.nome}</div>
                                        <div className="text-xs opacity-70">
                                            {salaAtual === sala.id ? "Selecionada" : "Clique para entrar"}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {loadingUsers ? (
                                <div className="text-center text-gray-400 py-4 text-sm">
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
                                        <div className="flex-1 overflow-hidden">
                                            <div className="font-medium text-sm truncate">{user.nome}</div>
                                            <div className="text-xs opacity-70 capitalize truncate">
                                                {user.setor} • Conversar
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bloco Inferior (Dica + Botão Logout) */}
            <div className="mt-4 pt-2 border-t border-gray-800 space-y-3">
                <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-400">
                        {activeTab === "salas" 
                            ? "Cada sala tem conversas separadas." 
                            : "Clique em um usuário para abrir o chat privado."}
                    </div>
                </div>
                
                {/* BOTÃO DESLOGAR */}
                <button
                    onClick={handleLogout}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sair do Sistema
                </button>
            </div>
        </div>
    );
}