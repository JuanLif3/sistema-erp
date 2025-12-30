import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, Package, AlertCircle } from 'lucide-react';
import ProductFormModal from './ProductFormModal';

// Definimos la forma de nuestros datos (igual que en el backend)
interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  isActive: boolean;
}

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cargar productos al iniciar
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      // Petición al backend real
      const response = await axios.get('http://localhost:3000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error("Error cargando productos", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabecera del Módulo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventario</h2>
          <p className="text-slate-500 text-sm">Gestiona tu catálogo de productos</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm">
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      {/* Buscador y Filtros (Visuales por ahora) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o SKU..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700"
          />
        </div>
      </div>

      {/* Tabla de Datos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Cargando inventario...</div>
        ) : products.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Package size={48} className="mb-4 text-slate-300" />
            <p>No hay productos registrados aún.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">Producto / SKU</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-right">Precio</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{product.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">{product.sku}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">
                      ${Number(product.price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                        ${product.stock > 5 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'}
                      `}>
                        {product.stock <= 5 && <AlertCircle size={12} />}
                        {product.stock} un.
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`w-2 h-2 rounded-full mx-auto ${product.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-brand-600 hover:text-brand-800 font-medium text-xs hover:underline">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* MODAL DE CREACIÓN */}
  <ProductFormModal 
    isOpen={isModalOpen} 
    onClose={() => setIsModalOpen(false)} 
    onSuccess={fetchProducts} // Cuando guarde, recarga la lista automáticamente
  />
    </div>
  );
}