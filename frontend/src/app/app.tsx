import { useState, useEffect, JSX } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom'; // 👈 Importamos Router
import axios from 'axios';
import { Loader2, Lock, Mail } from 'lucide-react';

// Módulos
import Dashboard from './dashboard';
import SaaSManager from './modules/admin/SaaSManager';
import ForgotPassword from './modules/auth/ForgotPassword';
import ResetPassword from './modules/auth/ResetPassword';
import SuperAdminDashboard from './modules/admin/SuperAdminDashboard';


// Componente Interno: LOGIN
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      
      // Guardar Credenciales
      localStorage.setItem('erp_token', response.data.access_token);
      const roles = response.data.user.roles;
      localStorage.setItem('erp_roles', JSON.stringify(Array.isArray(roles) ? roles : [roles]));

      // Redirección inteligente según rol
      if (roles.includes('super-admin')) {
        navigate('/saas-admin'); // El Super Admin va directo a gestionar Pymes
      } else {
        navigate('/'); // Los usuarios normales van al Dashboard
      }
      
    } catch (err) {
      console.error(err);
      setError('Credenciales incorrectas o usuario inactivo');
    } finally {
      setLoading(false);
    }
  };

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
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="admin@erp.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••" />
            </div>

            <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-slate-900 hover:bg-black text-white py-2.5 rounded-lg font-medium shadow-lg flex justify-center items-center gap-2 disabled:opacity-70">
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Componente Interno: PROTECTOR DE RUTAS
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('erp_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// Componente Principal: APP CON RUTAS
export function App() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_roles');
    navigate('/login');
  };

  return (
    <Routes>
      {/* 1. Ruta Pública: Login */}
      <Route path="/login" element={<Login />} />

      {/* 2. Ruta Privada: Dashboard (ERP Normal) */}
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      

<Route path="/super-admin" element={
   <ProtectedRoute allowedRoles={['super-admin']}>
      <SaaSManager />
   </ProtectedRoute>
} />
      {/* 3. Ruta Privada: Admin SaaS (Creación de Pymes) */}
      <Route path="/saas-admin" element={
        <ProtectedRoute>
           {/* Botón flotante para volver al Dashboard normal si quieres */}
           <div className="min-h-screen bg-slate-50 relative">
              <button onClick={handleLogout} className="absolute top-4 right-4 text-red-500 font-bold text-sm">Cerrar Sesión</button>
              <SaaSManager />
           </div>
        </ProtectedRoute>
      } />
      
      {/* Default: Redirigir a login */}
      <Route path="*" element={<Navigate to="/login" />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  );
}

export default App;