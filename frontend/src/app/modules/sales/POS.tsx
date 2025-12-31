import { useEffect, useState } from 'react';
import axios from 'axios';
import { ShoppingCart, Trash2, CheckCircle, PackageOpen, Search, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  image?: string; // Soportamos imagen
}

interface CartItem extends Product {
  quantity: number;
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // 👇 1. ESTADO PARA BÚSQUEDA
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      const response = await axios.get('http://localhost:3000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Solo productos con stock
      setProducts(response.data.filter((p: Product) => p.stock > 0));
    } catch (error) {
      console.error("Error cargando inventario", error);
    }
  };

  // 👇 2. FILTRADO INTELIGENTE
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSale = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('erp_token');
      const payload = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      };

      await axios.post('http://localhost:3000/api/orders', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(true);
      setCart([]);
      fetchProducts(); 
      setTimeout(() => setSuccess(false), 3000);

    } catch (error) {
      console.error("Error procesando venta", error);
      alert("Error al procesar la venta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6 animate-fade-in">
      
      {/* 📦 IZQUIERDA: Catálogo */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header con Buscador */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <PackageOpen size={20} />
            Catálogo
          </h2>
          
          {/* 👇 3. INPUT DE BÚSQUEDA */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        
        {/* Grid de Productos */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="group text-left p-3 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all bg-white flex gap-3 h-24"
            >
              {/* Miniatura de imagen en el POS */}
              <div className="h-full w-20 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100">
                {product.image ? (
                   <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                   <PackageOpen className="text-slate-300" size={24} />
                )}
              </div>
              
              <div className="flex flex-col justify-between flex-1 min-w-0">
                <div>
                  <div className="font-bold text-slate-800 text-sm truncate group-hover:text-brand-600 transition-colors">
                    {product.name}
                  </div>
                  <div className="text-xs text-slate-400 font-mono truncate">{product.sku}</div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="font-bold text-slate-900">${product.price.toLocaleString()}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">
                    Stock: {product.stock}
                  </span>
                </div>
              </div>
            </button>
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-400">
              {searchTerm ? "No se encontraron productos." : "No hay stock disponible."}
            </div>
          )}
        </div>
      </div>

      {/* 🛒 DERECHA: Carrito (Sin cambios mayores) */}
      <div className="w-full lg:w-96 bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col">
        <div className="p-4 bg-brand-600 text-white rounded-t-xl flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2">
            <ShoppingCart size={20} />
            Orden Actual
          </h2>
          <span className="bg-brand-700 px-2 py-0.5 rounded text-sm font-mono">
            {cart.length} ítems
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
              <ShoppingCart size={48} className="mb-2" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center animate-fade-in">
                <div>
                  <div className="font-medium text-slate-800 text-sm">{item.name}</div>
                  <div className="text-xs text-slate-500">
                    {item.quantity} x ${item.price.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700 text-sm">
                    ${(item.price * item.quantity).toLocaleString()}
                  </span>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <div className="flex justify-between items-end mb-6">
            <span className="text-slate-500 font-medium">Total a Pagar</span>
            <span className="text-3xl font-bold text-slate-900">${total.toLocaleString()}</span>
          </div>

          {success ? (
            <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center font-bold flex items-center justify-center gap-2 animate-pulse">
              <CheckCircle size={20} />
              ¡Venta Exitosa!
            </div>
          ) : (
            <button
              onClick={handleSale}
              disabled={cart.length === 0 || loading}
              className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? 'Procesando...' : 'Confirmar Venta 💳'}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}