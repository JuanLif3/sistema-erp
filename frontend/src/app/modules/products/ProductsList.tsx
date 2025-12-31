import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, Package, AlertCircle, X, Edit2, Trash2, Power, ArrowUpDown, AlertTriangle } from 'lucide-react';
import ProductFormModal from './ProductFormModal';

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  isActive: boolean;
  image?: string;
  description: string;
}

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtros
  const [sortOption, setSortOption] = useState('createdAt-DESC');
  const [showLowStock, setShowLowStock] = useState(false);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => { fetchProducts(); }, [sortOption, showLowStock]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_token');
      const [sortBy, order] = sortOption.split('-');
      const response = await axios.get('http://localhost:3000/api/products', {
        headers: { Authorization: `Bearer ${token}` },
        params: { sortBy, order, lowStock: showLowStock }
      });
      setProducts(response.data);
    } catch (error) { console.error("Error cargando productos", error); }
    finally { setLoading(false); }
  };

  const toggleStatus = async (product: Product) => {
    try {
      const token = localStorage.getItem('erp_token');
      await axios.patch(`http://localhost:3000/api/products/${product.id}`, {
        isActive: !product.isActive 
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      // Actualización optimista
      setProducts(products.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
    } catch (error) { alert("Error cambiando estado"); }
  };

  const handleEdit = (product: Product) => { setEditingProduct(product); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setTimeout(() => setEditingProduct(undefined), 300); };
  const requestDelete = (id: string) => { setProductToDelete(id); };
  
  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      const token = localStorage.getItem('erp_token');
      await axios.delete(`http://localhost:3000/api/products/${productToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
      setProductToDelete(null);
    } catch (error: any) {
      const message = error.response?.data?.message || "Error al eliminar";
      alert("⚠️ " + message);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventario</h2>
          <p className="text-slate-500 text-sm">Gestiona tu catálogo de productos</p>
        </div>
        <button 
          onClick={() => { setEditingProduct(undefined); setIsModalOpen(true); }}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
        >
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o SKU..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700"
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"><X size={18} /></button>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group min-w-[180px]">
             <ArrowUpDown className="absolute left-3 top-2.5 text-slate-400" size={18} />
             <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer hover:bg-slate-50 transition-colors">
               <option value="createdAt-DESC">Más Recientes</option>
               <option value="price-DESC">Precio: Mayor a Menor</option>
               <option value="price-ASC">Precio: Menor a Mayor</option>
               <option value="stock-DESC">Stock: Mayor a Menor</option>
               <option value="stock-ASC">Stock: Menor a Mayor</option>
             </select>
          </div>
          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
          <button onClick={() => setShowLowStock(!showLowStock)} className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all border ${showLowStock ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm ring-2 ring-amber-500/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800'}`}>
            <AlertTriangle size={18} className={showLowStock ? 'text-amber-600 fill-amber-600' : 'text-slate-400'} />
            {showLowStock ? 'Mostrando Stock Bajo' : 'Ver Stock Bajo'}
          </button>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Cargando inventario...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Package size={48} className="mb-4 text-slate-300" />
            <p>{products.length === 0 ? "No hay productos registrados." : "No se encontraron resultados."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">Imagen</th>
                  <th className="px-6 py-4">Producto / SKU</th>
                  <th className="px-6 py-4 hidden md:table-cell">Categoría</th>
                  <th className="px-6 py-4 text-right">Precio</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className={`hover:bg-slate-50/80 transition-colors ${!product.isActive ? 'opacity-60 bg-slate-50' : ''}`}>
                     
                     {/* 1. Imagen (SIN DUPLICADOS) */}
                     <td className="px-6 py-4">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className={`h-10 w-10 rounded object-cover border border-slate-200 ${!product.isActive && 'grayscale'}`} />
                        ) : (
                          <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                            <Package size={20} />
                          </div>
                        )}
                    </td>

                    {/* 2. Nombre */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{product.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">{product.sku}</div>
                    </td>

                    {/* 3. Categoría (Oculta en móvil) */}
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
                        {product.category}
                      </span>
                    </td>

                    {/* 4. Precio */}
                    <td className="px-6 py-4 text-right font-medium text-slate-800">
                      ${Number(product.price).toLocaleString('es-CL')}
                    </td>

                    {/* 5. Stock */}
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                        ${product.stock > 5 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}
                      `}>
                        {product.stock <= 5 && <AlertTriangle size={12} />}
                        {product.stock} un.
                      </div>
                    </td>

                    {/* 6. ESTADO (SWITCH INTERACTIVO RESTAURADO) */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleStatus(product)}
                        className={`group relative inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border transition-all duration-200 ease-in-out
                          ${product.isActive 
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-slate-100 hover:text-slate-500 hover:border-slate-200' 
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-200'}
                        `}
                        title={product.isActive ? "Clic para desactivar" : "Clic para activar"}
                      >
                        <span className="flex items-center gap-1">
                          <Power size={12} className={product.isActive ? 'text-emerald-600' : 'text-slate-400'} />
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </button>
                    </td>

                    {/* 7. ACCIONES (Solo una vez) */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => requestDelete(product.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Eliminar */}
      {productToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">¿Eliminar producto?</h3>
              <p className="text-sm text-slate-500 mb-6">El producto dejará de estar visible para nuevas ventas.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setProductToDelete(null)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Cancelar</button>
                <button onClick={confirmDelete} className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium shadow-md">Sí, Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProductFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSuccess={fetchProducts} productToEdit={editingProduct} />
    </div>
  );
}