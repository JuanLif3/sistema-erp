import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Trash2, TrendingDown, Plus, Calendar, Edit2, Search, Filter, 
  ArrowLeft, ArrowRight, Save, X 
} from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export default function ExpensesManager() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado Formulario (Crear/Editar)
  const [form, setForm] = useState({ id: '', description: '', amount: '', category: 'others' });
  const [isEditing, setIsEditing] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    startDate: '',
    endDate: ''
  });

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  useEffect(() => {
    fetchExpenses();
  }, [page, filters]); // Recargar al cambiar página o filtros

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_token');
      const params: any = { page, limit: LIMIT };
      
      if (filters.search) params.search = filters.search;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await axios.get('http://localhost:3000/api/finances/expenses', { 
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      setExpenses(res.data.data);
      setTotalPages(res.data.meta.lastPage);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!form.description || !form.amount) return;
    setLoading(true);
    
    try {
      const token = localStorage.getItem('erp_token');
      const payload = { ...form, amount: parseFloat(form.amount) };

      if (isEditing) {
        // EDITAR
        await axios.patch(`http://localhost:3000/api/finances/expenses/${form.id}`, payload, {
           headers: { Authorization: `Bearer ${token}` }
        });
        alert("Gasto actualizado");
      } else {
        // CREAR
        await axios.post('http://localhost:3000/api/finances/expenses', payload, {
           headers: { Authorization: `Bearer ${token}` }
        });
        alert("Gasto registrado");
      }
      
      resetForm();
      fetchExpenses();
    } catch (error) { 
      alert("Error al guardar gasto"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleEdit = (expense: Expense) => {
    setForm({
      id: expense.id,
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category
    });
    setIsEditing(true);
    // Scrollear arriba para ver el form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-restricted-globals
    if(!confirm("¿Borrar este gasto permanentemente?")) return;
    try {
      const token = localStorage.getItem('erp_token');
      await axios.delete(`http://localhost:3000/api/finances/expenses/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      fetchExpenses();
    } catch (error) { alert("Error al eliminar"); }
  };

  const resetForm = () => {
    setForm({ id: '', description: '', amount: '', category: 'others' });
    setIsEditing(false);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
      
      {/* 1. FORMULARIO (Panel Izquierdo/Superior) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit xl:sticky xl:top-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <div className={`p-2 rounded-lg text-white ${isEditing ? 'bg-blue-600' : 'bg-red-500'}`}>
              {isEditing ? <Edit2 size={20}/> : <TrendingDown size={20}/>}
            </div>
            {isEditing ? 'Editar Gasto' : 'Registrar Gasto'}
          </h3>
          {isEditing && (
            <button onClick={resetForm} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
              <X size={14}/> Cancelar Edición
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Descripción</label>
            <input 
              type="text" 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all" 
              placeholder="Ej: Pago de Luz..." 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Monto</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                <input 
                  type="number" 
                  value={form.amount} 
                  onChange={e => setForm({...form, amount: e.target.value})} 
                  className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all" 
                  placeholder="0" 
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Categoría</label>
              <select 
                value={form.category} 
                onChange={e => setForm({...form, category: e.target.value})} 
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="rent">Arriendo</option>
                <option value="utilities">Servicios</option>
                <option value="salary">Sueldos</option>
                <option value="supplies">Insumos</option>
                <option value="taxes">Impuestos</option>
                <option value="others">Otros</option>
              </select>
            </div>
          </div>
          
          <button 
            disabled={loading} 
            className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2 text-white
              ${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-black'}
            `}
          >
            {loading ? 'Procesando...' : isEditing ? 'Guardar Cambios' : 'Registrar Gasto'}
          </button>
        </form>
      </div>

      {/* 2. LISTADO Y FILTROS (Panel Derecho/Inferior) */}
      <div className="xl:col-span-2 space-y-4">
        
        {/* Barra de Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
            <input 
              type="text" 
              placeholder="Buscar gasto..." 
              value={filters.search}
              onChange={(e) => { setFilters({...filters, search: e.target.value}); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          
          <select 
            value={filters.category} 
            onChange={(e) => { setFilters({...filters, category: e.target.value}); setPage(1); }}
            className="w-full md:w-auto px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Todas las Categorías</option>
            <option value="rent">Arriendo</option>
            <option value="utilities">Servicios</option>
            <option value="salary">Sueldos</option>
            <option value="supplies">Insumos</option>
            <option value="taxes">Impuestos</option>
            <option value="others">Otros</option>
          </select>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input 
              type="date" 
              value={filters.startDate}
              onChange={(e) => { setFilters({...filters, startDate: e.target.value}); setPage(1); }}
              className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm text-slate-600"
            />
            <span className="text-slate-400">-</span>
            <input 
              type="date" 
              value={filters.endDate}
              onChange={(e) => { setFilters({...filters, endDate: e.target.value}); setPage(1); }}
              className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm text-slate-600"
            />
          </div>
        </div>

        {/* Tabla de Gastos */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
            <span>Historial de Gastos</span>
            <span className="text-xs font-normal text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
              Página {page} de {totalPages}
            </span>
          </div>
          
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mb-2"></div>
                Cargando...
              </div>
            ) : expenses.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60">
                <TrendingDown size={48} className="mb-2"/>
                <p>No hay gastos registrados</p>
              </div>
            ) : (
              expenses.map((expense) => (
                <div key={expense.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center hover:bg-slate-50 transition-colors gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-slate-100 p-2 rounded-lg text-slate-400 hidden sm:block">
                      <Calendar size={16}/>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{expense.description}</div>
                      <div className="text-xs text-slate-500 flex flex-wrap gap-2 mt-0.5 items-center">
                        <span className="capitalize bg-slate-100 px-1.5 rounded text-slate-600 border border-slate-200">
                          {expense.category}
                        </span>
                        <span>•</span>
                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                        <span className="text-slate-300 hidden sm:inline">|</span>
                        <span className="text-slate-400 font-mono text-[10px] hidden sm:inline">ID: {expense.id.slice(0,6)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <span className="font-bold text-red-600 text-lg">
                      - ${Number(expense.amount).toLocaleString()}
                    </span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleEdit(expense)} 
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={18}/>
                      </button>
                      <button 
                        onClick={() => handleDelete(expense.id)} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Paginación */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
             <button 
               onClick={() => setPage(p => Math.max(1, p - 1))}
               disabled={page === 1}
               className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50 flex items-center gap-1"
             >
               <ArrowLeft size={16}/> Anterior
             </button>
             
             <span className="text-xs font-bold text-slate-500">
               {page} / {totalPages}
             </span>

             <button 
               onClick={() => setPage(p => Math.min(totalPages, p + 1))}
               disabled={page === totalPages}
               className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50 flex items-center gap-1"
             >
               Siguiente <ArrowRight size={16}/>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}