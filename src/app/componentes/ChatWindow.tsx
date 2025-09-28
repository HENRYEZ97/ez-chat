"use client";
import { useState, useRef, useEffect } from "react";


export default function ChatWindow () {
  const [messages, setMessages] = useState<{ text: string; from: "me" | "bot" }[]>([{ text: "Olá como posso ajudar ?", from: "bot" },]); //Mudança de estado das mensagens, a mensagem será rendereizada após a mudança de estado.
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null); // QUANDO A MENSAGEM FOR ENVIADA O SCROLL SERÁ AUTOMÁTICO.
      useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, [messages]);
const sendMessage = () => {
  if (input.trim() === "")
  return;
  setMessages([...messages, { text: input, from: "me" }]);
    setInput("");   //LIMPA O INPUT E RESETA PARA UMA NOVA MENSAGEM SER ESCRITA. 
};
const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter")   //AQUI A MENSAGEM DOS DOIS LADOS PODEM SER ENVIADAS COM A TECLA "ENTER".
    sendMessage();
};

const simulateBotResponse = () => {   //FUNÇÃO DE SIMULAÇÃO DO BOT RESPONDENDO
  setMessages((prev) => [
    ...prev, { text: "Olá, sou o bot e recebi a sua mensagem", from: "bot" },
  ]);
};

    return (
        <div className="flex-1 h-screen flex flex-col bg-gray-100">
            {/* CABEÇALHO */}
             <div className="p-4 bg-blue-400 border-b">
                <h2 className="font-semibold text-center cursor-pointer">Chat - Suporte</h2>
                  </div>
                  {/* MENSAGENS */}
                    <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {messages.map((msg, index) =>
                        (
                          <div
                            key={index}
                              className={`cursor-pointer p-2 rounded-lg shadow max-w-xs break-words whitespace-normal ${msg.from === "me" ? "bg-blue-500 text-white self-end ml-auto" : " max-w-xs break-words whitespace-normalbg-gray-300 dark:bg-gray-700 dark: text-white self-start mb-14"}`}>  {/*SELF-END == MENSAGEM DO USUÁRIO PARA A DIREITA E SELF-START MENSAGEM DO OUTRO USUÁRIO RENDERIZA NA ESQUERDA*/}
                              {msg.text}
                          </div>
                        ))}
                          <div ref={messagesEndRef} />
                    </div>
                  {/* INPUT DE MENSAGENS */}
                <div className="p-4 border-t bg-gray-200 flex">
              <input type="text"
          value={input}
              onChange={(e) =>
                  setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                          className="flex-1 rounded-l-lg px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"/>
                          <button onClick={sendMessage}
                          className="bg-blue-500 text-white px-4 rounded cursor-pointer hover:bg-cyan-500 ml-1">Enviar</button>
                          <button onClick={simulateBotResponse}
                                  className="bg-green-500 text-white px-4 rounded ml-1 cursor-pointer hover:bg-green-600">Simular Resposta</button>  {/*Simulação de resposta do chat*/}
                      </div>
                  </div>
                );
}