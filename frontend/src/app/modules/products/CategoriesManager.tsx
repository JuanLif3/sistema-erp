import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Tag, Trash2 } from 'lucide-react';

interface Category { id: string; name: string; }
interface Props { isOpen: boolean; onClose: () => void; onUpdate: () => void; }

export default function CategoriesManager({ isOpen, onClose, onUpdate }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (isOpen) fetchCategories(); }, [isOpen]);

const fetchCategories = async () => {
    try {
      const token = sessionStorage.getItem('erp_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // 👈
      const res = await axios.get(`${API_URL}/api/categories`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data);
    } catch (error) { console.error(error); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setLoading(true);
    try {
      const token = sessionStorage.getItem('erp_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // 👈
      await axios.post(`${API_URL}/api/categories`, { name: newCategory }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewCategory('');
      fetchCategories();
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al crear categoría');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-restricted-globals
    if(!confirm('¿Borrar categoría?')) return;
    try {
      const token = sessionStorage.getItem('erp_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // 👈
      await axios.delete(`${API_URL}/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
      onUpdate();
    } catch (error) { alert('Error al eliminar'); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Tag size={18} className="text-brand-600"/> Gestionar Categorías</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        <div className="p-6">
          <form onSubmit={handleAdd} className="flex gap-2 mb-6">
            <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nueva categoría..." className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" autoFocus />
            <button disabled={loading} className="bg-slate-900 text-white px-4 rounded-lg font-bold hover:bg-black transition-colors"><Plus size={20} /></button>
          </form>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {categories.map(cat => (
              <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-medium text-slate-700">{cat.name}</span>
                <button onClick={() => handleDelete(cat.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
              </div>
            ))}
            {categories.length === 0 && <p className="text-center text-slate-400 text-sm">No hay categorías creadas.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}