import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
  ShoppingCart, Trash2, CheckCircle, PackageOpen, Search, X, 
  CreditCard, Banknote, Smartphone, ScanLine, AlertTriangle 
} from 'lucide-react';

// Interfaces
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
  // Estados de Datos
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de UI/UX
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'card', 'transfer'

  // Ref para mantener el foco en el lector
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cargar productos al iniciar
  useEffect(() => {
    fetchProducts();
  }, []);

  // Mantener el foco en el input siempre que se actualice la lista (listo para escanear)
  useEffect(() => {
    if (!isPaymentModalOpen) {
      searchInputRef.current?.focus();
    }
  }, [products, isPaymentModalOpen, cart]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      // Pedimos solo los activos
      const response = await axios.get('http://localhost:3000/api/products?active=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Opcional: Filtrar los que tienen stock > 0
      setProducts(response.data.filter((p: Product) => p.stock > 0));
    } catch (error) {
      console.error("Error cargando inventario", error);
    }
  };

  // 👇 LÓGICA DEL LECTOR DE CÓDIGO DE BARRAS
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm) {
      // Buscamos coincidencia exacta (SKU o Nombre exacto)
      const exactMatch = products.find(p => 
        p.sku.toLowerCase() === searchTerm.toLowerCase() || 
        p.name.toLowerCase() === searchTerm.toLowerCase()
      );

      if (exactMatch) {
        addToCart(exactMatch);
        setSearchTerm(''); // Limpiar campo para el siguiente escaneo
      }
    }
  };

  // Agregar al Carrito
  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.id === product.id);
    
    if (existing) {
      // Validar Stock
      if (existing.quantity < product.stock) {
        setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      } else {
        // Feedback visual si no hay stock (opcional: usar un toast aquí)
        alert(`No hay más stock de ${product.name}`);
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // Quitar del Carrito
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // Calcular Total
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // 👇 PROCESAR LA VENTA
  const handleSale = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('erp_token');
      
      const payload = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity
        })),
        paymentMethod: paymentMethod // Enviamos el medio de pago
      };

      await axios.post('http://localhost:3000/api/orders', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Éxito
      setSuccess(true);
      setCart([]); // Limpiar carrito
      setIsPaymentModalOpen(false); // Cerrar modal
      fetchProducts(); // Actualizar stock local
      
      // Ocultar mensaje de éxito después de 3 seg
      setTimeout(() => setSuccess(false), 3000);
      
      // Devolver foco al lector
      setTimeout(() => searchInputRef.current?.focus(), 100);

    } catch (error) {
      console.error("Error procesando venta", error);
      alert("Error al procesar la venta.");
    } finally {
      setLoading(false);
    }
  };

  // Filtrado visual manual (mientras escribes)
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6 animate-fade-in">
      
      {/* 📦 IZQUIERDA: Catálogo */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header con Buscador Inteligente */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <PackageOpen size={20} />
            Catálogo de Ventas
          </h2>
          
          <div className="relative w-full sm:w-80 group">
            <ScanLine className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              ref={searchInputRef}
              type="text"
              placeholder="Escanear código o buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown} // Detectar Enter del lector
              className="w-full pl-10 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all shadow-sm"
              autoFocus
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
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 content-start bg-slate-50/50">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="group text-left p-3 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all bg-white flex gap-3 h-24 relative overflow-hidden"
            >
              {/* Imagen */}
              <div className="h-full w-20 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100">
                {product.image ? (
                   <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                   <PackageOpen className="text-slate-300" size={24} />
                )}
              </div>
              
              {/* Info */}
              <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
                <div>
                  <div className="font-bold text-slate-800 text-sm truncate group-hover:text-brand-600 transition-colors">
                    {product.name}
                  </div>
                  <div className="text-xs text-slate-400 font-mono truncate tracking-tight">{product.sku}</div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="font-bold text-slate-900 text-lg">${product.price.toLocaleString()}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${product.stock < 5 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    Stock: {product.stock}
                  </span>
                </div>
              </div>
            </button>
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
              <PackageOpen size={48} className="mb-4 opacity-50"/>
              <p>{searchTerm ? "No se encontraron productos." : "No hay productos activos para vender."}</p>
            </div>
          )}
        </div>
      </div>

      {/* 🛒 DERECHA: Carrito */}
      <div className="w-full lg:w-96 bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col z-10">
        
        {/* Header Carrito */}
        <div className="p-4 bg-slate-900 text-white rounded-t-xl flex justify-between items-center shadow-md">
          <h2 className="font-bold flex items-center gap-2">
            <ShoppingCart size={20} />
            Orden Actual
          </h2>
          <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-xs font-mono">
            {cart.reduce((acc, item) => acc + item.quantity, 0)} ítems
          </span>
        </div>

        {/* Lista Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
              <ShoppingCart size={48} className="mb-4" />
              <p className="text-sm">El carrito está vacío</p>
              <p className="text-xs mt-2 text-slate-400">Escanea un producto para comenzar</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center animate-in slide-in-from-right-2 duration-200">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="font-medium text-slate-800 text-sm truncate">{item.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {item.quantity} x ${item.price.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700 text-sm">
                    ${(item.price * item.quantity).toLocaleString()}
                  </span>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Total & Pagar */}
        <div className="p-6 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="flex justify-between items-end mb-6">
            <span className="text-slate-500 font-medium text-sm uppercase tracking-wider">Total a Pagar</span>
            <span className="text-3xl font-bold text-slate-900 tracking-tight">${total.toLocaleString()}</span>
          </div>

          {success ? (
            <div className="bg-emerald-100 text-emerald-700 p-4 rounded-xl text-center font-bold flex items-center justify-center gap-2 animate-pulse shadow-inner">
              <CheckCircle size={24} />
              ¡Venta Exitosa!
            </div>
          ) : (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={cart.length === 0}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex justify-center items-center gap-2 transform active:scale-[0.98]"
            >
              Cobrar ${total.toLocaleString()}
            </button>
          )}
        </div>
      </div>

      {/* 👇 MODAL DE SELECCIÓN DE PAGO */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 transition-all">
            
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Método de Pago</h3>
                <p className="text-slate-500 text-sm mt-1">Selecciona cómo pagará el cliente</p>
              </div>
              
              <div className="grid grid-cols-1 gap-3 mb-6">
                {[
                  { id: 'cash', label: 'Efectivo', icon: Banknote, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 ring-emerald-500' },
                  { id: 'card', label: 'Tarjeta / Débito', icon: CreditCard, color: 'text-blue-600 bg-blue-50 border-blue-200 ring-blue-500' },
                  { id: 'transfer', label: 'Transferencia', icon: Smartphone, color: 'text-purple-600 bg-purple-50 border-purple-200 ring-purple-500' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all relative group ${
                      paymentMethod === method.id 
                        ? `${method.color} border-current ring-1 shadow-sm` 
                        : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-white ${paymentMethod === method.id ? '' : 'group-hover:scale-110 transition-transform'}`}>
                      <method.icon size={24} />
                    </div>
                    <span className="font-bold text-lg">{method.label}</span>
                    {paymentMethod === method.id && (
                      <div className="absolute right-4 text-current">
                        <CheckCircle size={20} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100 mt-4">
                <button 
                  onClick={() => setIsPaymentModalOpen(false)} 
                  className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSale} 
                  disabled={loading}
                  className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black shadow-lg shadow-slate-900/20 flex justify-center items-center gap-2 transform active:scale-[0.98] transition-all"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  ) : 'Confirmar'}
                </button>
              </div>
            </div>

            {/* Total en el modal */}
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
               <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Monto a cobrar</span>
               <div className="text-2xl font-black text-slate-900">${total.toLocaleString()}</div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}