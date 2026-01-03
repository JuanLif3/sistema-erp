import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Users, Power, PowerOff, Plus, Search, Loader2 } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Formulario Nueva Empresa
  const [form, setForm] = useState({
    companyName: '', companyRut: '',
    adminName: '', adminEmail: '', adminPassword: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      const res = await axios.get(`${API_URL}/api/super-admin/companies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanies(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!confirm('¿Crear esta empresa?')) return;
    try {
      const token = localStorage.getItem('erp_token');
      await axios.post(`${API_URL}/api/super-admin/companies`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Empresa creada exitosamente');
      setModalOpen(false);
      setForm({ companyName: '', companyRut: '', adminName: '', adminEmail: '', adminPassword: '' });
      fetchCompanies();
    } catch (e: any) { alert('Error: ' + (e.response?.data?.message || 'Error desconocido')); }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const action = currentStatus ? 'DESACTIVAR' : 'ACTIVAR';
    if(!confirm(`¿Seguro que deseas ${action} el acceso a esta empresa?`)) return;
    
    try {
      const token = localStorage.getItem('erp_token');
      await axios.patch(`${API_URL}/api/super-admin/companies/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCompanies();
    } catch (e) { alert('Error al cambiar estado'); }
  };

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="text-indigo-600" /> Panel Super Admin
          </h1>
          <p className="text-slate-500">Gestión de Clientes (Tenants)</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex gap-2 shadow-lg">
          <Plus size={20}/> Nueva Empresa
        </button>
      </div>

      {/* Tabla de Empresas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
            <tr>
              <th className="p-4">Empresa</th>
              <th className="p-4">RUT</th>
              <th className="p-4">Usuarios</th>
              <th className="p-4">Registro</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {companies.map(c => (
              <tr key={c.id} className={!c.isActive ? 'bg-slate-50 opacity-75' : 'hover:bg-slate-50'}>
                <td className="p-4 font-bold text-slate-700">{c.name}</td>
                <td className="p-4 text-slate-500 text-sm font-mono">{c.rut}</td>
                <td className="p-4 text-sm"><span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded"><Users size={12}/> {c.usersCount}</span></td>
                <td className="p-4 text-sm text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="p-4 text-center">
                  {c.isActive 
                    ? <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">ACTIVO</span>
                    : <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">SUSPENDIDO</span>
                  }
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => toggleStatus(c.id, c.isActive)}
                    className={`p-2 rounded-lg transition-colors ${c.isActive ? 'text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                    title={c.isActive ? "Suspender Servicio" : "Reactivar Servicio"}
                  >
                    {c.isActive ? <PowerOff size={18}/> : <Power size={18}/>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-8 text-center text-slate-400">Cargando empresas...</div>}
      </div>

      {/* Modal Crear */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in">
            <h2 className="text-xl font-bold mb-4">Registrar Nuevo Cliente</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Fantasía</label>
                  <input required className="w-full border p-2 rounded" placeholder="Ej: Panadería Juan"
                    value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">RUT Empresa</label>
                  <input required className="w-full border p-2 rounded" placeholder="76.xxx.xxx-x"
                    value={form.companyRut} onChange={e => setForm({...form, companyRut: e.target.value})} />
                </div>
              </div>
              <hr />
              <p className="text-xs text-slate-500 uppercase font-bold">Datos del Administrador</p>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Admin</label>
                <input required className="w-full border p-2 rounded" placeholder="Nombre completo"
                  value={form.adminName} onChange={e => setForm({...form, adminName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email (Login)</label>
                <input required type="email" className="w-full border p-2 rounded" placeholder="admin@cliente.com"
                  value={form.adminEmail} onChange={e => setForm({...form, adminEmail: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña Inicial</label>
                <input required type="text" className="w-full border p-2 rounded" placeholder="Contraseña temporal"
                  value={form.adminPassword} onChange={e => setForm({...form, adminPassword: e.target.value})} />
              </div>
              
              <div className="flex gap-2 justify-end mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow">Crear Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}