import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Plus, Save } from 'lucide-react';

export default function SaaSManager() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '', rut: '', adminName: '', adminEmail: '', adminPassword: ''
  });

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const API_URL = `${BASE_URL}/api`;

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      // Ahora sí llamará a: http://localhost:3000/api/companies
      const res = await axios.get(`${API_URL}/companies`, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanies(res.data);
    } catch (error) { console.error(error); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('erp_token');
      // También corregimos aquí:
      await axios.post(`${API_URL}/companies`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Cliente creado exitosamente');
      setForm({ name: '', rut: '', adminName: '', adminEmail: '', adminPassword: '' });
      fetchCompanies();
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.message || 'Error desconocido'));
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
          <Building2 size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel SaaS</h1>
          <p className="text-slate-500">Administra tus clientes y crea nuevas instancias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORMULARIO DE CREACIÓN */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Plus size={20} className="text-indigo-600" /> Nuevo Cliente
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Empresa</label>
                <input type="text" placeholder="Nombre Fantasía" required
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>
              <div>
                <input type="text" placeholder="RUT Empresa" required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={form.rut} onChange={e => setForm({...form, rut: e.target.value})}
                />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase">Administrador (Dueño)</label>
                <input type="text" placeholder="Nombre Completo" required
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={form.adminName} onChange={e => setForm({...form, adminName: e.target.value})}
                />
                <input type="email" placeholder="Correo Login" required
                  className="w-full mt-2 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={form.adminEmail} onChange={e => setForm({...form, adminEmail: e.target.value})}
                />
                <input type="password" placeholder="Contraseña Inicial" required
                  className="w-full mt-2 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={form.adminPassword} onChange={e => setForm({...form, adminPassword: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all flex justify-center gap-2">
                <Save size={20} /> Crear Pyme
              </button>
            </form>
          </div>
        </div>

        {/* LISTA DE CLIENTES */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
              Cartera de Clientes ({companies.length})
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-white text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-3">Empresa</th>
                  <th className="px-6 py-3">Admin</th>
                  <th className="px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{c.name}</div>
                      <div className="text-slate-400 text-xs">{c.rut}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      Creado el {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {c.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                      No hay clientes registrados aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}