import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Shield, User, Power, Mail } from 'lucide-react';
import UserFormModal from './UserFormModal';

interface User {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  isActive: boolean;
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | undefined>(undefined);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('erp_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('¿Eliminar usuario permanentemente?')) return;
    try {
      const token = sessionStorage.getItem('erp_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.delete(`${API_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error) { alert('Error al eliminar'); }
  };

  const toggleStatus = async (user: User) => {
    try {
      const token = sessionStorage.getItem('erp_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.patch(`${API_URL}/api/users/${user.id}`, 
        { isActive: !user.isActive }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Optimistic update
      setUsers(users.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
    } catch (error) { alert('Error al cambiar estado'); }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes('admin')) return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold border border-purple-200">Admin</span>;
    if (roles.includes('manager')) return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold border border-blue-200">Gerente</span>;
    return <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">Empleado</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h2>
          <p className="text-slate-500 text-sm">Administra el acceso al sistema ERP</p>
        </div>
        <button onClick={() => { setUserToEdit(undefined); setIsModalOpen(true); }} className="bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-bold shadow-lg transition-all">
          <Plus size={18}/> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Filtros */}
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
            <input type="text" placeholder="Buscar por nombre o correo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"/>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white border-b border-slate-200 font-bold text-slate-700 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{user.fullName}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10}/> {user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(user.roles)}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => toggleStatus(user)} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-all ${user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                      <Power size={12}/> {user.isActive ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setUserToEdit(user); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <div className="p-8 text-center text-slate-400">No se encontraron usuarios.</div>}
        </div>
      </div>

      <UserFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchUsers} userToEdit={userToEdit} />
    </div>
  );
}