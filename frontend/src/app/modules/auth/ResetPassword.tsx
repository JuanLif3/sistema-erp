import { useState } from 'react';
import axios from 'axios';
import { Lock, CheckCircle } from 'lucide-react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setMsg('Las contraseñas no coinciden');
    
    setStatus('loading');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.post(`${API_URL}/api/auth/reset-password`, { token, newPassword: password });
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      setMsg(error.response?.data?.message || 'Token inválido o expirado.');
    }
  };

  if (!token) return <div className="p-10 text-center">Enlace inválido.</div>;

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Contraseña Cambiada!</h2>
          <p className="text-slate-500 mb-6">Ya puedes acceder con tu nueva credencial.</p>
          <button onClick={() => navigate('/login')} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700">
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Nueva Contraseña</h1>
        <p className="text-slate-500 mb-6">Crea una contraseña segura para tu cuenta.</p>

        {msg && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{msg}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••" />
            </div>
          </div>
          <button type="submit" disabled={status === 'loading'} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-bold hover:bg-black disabled:opacity-50">
            {status === 'loading' ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}