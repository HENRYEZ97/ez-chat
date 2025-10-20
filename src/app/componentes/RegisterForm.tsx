// components/RegisterForm.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const [form, setForm] = useState({ 
    nome: '', 
    email: '', 
    senha: '', 
    setor: '' 
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('Enviando...');

    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      
      if (data.success) {
        setMsg('Usuário cadastrado com sucesso! Redirecionando...');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redireciona para o chat após 2 segundos
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setMsg(data.message || 'Erro no cadastro');
      }
    } catch (error) {
      setMsg('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  }

  const setores = [
    { value: '', label: 'Selecione seu setor' },
    { value: 'ti', label: 'Tecnologia' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'rh', label: 'Recursos Humanos' },
    { value: 'vendas', label: 'Vendas' },
    { value: 'suporte', label: 'Suporte' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white text-center">Criar Conta</h2>
        
        <input
          type="text"
          placeholder="Nome completo"
          className="p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          className="p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.senha}
          onChange={(e) => setForm({ ...form, senha: e.target.value })}
          required
          minLength={6}
        />
        <select
          className="p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.setor}
          onChange={(e) => setForm({ ...form, setor: e.target.value })}
          required
        >
          {setores.map((setor) => (
            <option key={setor.value} value={setor.value}>
              {setor.label}
            </option>
          ))}
        </select>
        
        <button 
          type="submit" 
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 p-3 rounded font-medium disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
        
        {msg && (
          <p className={`text-sm mt-2 text-center ${
            msg.includes('sucesso') ? 'text-green-400' : 'text-red-400'
          }`}>
            {msg}
          </p>
        )}
      </form>
    </div>
  );
}