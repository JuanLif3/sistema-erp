import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Calendar, Search, DollarSign, Filter, Tag, Save, X } from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export default function ExpensesManager() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Formulario
  const [formData, setFormData] = useState({ description: '', amount: '', category: 'Operativo' });

  // Filtros
  const [filters, setFilters] = useState({ category: 'all', search: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_token');
      const response = await axios.get(`${API_URL}/api/finances/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          category: filters.category,
          search: filters.search
        }
      });
      // El backend devuelve { data: [], meta: {} }
      setExpenses(response.data.data || []);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('erp_token');
      // Enviamos amount como número
      const payload = {
        ...formData,
        amount: Number(formData.amount)
      };

      await axios.post(`${API_URL}/api/finances/expenses`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsModalOpen(false);
      setFormData({ description: '', amount: '', category: 'Operativo' });
      fetchExpenses(); // Recargar lista
      alert('✅ Gasto registrado correctamente');
    } catch (error: any) {
      alert('Error al guardar gasto: ' + (error.response?.data?.message || 'Error desconocido'));
    }
  };

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-restricted-globals
    if(!confirm('¿Eliminar este gasto?')) return;
    try {
      const token = localStorage.getItem('erp_token');
      await axios.delete(`${API_URL}/api/finances/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchExpenses();
    } catch (error) { alert('Error al eliminar'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header y Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Gastos</h2>
          <p className="text-slate-500">Controla los egresos de tu Pyme</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all">
          <Plus size={20} /> Registrar Gasto
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" placeholder="Buscar gasto..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <select 
            className="border border-slate-300 rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}
          >
            <option value="all">Todas las categorías</option>
            <option value="Operativo">Operativo</option>
            <option value="Proveedores">Proveedores</option>
            <option value="Marketing">Marketing</option>
            <option value="Impuestos">Impuestos</option>
            <option value="Otros">Otros</option>
          </select>
        </div>
      </div>

      {/* Lista de Gastos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Cargando gastos...</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <DollarSign size={48} className="mb-4 opacity-20" />
            <p>No hay gastos registrados en este periodo.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
              <tr>
                <th className="p-4">Descripción</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Fecha</th>
                <th className="p-4 text-right">Monto</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map(expense => (
                <tr key={expense.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-700">{expense.description}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold border border-slate-200">
                      {expense.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500 flex items-center gap-2">
                    <Calendar size={14} /> {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right font-bold text-slate-800">
                    -${Number(expense.amount).toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDelete(expense.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Crear Gasto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Registrar Nuevo Gasto</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <input required type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ej: Pago de Luz"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input required type="number" min="0" className="w-full border rounded-lg pl-9 p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="0"
                      value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                  <select className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="Operativo">Operativo</option>
                    <option value="Proveedores">Proveedores</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Impuestos">Impuestos</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-black transition-all flex justify-center gap-2 mt-2">
                <Save size={18} /> Guardar Gasto
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}