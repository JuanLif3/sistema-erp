import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Calendar, Package, Eye, X, Trash2, AlertTriangle, ArrowLeft, ArrowRight, Filter, 
  Banknote, CreditCard, Smartphone, Check, User as UserIcon 
} from 'lucide-react'; // 👈 Importé UserIcon

interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  product: {
    name: string;
    sku: string;
  };
}

interface Order {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
  user?: { fullName: string; email: string }; // 👈 El usuario que hizo la venta
}

export default function SalesHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  
  // Filtros
  const [activeTab, setActiveTab] = useState<'completed' | 'cancelled'>('completed');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOption, setSortOption] = useState('date-desc');
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [activeTab, page, sortOption, paymentFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_token');
      
      let sortBy = 'createdAt';
      let order = 'DESC';
      if (sortOption === 'date-asc') { order = 'ASC'; }
      if (sortOption === 'total-desc') { sortBy = 'total'; order = 'DESC'; }
      if (sortOption === 'total-asc') { sortBy = 'total'; order = 'ASC'; }

      const response = await axios.get(`http://localhost:3000/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: activeTab,
          page: page,
          sortBy: sortBy,
          order: order,
          paymentMethod: paymentFilter
        }
      });
      
      setOrders(response.data.data);
      setTotalPages(response.data.meta.lastPage);

    } catch (error) { console.error("Error cargando historial", error); } 
    finally { setLoading(false); }
  };

  const requestDelete = (orderId: string) => setOrderToDelete(orderId);

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      const token = localStorage.getItem('erp_token');
      await axios.delete(`http://localhost:3000/api/orders/${orderToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrderToDelete(null);
      fetchOrders(); 
    } catch (error) {
      console.error(error);
      alert("Error al cancelar la venta.");
    }
  };

  const handleTabChange = (tab: 'completed' | 'cancelled') => {
    setActiveTab(tab);
    setPage(1);
  };

  const getPaymentIcon = (method: string) => {
    switch(method) {
      case 'card': return <CreditCard size={14} className="text-blue-500"/>;
      case 'transfer': return <Smartphone size={14} className="text-purple-500"/>;
      default: return <Banknote size={14} className="text-emerald-500"/>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Historial de Transacciones</h2>
            <p className="text-slate-500 text-sm">{activeTab === 'completed' ? 'Ventas realizadas' : 'Ventas anuladas'}</p>
          </div>
          
           <div className="bg-slate-100 p-1 rounded-lg flex space-x-1 shadow-inner self-start sm:self-auto">
             <button onClick={() => handleTabChange('completed')} className={`px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'completed' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
               <Package size={16} /> <span className="hidden sm:inline">Activas</span>
             </button>
             <button onClick={() => handleTabChange('cancelled')} className={`px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'cancelled' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
               <Trash2 size={16} /> <span className="hidden sm:inline">Eliminadas</span>
             </button>
           </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
           <div className="relative w-full sm:w-auto min-w-[160px]">
             <select value={sortOption} onChange={(e) => { setSortOption(e.target.value); setPage(1); }} className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer hover:bg-slate-100 transition-colors">
               <option value="date-desc">Más Recientes</option>
               <option value="date-asc">Más Antiguas</option>
               <option value="total-desc">Mayor Importe</option>
               <option value="total-asc">Menor Importe</option>
             </select>
             <Filter className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
           </div>
           <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
           <div className="flex gap-2 w-full overflow-x-auto pb-2 sm:pb-0 scrollbar-hide items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider self-center mr-2 shrink-0">Pago:</span>
              {[
                { id: 'cash', label: 'Efectivo', icon: Banknote, color: 'emerald' },
                { id: 'card', label: 'Tarjeta', icon: CreditCard, color: 'blue' },
                { id: 'transfer', label: 'Transfer', icon: Smartphone, color: 'purple' },
              ].map(method => {
                const isSelected = paymentFilter === method.id;
                const activeClasses = isSelected ? `bg-${method.color}-100 text-${method.color}-700 border-${method.color}-200 ring-1 ring-${method.color}-500` : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50';
                return (
                  <button key={method.id} onClick={() => { setPaymentFilter(isSelected ? null : method.id); setPage(1); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all shrink-0 ${activeClasses}`}>
                    <method.icon size={14} /> {method.label} {isSelected && <Check size={14} strokeWidth={3} />}
                  </button>
                )
              })}
              {paymentFilter && <button onClick={() => setPaymentFilter(null)} className="text-xs text-slate-400 underline hover:text-slate-600 shrink-0 ml-auto sm:ml-2">Ver Todos</button>}
           </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mb-2"></div>Cargando...</div>
        ) : orders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400"><Package size={48} className="mb-4 text-slate-300 opacity-50" /><p>No se encontraron ventas.</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4 hidden md:table-cell">ID / Fecha</th>
                    <th className="px-6 py-4">Resumen</th>
                    {/* 👇 NUEVA COLUMNA VENDEDOR (Visible en Desktop) */}
                    <th className="px-6 py-4 hidden lg:table-cell">Vendedor</th>
                    <th className="px-6 py-4 text-center">Pago</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* ID / Fecha */}
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="font-mono text-xs text-slate-400 mb-1">#{order.id.slice(0, 8)}</div>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <Calendar size={14} className="text-brand-500" />
                          {new Date(order.createdAt).toLocaleDateString()}
                          <span className="text-slate-400 text-xs hidden lg:inline">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </td>

                      {/* Resumen */}
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold">{order.items.reduce((acc, item) => acc + item.quantity, 0)}</span> prods.
                          <span className="md:hidden text-slate-400">• {new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-[150px] lg:max-w-[250px]">{order.items.map(i => i.product?.name).join(', ')}</div>
                        
                        {/* 👇 VENDEDOR EN MÓVIL (Solo visible si pantalla es pequeña) */}
                        <div className="lg:hidden mt-1 flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 w-fit px-1.5 py-0.5 rounded">
                           <UserIcon size={10} /> {order.user?.fullName || 'Sistema'}
                        </div>
                      </td>

                      {/* 👇 VENDEDOR EN DESKTOP (Columna dedicada) */}
                      <td className="px-6 py-4 hidden lg:table-cell">
                         <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                             <UserIcon size={14} />
                           </div>
                           <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                             {order.user?.fullName || 'Sistema'}
                           </span>
                         </div>
                      </td>

                      {/* Pago */}
                      <td className="px-6 py-4 text-center">
                         <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600 capitalize">
                           {getPaymentIcon(order.paymentMethod || 'cash')}
                           <span className="hidden sm:inline">{order.paymentMethod === 'card' ? 'Tarjeta' : order.paymentMethod === 'transfer' ? 'Transf.' : 'Efectivo'}</span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className={`px-6 py-4 text-right font-bold ${activeTab === 'cancelled' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>${Number(order.total).toLocaleString()}</td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => setSelectedOrder(order)} className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Ver Detalle"><Eye size={18}/></button>
                          {activeTab === 'completed' && (<button onClick={() => requestDelete(order.id)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Cancelar Venta"><Trash2 size={18}/></button>)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-slate-500">Página <b>{page}</b> de <b>{totalPages}</b></span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50 disabled:opacity-50"><ArrowLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50 disabled:opacity-50"><ArrowRight size={16} /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modales (Sin cambios mayores, solo visuales) */}
      {orderToDelete && ( <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"> <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"> <div className="p-6 text-center"> <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600"> <AlertTriangle size={24} /> </div> <h3 className="text-lg font-bold text-slate-800 mb-2">¿Cancelar esta venta?</h3> <p className="text-sm text-slate-500 mb-6">El stock será devuelto al inventario.</p> <div className="flex gap-3 justify-center"> <button onClick={() => setOrderToDelete(null)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Cancelar</button> <button onClick={confirmDelete} className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium shadow-md">Sí, Eliminar</button> </div> </div> </div> </div> )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className={`px-6 py-4 flex justify-between items-center ${selectedOrder.status === 'cancelled' ? 'bg-red-50' : 'bg-slate-900'}`}>
              <div>
                <h3 className={`font-bold text-lg ${selectedOrder.status === 'cancelled' ? 'text-red-700' : 'text-white'}`}>{selectedOrder.status === 'cancelled' ? 'Venta Cancelada' : 'Detalle de Venta'}</h3>
                <p className={`text-xs font-mono ${selectedOrder.status === 'cancelled' ? 'text-red-400' : 'text-slate-400'}`}>ID: {selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className={selectedOrder.status === 'cancelled' ? 'text-red-400' : 'text-slate-400 hover:text-white'}><X size={20} /></button>
            </div>
            
            {/* Detalle Usuario en Modal */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-sm text-slate-600">
               <UserIcon size={16} className="text-slate-400"/>
               <span>Vendido por: <b>{selectedOrder.user?.fullName || 'Sistema'}</b></span>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-3">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-brand-50 p-2 rounded-lg text-brand-600"><Package size={20} /></div>
                    <div><div className="font-medium text-slate-800 text-sm">{item.product?.name || 'Desconocido'}</div><div className="text-xs text-slate-500 font-mono">{item.product?.sku}</div></div>
                  </div>
                  <div className="text-right"><div className="font-bold text-slate-800 text-sm">${Number(item.priceAtPurchase * item.quantity).toLocaleString()}</div><div className="text-xs text-slate-500">{item.quantity} x ${Number(item.priceAtPurchase).toLocaleString()}</div></div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center z-10 shadow-lg">
               <div><span className="text-slate-500 text-sm">Método: <span className="font-bold text-slate-700 capitalize">{selectedOrder.paymentMethod}</span></span></div>
               <div className="text-right"><span className="block text-xs text-slate-400 uppercase font-bold tracking-wider">Total</span><span className={`text-2xl font-bold ${selectedOrder.status === 'cancelled' ? 'text-red-600 line-through' : 'text-slate-900'}`}>${Number(selectedOrder.total).toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}