// components/LoginForm.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [form, setForm] = useState({ 
    email: '', 
    senha: '' 
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('Verificando...');

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      
      if (data.success) {
        setMsg('Login bem-sucedido! Redirecionando...');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redireciona imediatamente para o chat
        router.push('/');
      } else {
        setMsg(data.message || 'Erro no login');
      }
    } catch (error) {
      setMsg('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white text-center">Login</h2>
        
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
        />
        
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 p-3 rounded font-medium disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        
        <button 
          type="button"
          onClick={() => router.push('/register')}
          className="text-blue-400 hover:text-blue-300 text-sm text-center"
        >
          Não tem conta? Cadastre-se
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