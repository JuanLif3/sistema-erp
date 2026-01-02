import { useState, useEffect } from 'react';
import Dashboard from './dashboard';
import axios from 'axios';
import { Loader2, Lock, Mail } from 'lucide-react';

export function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Verificar si ya hay sesión al cargar
  useEffect(() => {
    const token = localStorage.getItem('erp_token');
    if (token) {
      setSuccess(true);
    }
  }, []);

const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // 👈

      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      
      // Guardar Token
      localStorage.setItem('erp_token', response.data.access_token);
      
      // 👇 GUARDAR ROLES (Vital para que funcione el menú)
      const roles = response.data.user.roles;
      // Aseguramos que siempre sea un Array antes de guardarlo
      localStorage.setItem('erp_roles', JSON.stringify(Array.isArray(roles) ? roles : [roles]));

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Credenciales incorrectas o usuario inactivo');
    } finally {
      setLoading(false);
    }
  };

  // Si está logueado, mostramos el Dashboard
  if (success) {
    return (
      <Dashboard 
        onLogout={() => {
          setSuccess(false); 
          setEmail(''); 
          setPassword('');
          // Limpiamos todo al salir
          localStorage.removeItem('erp_token');
          localStorage.removeItem('erp_roles');
        }} 
      />
    );
  }

  // Pantalla de Login
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Bienvenido</h1>
          <p className="text-slate-500">Ingresa tus credenciales para acceder al ERP</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center justify-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="admin@erp.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-black text-white py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-slate-900/20 flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;