import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Plus, Save, Users, Power, PowerOff, ShieldCheck } from 'lucide-react';

export default function SaaSManager() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Formulario
  const [form, setForm] = useState({
    name: '', rut: '', adminName: '', adminEmail: '', adminPassword: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchCompanies();
  }, []);

  // 1. OBTENER EMPRESAS (Usando el endpoint seguro de SuperAdmin)
  const fetchCompanies = async () => {
    try {
      const token = sessionStorage.getItem('erp_token');
      // Usamos el endpoint correcto del SuperAdminController
      const res = await axios.get(`${API_URL}/api/super-admin/companies`, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanies(res.data);
    } catch (error) { 
      console.error(error); 
    } finally {
      setLoading(false);
    }
  };

  // 2. CREAR EMPRESA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // eslint-disable-next-line no-restricted-globals
    if(!confirm('¿Confirmas la creación de este nuevo cliente?')) return;

    try {
      const token = sessionStorage.getItem('erp_token');
      
      // Mapeamos los datos del formulario a lo que espera el Backend
      const payload = {
        companyName: form.name,
        companyRut: form.rut,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword
      };

      await axios.post(`${API_URL}/api/super-admin/companies`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('✅ Cliente creado exitosamente');
      setForm({ name: '', rut: '', adminName: '', adminEmail: '', adminPassword: '' });
      fetchCompanies(); // Recargar lista
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.message || 'Error desconocido'));
    }
  };

  // 3. BLOQUEAR / DESBLOQUEAR (La funcionalidad clave)
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const action = currentStatus ? 'SUSPENDER' : 'ACTIVAR';
    // eslint-disable-next-line no-restricted-globals
    if(!confirm(`¿Estás seguro que deseas ${action} el acceso a esta empresa?`)) return;
    
    try {
      const token = sessionStorage.getItem('erp_token');
      await axios.patch(`${API_URL}/api/super-admin/companies/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCompanies(); // Recargar para ver el cambio
    } catch (e) { alert('Error al cambiar estado'); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
          <ShieldCheck size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel Super Admin</h1>
          <p className="text-slate-500">Gestión de Clientes y Suscripciones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO (4 Columnas) */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700">
              <Plus size={20} className="text-indigo-600" /> Nuevo Cliente
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Datos Empresa */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datos de la Empresa</label>
                <div>
                  <input type="text" placeholder="Nombre Fantasía (Ej: Pizzería)" required
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  />
                </div>
                <div>
                  <input type="text" placeholder="RUT (Ej: 76.xxx.xxx-k)" required
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={form.rut} onChange={e => setForm({...form, rut: e.target.value})}
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Datos Dueño */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datos del Administrador</label>
                <div>
                  <input type="text" placeholder="Nombre Completo" required
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={form.adminName} onChange={e => setForm({...form, adminName: e.target.value})}
                  />
                </div>
                <div>
                  <input type="email" placeholder="Correo (Login)" required
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={form.adminEmail} onChange={e => setForm({...form, adminEmail: e.target.value})}
                  />
                </div>
                <div>
                  <input type="password" placeholder="Contraseña Inicial" required
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={form.adminPassword} onChange={e => setForm({...form, adminPassword: e.target.value})}
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center gap-2 mt-2 shadow-md hover:shadow-lg">
                <Save size={18} /> Crear Instancia
              </button>
            </form>
          </div>
        </div>

        {/* COLUMNA DERECHA: LISTA (8 Columnas) */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Building2 size={18} className="text-slate-400"/> Cartera de Clientes
              </h3>
              <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs font-bold">{companies.length} Registros</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-slate-500 border-b border-slate-100 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-bold">Empresa / RUT</th>
                    <th className="px-6 py-4 font-bold">Usuarios</th>
                    <th className="px-6 py-4 font-bold">Registro</th>
                    <th className="px-6 py-4 text-center font-bold">Estado</th>
                    <th className="px-6 py-4 text-center font-bold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">Cargando datos...</td></tr>
                  ) : companies.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">No hay clientes registrados.</td></tr>
                  ) : (
                    companies.map((c) => (
                      <tr key={c.id} className={`transition-colors ${!c.isActive ? 'bg-slate-50/80' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4">
                          <div className={`font-bold ${!c.isActive ? 'text-slate-500' : 'text-slate-800'}`}>{c.name}</div>
                          <div className="text-slate-400 text-xs font-mono">{c.rut}</div>
                        </td>
                        
                        <td className="px-6 py-4 text-slate-600">
                          <div className="flex items-center gap-1.5 bg-slate-100 w-fit px-2 py-1 rounded-md text-xs font-bold border border-slate-200">
                            <Users size={12} className="text-indigo-500" /> {c.usersCount || 0}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-500 text-xs">
  {/* 👇 CAMBIO AQUÍ: Formateo explícito a hora local */}
  {new Date(c.createdAt).toLocaleDateString('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}
</td>

                        <td className="px-6 py-4 text-center">
                          {c.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              ACTIVO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                              SUSPENDIDO
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => toggleStatus(c.id, c.isActive)}
                            className={`p-2 rounded-lg transition-all shadow-sm border ${
                              c.isActive 
                                ? 'bg-white border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200' 
                                : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100 shadow-emerald-100'
                            }`}
                            title={c.isActive ? "Suspender acceso" : "Reactivar acceso"}
                          >
                            {c.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}