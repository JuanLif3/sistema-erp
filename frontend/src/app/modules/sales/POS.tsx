import { useEffect, useState } from 'react';
import axios from 'axios';
import { ShoppingCart, Plus, Trash2, CheckCircle, PackageOpen } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Cargar productos al entrar
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      const response = await axios.get('http://localhost:3000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Solo mostramos productos con stock > 0
      setProducts(response.data.filter((p: Product) => p.stock > 0));
    } catch (error) {
      console.error("Error cargando inventario", error);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.id === product.id);
    
    if (existing) {
      // Si ya está, aumentamos cantidad (si hay stock)
      if (existing.quantity < product.stock) {
        setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
    } else {
      // Si no está, lo agregamos con cantidad 1
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
      
      // Formato que pide el Backend
      const payload = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      };

      await axios.post('http://localhost:3000/api/orders', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Éxito visual
      setSuccess(true);
      setCart([]);
      fetchProducts(); // Recargar stock actualizado
      setTimeout(() => setSuccess(false), 3000); // Ocultar mensaje a los 3 seg

    } catch (error) {
      console.error("Error procesando venta", error);
      alert("Error al procesar la venta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6 animate-fade-in">
      
      {/* 📦 IZQUIERDA: Catálogo de Productos */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <PackageOpen size={20} />
            Catálogo Disponible
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="group text-left p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all bg-white flex flex-col justify-between"
            >
              <div>
                <div className="font-bold text-slate-800 group-hover:text-brand-600 transition-colors">
                  {product.name}
                </div>
                <div className="text-xs text-slate-400 mb-2">{product.sku}</div>
              </div>
              <div className="flex justify-between items-end mt-2">
                <span className="font-bold text-lg text-slate-900">${product.price.toLocaleString()}</span>
                <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-md text-slate-600">
                  Stock: {product.stock}
                </span>
              </div>
            </button>
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-400">
              No hay productos con stock disponible.
            </div>
          )}
        </div>
      </div>

      {/* 🛒 DERECHA: Carrito de Compras */}
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

        {/* Lista del Carrito */}
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

        {/* Resumen y Botón Pagar */}
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