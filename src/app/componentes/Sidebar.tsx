"use client";
import { useState } from "react";

interface Sala {
    id: string;
    nome: string;
    icone: string;
}

export default function Sidebar () {
    const [salaAtual, setSalaAtual] = useState("geral");

    //LISTA DE SALAS
    const salas: Sala [] = [
        {id: "geral", nome: "Geral", icone: ""},

        {id: "ti", nome: "Tecnologia", icone: ""},

        {id: "financeiro", nome: "Financeiro", icone: ""},

        {id: "rh", nome: "Recursos Humanos", icone: ""},

        {id: "vendas", nome: "Vendas", icone: ""},

        {id: "suporte", nome: "Suporte", icone: ""}
    ];

    const mudarSala = (salaId: string) => {
        setSalaAtual(salaId);

        //Evento customizado para comunicar com ChatWindow
        window.dispatchEvent(new CustomEvent('mudarSala', {
            detail: { sala: salaId}
        }));
    };

    return (
        <div className="w-64 md:w-1/4 h-screen bg-gray-900 text-white p-4 flex flex-col">
            {/* CABEÇALHO */}
            <div className="mb-6">
                <h2 className="text-xl font-bold mb-2 cursor-pointer">Departamentos</h2>
                <p className="text-gray-400 text-sm">Selecione uma sala</p>
            </div>

            { /* Lista de Salas */}
            <div className="flex-1 space-y-2">
                {salas.map((sala) => (
                    <button
                    key={sala.id}
                    onClick={() => mudarSala(sala.id)}
                    className={`cursor-pointer w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center gap-3 ${
                        salaAtual === sala.id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}>
                        <span className="text-lg">{sala.icone}</span>
                        <div>
                            <div className="font-medium">{sala.nome}</div>
                            <div className="text--xs opacity-70">
                                 {salaAtual === sala.id ? "Selecionada" : "Clique para entrar"}
                        </div>
                    </div>
                </button>
            ))}
        </div>

            { /* Rodapé */ }
            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-400">
                    <div><strong>Dica:</strong></div>
                    <div className="text-xs mt-1">
                        Cada sala tem conversas separadas
                    </div>
                </div>
            </div>
    </div>
)
}