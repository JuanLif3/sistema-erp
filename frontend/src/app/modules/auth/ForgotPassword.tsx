import { useState } from 'react';
import axios from 'axios';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setStatus('success');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setStatus('error');
      setMsg('No encontramos ese correo o hubo un error.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <Send size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Correo Enviado!</h2>
          <p className="text-slate-500 mb-6">Revisa tu bandeja de entrada (o la terminal del backend) para ver el enlace de recuperación.</p>
          <Link to="/login" className="text-indigo-600 font-bold hover:underline">Volver al Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <Link to="/login" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-6 text-sm">
          <ArrowLeft size={16} /> Volver
        </Link>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Recuperar Contraseña</h1>
        <p className="text-slate-500 mb-6">Ingresa tu correo y te enviaremos instrucciones.</p>

        {status === 'error' && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{msg}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="email" required 
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="ejemplo@correo.com"
              />
            </div>
          </div>
          <button type="submit" disabled={status === 'loading'} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-bold hover:bg-black disabled:opacity-50">
            {status === 'loading' ? 'Enviando...' : 'Enviar Enlace'}
          </button>
        </form>
      </div>
    </div>
  );
}