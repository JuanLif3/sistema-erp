import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, User, Mail, Lock, Shield, Loader2 } from 'lucide-react';

interface UserData {
  id?: string;
  fullName: string;
  email: string;
  password?: string;
  roles: string[];
  isActive: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: UserData;
}

export default function UserFormModal({ isOpen, onClose, onSuccess, userToEdit }: Props) {
  const [formData, setFormData] = useState<UserData>({
    fullName: '', email: '', password: '', roles: ['employee'], isActive: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setFormData({ ...userToEdit, password: '' }); // Password vacía al editar
      } else {
        setFormData({ fullName: '', email: '', password: '', roles: ['employee'], isActive: true });
      }
    }
  }, [isOpen, userToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_token');
      const headers = { Authorization: `Bearer ${token}` };
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      if (userToEdit?.id) {
        // EDITAR
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await axios.patch(`${API_URL}/api/users/${userToEdit.id}`, payload, { headers });
      } else {
        // CREAR
        await axios.post(`${API_URL}/api/users`, formData, { headers });
      }
      onSuccess();
      onClose();
    } catch (error) { alert("Error al guardar usuario"); } 
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">{userToEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Nombre Completo</label>
            <div className="relative mt-1">
              <User size={18} className="absolute left-3 top-2.5 text-slate-400"/>
              <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Juan Pérez"/>
            </div>
          </div>

          <select 
  value={formData.roles} 
  onChange={e => setFormData({...formData, roles: e.target.value})}
  className="..."
>
  <option value="employee">Vendedor / Empleado</option>
  <option value="manager">Gerente de Tienda</option>
  <option value="admin">Administrador Total</option>
  {/* Nota: NO pongas 'super-admin' aquí, ese rol es solo tuyo */}
</select>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Correo Electrónico</label>
            <div className="relative mt-1">
              <Mail size={18} className="absolute left-3 top-2.5 text-slate-400"/>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="juan@empresa.com"/>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Contraseña {userToEdit && '(Opcional)'}</label>
            <div className="relative mt-1">
              <Lock size={18} className="absolute left-3 top-2.5 text-slate-400"/>
              <input type="password" required={!userToEdit} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="******"/>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Rol de Acceso</label>
            <div className="relative mt-1">
              <Shield size={18} className="absolute left-3 top-2.5 text-slate-400"/>
              <select value={formData.roles[0]} onChange={e => setFormData({...formData, roles: [e.target.value]})} className="w-full pl-10 p-2 border rounded-lg bg-white focus:ring-2 focus:ring-brand-500 outline-none">
                <option value="employee">Empleado (Ventas basicas)</option>
                <option value="manager">Gerente (Inventario + Finanzas)</option>
                <option value="admin">Administrador (Acceso Total)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="active" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"/>
            <label htmlFor="active" className="text-sm text-slate-700">Usuario Activo (Puede iniciar sesión)</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-slate-900 text-white hover:bg-black rounded-lg font-bold flex justify-center gap-2">
              {loading ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}