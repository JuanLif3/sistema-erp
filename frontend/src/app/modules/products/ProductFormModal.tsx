import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Loader2, Package, UploadCloud, Settings } from 'lucide-react';
import CategoriesManager from './CategoriesManager'; // 👈 IMPORTANTE: Asegúrate que esta ruta sea correcta

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  image?: string;
  isActive: boolean;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: Product;
}

export default function ProductFormModal({ isOpen, onClose, onSuccess, productToEdit }: ProductFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // 👇 NUEVOS ESTADOS PARA CATEGORÍAS
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [showCatManager, setShowCatManager] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    name: '', sku: '', price: '', stock: '', category: '', description: '', image: '' 
  });

  useEffect(() => {
    if (isOpen) {
      // Verificar rol Admin
      const roles = JSON.parse(localStorage.getItem('erp_roles') || '[]');
      setIsAdmin(roles.includes('admin'));

      // Cargar categorías
      fetchCategories();

      if (productToEdit) {
        setFormData({
          name: productToEdit.name,
          sku: productToEdit.sku,
          price: productToEdit.price.toString(),
          stock: productToEdit.stock.toString(),
          category: productToEdit.category,
          description: productToEdit.description || '',
          image: productToEdit.image || ''
        });
      } else {
        setFormData({ name: '', sku: '', price: '', stock: '', category: '', description: '', image: '' });
      }
    }
  }, [isOpen, productToEdit]);

const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // 👈
      const res = await axios.get(`${API_URL}/api/categories`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data);
    } catch (error) { console.error("Error cargando categorías"); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    try {
      const token = localStorage.getItem('erp_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // 👈
      const response = await axios.post(`${API_URL}/api/products/upload`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      setFormData(prev => ({ ...prev, image: response.data.url }));
    } catch (error) { alert("Error al subir la imagen."); } 
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // 👈

      const payload = { ...formData, price: parseFloat(formData.price), stock: parseInt(formData.stock) };
      
      if (productToEdit) {
        await axios.patch(`${API_URL}/api/products/${productToEdit.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_URL}/api/products`, payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      onSuccess();
      onClose();
    } catch (error) { alert("Error al guardar."); } 
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 max-h-[90vh] overflow-y-auto">
          
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              {productToEdit ? <Package className="text-blue-600" size={20}/> : <Package className="text-brand-600" size={20}/>}
              {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <label className="block text-sm font-medium text-slate-700 mb-3">Imagen del Producto</label>
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden relative shadow-sm flex-shrink-0">
                  {formData.image ? <img src={formData.image} alt="Preview" className="h-full w-full object-cover" /> : <Package className="text-slate-300" size={32} />}
                  {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"><Loader2 className="animate-spin text-white" size={24} /></div>}
                </div>
                <div className="flex-1 relative">
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 w-fit shadow-sm"><UploadCloud size={18} /> {uploading ? 'Subiendo...' : 'Seleccionar Imagen'}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label><input name="name" required value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">SKU</label><input name="sku" required value={formData.sku} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition uppercase font-mono" /></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Precio</label><input name="price" type="number" required value={formData.price} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Stock</label><input name="stock" type="number" required value={formData.stock} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition" /></div>
            </div>

            {/* 👇 SELECTOR DE CATEGORÍA DINÁMICO */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Categoría</label>
                {/* Botón Gestión solo Admin */}
                {isAdmin && (
                  <button type="button" onClick={() => setShowCatManager(true)} className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1 font-bold">
                    <Settings size={12}/> Gestionar
                  </button>
                )}
              </div>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition bg-white"
                required
              >
                <option value="">Seleccionar...</option>
                {/* Mapeamos las categorías de la BD */}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div><label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label><textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition" /></div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
              <button type="submit" disabled={loading || uploading} className={`px-6 py-2 text-white rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${productToEdit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-brand-600 hover:bg-brand-700'}`}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {productToEdit ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* RENDERIZAR GESTOR FUERA DEL MODAL PRINCIPAL */}
      <CategoriesManager 
        isOpen={showCatManager} 
        onClose={() => setShowCatManager(false)} 
        onUpdate={fetchCategories} 
      />
    </>
  );
}