import { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, Package, Eye, X, Trash2, AlertTriangle, ArrowLeft, ArrowRight, Filter } from 'lucide-react';

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
  createdAt: string;
  items: OrderItem[];
  user?: { fullName: string };
}

export default function SalesHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  
  // Estados de Filtro y Paginación
  const [activeTab, setActiveTab] = useState<'completed' | 'cancelled'>('completed');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOption, setSortOption] = useState('date-desc'); // Estado del select

  useEffect(() => {
    fetchOrders();
  }, [activeTab, page, sortOption]); // Recargar si cambia algo

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_token');
      
      // Traducir opción de sort a params del backend
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
          order: order
        }
      });
      
      // El backend ahora devuelve { data: [], meta: { ... } }
      setOrders(response.data.data);
      setTotalPages(response.data.meta.lastPage);

    } catch (error) {
      console.error("Error cargando historial", error);
    } finally {
      setLoading(false);
    }
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

  // Cambiar pestaña resetea la página a 1
  const handleTabChange = (tab: 'completed' | 'cancelled') => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header y Controles */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Historial de Transacciones</h2>
          <p className="text-slate-500 text-sm">
            {activeTab === 'completed' ? 'Gestiona las ventas realizadas' : 'Auditoría de ventas canceladas'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
           {/* Selector de Orden */}
           <div className="relative group">
             <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
             <select 
               value={sortOption}
               onChange={(e) => { setSortOption(e.target.value); setPage(1); }}
               className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm appearance-none cursor-pointer hover:bg-slate-50 transition-colors w-full sm:w-auto"
             >
               <option value="date-desc">Más Recientes</option>
               <option value="date-asc">Más Antiguas</option>
               <option value="total-desc">Mayor Importe ($)</option>
               <option value="total-asc">Menor Importe ($)</option>
             </select>
           </div>

           {/* Tabs */}
           <div className="bg-slate-100 p-1 rounded-lg flex space-x-1 shadow-inner">
             <button
               onClick={() => handleTabChange('completed')}
               className={`px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                 activeTab === 'completed' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               <Package size={16} /> <span className="hidden sm:inline">Activas</span>
             </button>
             <button
               onClick={() => handleTabChange('cancelled')}
               className={`px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                 activeTab === 'cancelled' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               <Trash2 size={16} /> <span className="hidden sm:inline">Eliminadas</span>
             </button>
           </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mb-2"></div>
            Cargando...
          </div>
        ) : orders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Package size={48} className="mb-4 text-slate-300" />
            <p>No se encontraron ventas.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4">ID / Fecha</th>
                    <th className="px-6 py-4">Resumen</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-slate-400 mb-1">#{order.id.slice(0, 8)}...</div>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <Calendar size={14} className="text-brand-500" />
                          {new Date(order.createdAt).toLocaleDateString()}
                          <span className="text-slate-400 text-xs hidden sm:inline">
                            {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                            {order.items.reduce((acc, item) => acc + item.quantity, 0)}
                          </span>
                          productos
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-[200px] mt-1">
                          {order.items.map(i => `${i.quantity}x ${i.product?.name || '??'}`).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border inline-block ${
                          order.status === 'completed' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {order.status === 'completed' ? 'Completada' : 'Cancelada'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${activeTab === 'cancelled' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        ${Number(order.total).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => setSelectedOrder(order)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Ver Detalle">
                            <Eye size={18} />
                          </button>
                          {activeTab === 'completed' && (
                            <button onClick={() => requestDelete(order.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancelar Venta">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 👇 PAGINACIÓN */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-slate-500">
                Página <span className="font-bold text-slate-700">{page}</span> de <span className="font-bold text-slate-700">{totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={16} /> Anterior
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  Siguiente <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN (Eliminar) */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">¿Cancelar esta venta?</h3>
              <p className="text-sm text-slate-500 mb-6">El stock será devuelto al inventario.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setOrderToDelete(null)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Cancelar</button>
                <button onClick={confirmDelete} className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium shadow-md">Sí, Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE (Visualización) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className={`px-6 py-4 flex justify-between items-center ${selectedOrder.status === 'cancelled' ? 'bg-red-50' : 'bg-slate-900'}`}>
              <div>
                <h3 className={`font-bold text-lg ${selectedOrder.status === 'cancelled' ? 'text-red-700' : 'text-white'}`}>
                  {selectedOrder.status === 'cancelled' ? 'Venta Cancelada' : 'Detalle de Venta'}
                </h3>
                <p className={`text-xs font-mono ${selectedOrder.status === 'cancelled' ? 'text-red-400' : 'text-slate-400'}`}>ID: {selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className={selectedOrder.status === 'cancelled' ? 'text-red-400' : 'text-slate-400 hover:text-white'}><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-3">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-brand-50 p-2 rounded-lg text-brand-600"><Package size={20} /></div>
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{item.product?.name || 'Desconocido'}</div>
                      <div className="text-xs text-slate-500 font-mono">{item.product?.sku}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800 text-sm">${Number(item.priceAtPurchase * item.quantity).toLocaleString()}</div>
                    <div className="text-xs text-slate-500">{item.quantity} x ${Number(item.priceAtPurchase).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center z-10">
              <span className="text-slate-500 text-sm">Total Pagado</span>
              <span className={`text-2xl font-bold ${selectedOrder.status === 'cancelled' ? 'text-red-600 line-through' : 'text-slate-900'}`}>
                ${Number(selectedOrder.total).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}