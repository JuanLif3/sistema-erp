import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
  ShoppingCart, Trash2, CheckCircle, PackageOpen, Search, X, 
  CreditCard, Banknote, Smartphone, ScanLine, ChevronDown, ChevronUp 
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  image?: string;
  isActive: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  // 👇 NUEVO: Estado para ver el carrito en móvil
  const [showMobileCart, setShowMobileCart] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProducts(); }, []);
  
  // Foco inteligente: Solo enfocar si no hay modales abiertos (para no abrir teclado en móvil molesto)
  useEffect(() => {
    if (!isPaymentModalOpen && !showMobileCart && window.innerWidth > 768) {
      searchInputRef.current?.focus();
    }
  }, [products, isPaymentModalOpen, cart, showMobileCart]);

const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // 👈
      const response = await axios.get(`${API_URL}/api/products?active=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.filter((p: Product) => p.stock > 0));
    } catch (error) { console.error("Error cargando inventario", error); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm) {
      const exactMatch = products.find(p => 
        p.sku.toLowerCase() === searchTerm.toLowerCase() || 
        p.name.toLowerCase() === searchTerm.toLowerCase()
      );
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchTerm('');
      }
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      } else { alert(`Stock máximo alcanzado para ${product.name}`); }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
    if (cart.length <= 1) setShowMobileCart(false); // Cerrar si se vacía
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSale = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // 👈
      await axios.post(`${API_URL}/api/orders`, {
        items: cart.map(item => ({ productId: item.id, quantity: item.quantity })),
        paymentMethod: paymentMethod
      }, { headers: { Authorization: `Bearer ${token}` } });

      setSuccess(true);
      setCart([]);
      setIsPaymentModalOpen(false);
      setShowMobileCart(false);
      fetchProducts();
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) { alert("Error al procesar venta"); } 
    finally { setLoading(false); }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-4 animate-fade-in relative">
      
      {/* 📦 SECCIÓN 1: CATÁLOGO (Full width en móvil) */}
      <div className={`flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden ${showMobileCart ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* Header Buscador */}
        <div className="p-3 border-b border-slate-100 bg-slate-50 flex flex-col gap-3">
          <div className="relative w-full">
            <ScanLine className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              ref={searchInputRef}
              type="text"
              placeholder="Buscar o escanear..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
            />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2.5 text-slate-400 p-1"><X size={16}/></button>}
          </div>
        </div>
        
        {/* Grid Productos */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start bg-slate-50/50 pb-24 lg:pb-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="group text-left p-2 rounded-xl border border-slate-200 bg-white hover:border-brand-500 shadow-sm flex flex-col h-full relative active:scale-95 transition-transform"
            >
              <div className="aspect-square bg-slate-100 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                {product.image ? (
                   <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                   <PackageOpen className="text-slate-300" size={28} />
                )}
              </div>
              <div className="flex flex-col justify-between flex-1">
                <div>
                  <div className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-tight mb-1">{product.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{product.sku}</div>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <span className="font-bold text-slate-900 text-sm">${product.price.toLocaleString()}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${product.stock < 5 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {product.stock}
                  </span>
                </div>
              </div>
              {/* Indicador de cantidad en carrito */}
              {cart.some(c => c.id === product.id) && (
                <div className="absolute top-2 right-2 bg-brand-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                   {cart.find(c => c.id === product.id)?.quantity}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 🛒 BARRA FLOTANTE MÓVIL (Solo visible en pantallas chicas si hay items) */}
      {cart.length > 0 && !showMobileCart && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
           <button 
             onClick={() => setShowMobileCart(true)}
             className="w-full bg-slate-900 text-white p-4 rounded-xl shadow-xl flex justify-between items-center animate-in slide-in-from-bottom-4"
           >
             <div className="flex items-center gap-2">
               <div className="bg-brand-500 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
                 {cart.reduce((acc, i) => acc + i.quantity, 0)}
               </div>
               <span className="font-medium text-sm">Ver Carrito</span>
             </div>
             <div className="flex items-center gap-2">
               <span className="font-bold text-xl">${total.toLocaleString()}</span>
               <ChevronUp size={20} />
             </div>
           </button>
        </div>
      )}

      {/* 🛒 SECCIÓN 2: CARRITO (Panel Lateral en Desktop / Modal en Móvil) */}
      <div className={`
        lg:w-96 bg-white lg:rounded-xl shadow-xl border-slate-200 flex flex-col z-50
        fixed inset-0 lg:static transition-transform duration-300
        ${showMobileCart ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
      `}>
        {/* Header Carrito */}
        <div className="p-4 bg-slate-900 text-white lg:rounded-t-xl flex justify-between items-center shadow-md shrink-0">
          <h2 className="font-bold flex items-center gap-2">
            <ShoppingCart size={20} /> <span className="lg:hidden">Tu Pedido</span> <span className="hidden lg:inline">Orden Actual</span>
          </h2>
          <button onClick={() => setShowMobileCart(false)} className="lg:hidden p-1 hover:bg-slate-800 rounded">
            <ChevronDown size={24} />
          </button>
        </div>

        {/* Lista Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 pb-32 lg:pb-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
              <ShoppingCart size={48} className="mb-4" />
              <p>Carrito vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="font-medium text-slate-800 text-sm truncate">{item.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.quantity} x ${item.price.toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700 text-sm">${(item.price * item.quantity).toLocaleString()}</span>
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 p-2 bg-slate-100 rounded-lg"><Trash2 size={18} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Total */}
        <div className="p-6 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 shrink-0 safe-area-bottom">
          <div className="flex justify-between items-end mb-4">
            <span className="text-slate-500 font-medium text-sm">TOTAL A PAGAR</span>
            <span className="text-3xl font-bold text-slate-900">${total.toLocaleString()}</span>
          </div>
          <button
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={cart.length === 0}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 transition-all"
            >
              Cobrar
          </button>
        </div>
      </div>

      {/* MODAL PAGO (Igual que antes, pero asegurando z-index alto) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           {/* ... Contenido del modal (Mismo código anterior) ... */}
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 transition-all">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">Método de Pago</h3>
              <div className="grid grid-cols-1 gap-3 mb-6">
                {[
                  { id: 'cash', label: 'Efectivo', icon: Banknote, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 ring-emerald-500' },
                  { id: 'card', label: 'Tarjeta / Débito', icon: CreditCard, color: 'text-blue-600 bg-blue-50 border-blue-200 ring-blue-500' },
                  { id: 'transfer', label: 'Transferencia', icon: Smartphone, color: 'text-purple-600 bg-purple-50 border-purple-200 ring-purple-500' },
                ].map((method) => (
                  <button key={method.id} onClick={() => setPaymentMethod(method.id)} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${paymentMethod === method.id ? `${method.color} border-current ring-1` : 'border-slate-100 hover:bg-slate-50'}`}>
                    <method.icon size={24} /> <span className="font-bold text-lg">{method.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-3 text-slate-600 font-medium bg-slate-100 rounded-xl">Cancelar</button>
                <button onClick={handleSale} disabled={loading} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl">{loading ? '...' : 'Confirmar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}