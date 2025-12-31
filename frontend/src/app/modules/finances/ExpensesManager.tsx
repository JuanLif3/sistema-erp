import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, TrendingDown, Plus, Calendar } from 'lucide-react';

export default function ExpensesManager() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ description: '', amount: '', category: 'others' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      const res = await axios.get('http://localhost:3000/api/finances/expenses', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setExpenses(res.data);
    } catch (error) { console.error(error); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!form.description || !form.amount) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_token');
      await axios.post('http://localhost:3000/api/finances/expenses', {
        ...form, amount: parseFloat(form.amount)
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setForm({ description: '', amount: '', category: 'others' });
      fetchExpenses();
      alert("Gasto registrado");
    } catch (error) { 
      alert("Error al guardar gasto"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-restricted-globals
    if(!confirm("¿Borrar este gasto?")) return;
    try {
      const token = localStorage.getItem('erp_token');
      await axios.delete(`http://localhost:3000/api/finances/expenses/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      fetchExpenses();
    } catch (error) { alert("Error al eliminar"); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* 1. Formulario de Ingreso */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <div className="bg-red-100 p-2 rounded-lg text-red-600"><TrendingDown size={20}/></div>
          Registrar Salida de Dinero
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Descripción</label>
            <input 
              type="text" 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all" 
              placeholder="Ej: Pago de Luz, Compra de insumos..." 
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
                <option value="utilities">Servicios (Luz/Agua)</option>
                <option value="salary">Sueldos</option>
                <option value="supplies">Insumos/Mercadería</option>
                <option value="taxes">Impuestos</option>
                <option value="others">Otros</option>
              </select>
            </div>
          </div>
          
          <button 
            disabled={loading} 
            className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2"
          >
            {loading ? 'Guardando...' : <><Plus size={18}/> Registrar Gasto</>}
          </button>
        </form>
      </div>

      {/* 2. Lista de Gastos */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
          <span>Historial de Gastos</span>
          <span className="text-xs font-normal text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
            {expenses.length} registros
          </span>
        </div>
        
        <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
          {expenses.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
              <TrendingDown size={48} className="mb-2"/>
              <p>No hay gastos registrados</p>
            </div>
          ) : (
            expenses.map((expense: any) => (
              <div key={expense.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-slate-100 p-2 rounded-lg text-slate-400">
                    <Calendar size={16}/>
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{expense.description}</div>
                    <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                      <span className="capitalize bg-slate-100 px-1.5 rounded text-slate-600">{expense.category}</span>
                      <span>•</span>
                      <span>{new Date(expense.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="font-bold text-red-600 text-lg">
                    - ${Number(expense.amount).toLocaleString()}
                  </span>
                  <button 
                    onClick={() => handleDelete(expense.id)} 
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Eliminar Gasto"
                  >
                    <Trash2 size={18}/>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}