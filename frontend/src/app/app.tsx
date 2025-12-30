import { useState } from "react";
import axios from 'axios';
import { Lock, Mail, Loader2, CheckCircle } from 'lucide-react';
import Dashboard from './dashboard';

export default function App() {
  // Estados para guardar lo que escribe el usuario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Funcion que se ejecuta al darle "Ingresar"
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email,
        password
      });
      
      localStorage.setItem('erp_token', response.data.access_token);
      
      // 👇 AGREGA ESTA LÍNEA NUEVA
      // Guardamos el rol. Si viene como array lo guardamos tal cual, si no, lo convertimos.
      const roles = response.data.user.roles; 
      localStorage.setItem('erp_roles', JSON.stringify(Array.isArray(roles) ? roles : [roles]));

      setSuccess(true);
    } catch (error) {
      setError('Credenciales incorrectas');
    }
  };
  // Si ya se logueó, mostramos el Dashboard completo
  if (success) {
    return (
      <Dashboard 
        onLogout={() => {
          setSuccess(false); 
          setEmail(''); 
          setPassword('');
          localStorage.removeItem('erp_token');
        }} 
      />
    );
  }

  // Formulario de Login
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Acceso al ERP</h1>
          <p className="text-gray-500 text-sm">Ingresa tus credenciales para continuar</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="admin@erp.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Validando...
              </>
            ) : (
              'Ingresar al Sistema'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          © 2025 Sistema ERP Seguro
        </p>
      </div>
    </div>
  );
}