import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Calendar, Eye, Trash2, AlertTriangle, 
  Banknote, CreditCard, Smartphone, User as UserIcon, X, 
  MessageSquare, CheckCircle, XCircle 
} from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  product?: { name: string; sku: string };
}
interface Order {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  cancellationStatus?: string; 
  cancellationReason?: string;
  createdAt: string;
  items: OrderItem[];
  user?: { fullName: string; email: string };
}

export default function SalesHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados UI
  const [activeTab, setActiveTab] = useState<'completed' | 'cancelled'>('completed');
  const [page, setPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modales
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [orderToRequest, setOrderToRequest] = useState<string | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const [reasonModalData, setReasonModalData] = useState<{open: boolean, text: string, id: string}>({open: false, text: '', id: ''});

  useEffect(() => {
    const rolesStr = localStorage.getItem('erp_roles');
    if (rolesStr) {
      try {
        const roles = JSON.parse(rolesStr);
        setIsAdmin(roles.includes('admin') || roles.includes('super-admin'));
      } catch (e) { setIsAdmin(false); }
    }
    fetchOrders();
  }, [activeTab, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: activeTab, page, limit: 10 }
      });
      if(response.data && response.data.data) {
        setOrders(response.data.data);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  // --- LÓGICA DE ACCIONES ---

  const submitRequest = async () => {
    if (!requestReason.trim()) return alert("Debes escribir un motivo");
    try {
      const token = localStorage.getItem('erp_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.post(`${API_URL}/api/orders/${orderToRequest}/request-cancellation`, 
        { reason: requestReason }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Solicitud enviada al administrador.');
      setRequestModalOpen(false); setRequestReason(''); fetchOrders();
    } catch (error) { alert('Error al enviar solicitud'); }
  };

  const resolveRequest = async (orderId: string, approved: boolean) => {
    if(!confirm(approved ? '¿Aprobar anulación y devolver stock?' : '¿Rechazar solicitud y mantener venta?')) return;
    try {
      const token = localStorage.getItem('erp_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.post(`${API_URL}/api/orders/${orderId}/resolve-cancellation`, 
        { approved }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReasonModalData({open: false, text: '', id: ''}); 
      fetchOrders(); 
    } catch (error) { alert('Error al procesar solicitud'); }
  };

  const confirmDirectDelete = async () => {
    if (!orderToDelete) return;
    try {
      const token = localStorage.getItem('erp_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.delete(`${API_URL}/api/orders/${orderToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrderToDelete(null); fetchOrders();
    } catch (error) { alert('Error al anular'); }
  };

  const getPaymentIcon = (method: string) => {
    switch(method) {
      case 'card': return <CreditCard size={14} className="text-blue-500"/>;
      case 'transfer': return <Smartphone size={14} className="text-purple-500"/>;
      default: return <Banknote size={14} className="text-emerald-500"/>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Historial de Ventas</h2>
          <p className="text-sm text-slate-500">Gestiona transacciones y solicitudes</p>
        </div>
        <div className="bg-slate-100 p-1 rounded-lg flex space-x-1 shadow-inner">
           <button onClick={() => {setActiveTab('completed'); setPage(1)}} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'completed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Activas</button>
           <button onClick={() => {setActiveTab('cancelled'); setPage(1)}} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'cancelled' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>Anuladas</button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        {loading ? (
            <div className="p-10 text-center text-slate-400">Cargando...</div>
        ) : orders.length === 0 ? (
            <div className="p-10 text-center text-slate-400">No hay ventas registradas.</div>
        ) : (
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b">
            <tr>
              <th className="p-4">Fecha / ID</th>
              <th className="p-4">Resumen</th>
              <th className="p-4 hidden md:table-cell">Vendedor</th>
              <th className="p-4 text-center">Pago</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map(order => {
              const isPending = order.cancellationStatus === 'pending';
              const rowClass = isPending ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-slate-50';

              return (
                <tr key={order.id} className={`${rowClass} transition-colors`}>
                  <td className="p-4">
                    <div className="font-bold text-slate-700">{new Date(order.createdAt).toLocaleDateString()}</div>
                    <div className="text-xs text-slate-400 font-mono">#{order.id.slice(0,6)}</div>
                    {isPending && <span className="md:hidden mt-1 inline-block text-[10px] bg-amber-200 text-amber-800 px-1 rounded">Solicitud</span>}
                  </td>
                  
                  <td className="p-4">
                    <div className="text-xs text-slate-500 font-medium">
                      {order.items?.length || 0} productos
                    </div>
                    {isPending && isAdmin && (
                      <div className="text-[10px] text-amber-700 font-bold flex items-center gap-1 mt-1">
                        <AlertTriangle size={10}/> Solicitud de Anulación
                      </div>
                    )}
                  </td>

                  <td className="p-4 hidden md:table-cell">
                     <div className="flex items-center gap-2">
                       <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center"><UserIcon size={12}/></div>
                       <span className="text-slate-600 truncate max-w-[100px]">{order.user?.fullName || 'Sistema'}</span>
                     </div>
                  </td>

                  <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 border text-xs capitalize text-slate-600">
                          {getPaymentIcon(order.paymentMethod)} <span className="hidden lg:inline">{order.paymentMethod}</span>
                      </div>
                  </td>

                  <td className="p-4 text-right font-bold text-slate-800">
                      ${Number(order.total).toLocaleString()}
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button onClick={() => setSelectedOrder(order)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Ver Detalle"><Eye size={18}/></button>
                      
                      {activeTab === 'completed' && (
                          isPending ? (
                              isAdmin ? (
                                  <button onClick={() => setReasonModalData({open: true, text: order.cancellationReason || '', id: order.id})} className="p-2 text-amber-600 bg-amber-100 rounded-lg hover:bg-amber-200" title="Ver Motivo"><MessageSquare size={18}/></button>
                              ) : (
                                  <span className="text-[10px] px-2 py-1 bg-amber-100 text-amber-700 rounded border border-amber-200 font-bold">En Revisión</span>
                              )
                          ) : (
                              <button 
                                  onClick={() => isAdmin ? setOrderToDelete(order.id) : (setOrderToRequest(order.id), setRequestModalOpen(true))} 
                                  className={`p-2 rounded-lg text-white shadow-sm transition-all ${isAdmin ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-500 hover:bg-slate-600'}`}
                                  title={isAdmin ? "Anular Directamente" : "Solicitar Anulación"}
                              >
                                  {isAdmin ? <Trash2 size={18}/> : <MessageSquare size={18}/>}
                              </button>
                          )
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>

      {/* --- MODALES --- */}

      {reasonModalData.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in">
                <div className="flex items-center gap-2 text-amber-600 mb-4">
                    <AlertTriangle/> <h3 className="font-bold text-lg">Solicitud de Anulación</h3>
                </div>
                <div className="bg-slate-50 p-3 rounded border text-sm text-slate-700 italic mb-6">
                    "{reasonModalData.text}"
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => resolveRequest(reasonModalData.id, false)} className="flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"><XCircle size={18}/> Rechazar</button>
                    <button onClick={() => resolveRequest(reasonModalData.id, true)} className="flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow"><CheckCircle size={18}/> Aprobar</button>
                </div>
                <button onClick={() => setReasonModalData({open:false, text:'', id:''})} className="mt-4 text-xs text-slate-400 hover:text-slate-600 w-full text-center">Cerrar sin acción</button>
            </div>
        </div>
      )}

      {requestModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
                  <h3 className="font-bold text-lg mb-2">Solicitar Anulación</h3>
                  <p className="text-sm text-slate-500 mb-3">El administrador deberá aprobar esta acción.</p>
                  <textarea className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4 text-sm" rows={3} placeholder="Motivo (Ej: Error en cobro...)" value={requestReason} onChange={e => setRequestReason(e.target.value)} />
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setRequestModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                      <button onClick={submitRequest} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded shadow">Enviar</button>
                  </div>
              </div>
          </div>
      )}

      {orderToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
              <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600"><Trash2/></div>
                  <h3 className="font-bold text-lg">¿Anular venta inmediatamente?</h3>
                  <p className="text-sm text-slate-500 mb-6">El stock se devolverá y la venta pasará a historial de anuladas.</p>
                  <div className="flex gap-3 justify-center">
                      <button onClick={() => setOrderToDelete(null)} className="px-4 py-2 bg-slate-100 rounded text-slate-700">Cancelar</button>
                      <button onClick={confirmDirectDelete} className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700">Sí, Anular</button>
                  </div>
              </div>
          </div>
      )}

       {selectedOrder && (
         <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col">
               <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                  <h3 className="font-bold">Detalle #{selectedOrder.id.slice(0,6)}</h3>
                  <button onClick={() => setSelectedOrder(null)}><X/></button>
               </div>
               <div className="p-4 overflow-y-auto flex-1 bg-slate-50">
                  {selectedOrder.items.map(item => (
                     <div key={item.id} className="flex justify-between py-3 border-b border-slate-200 last:border-0">
                        <div>
                            <div className="font-medium text-slate-700 text-sm">{item.product?.name || 'Item'}</div>
                            <div className="text-xs text-slate-500">Cant: {item.quantity}</div>
                        </div>
                        <span className="font-bold text-slate-700">${(item.quantity * item.priceAtPurchase).toLocaleString()}</span>
                     </div>
                  ))}
               </div>
               <div className="p-4 bg-white border-t flex justify-between items-center">
                   <span className="text-sm text-slate-500">Total Venta</span>
                   <span className="text-xl font-bold text-slate-900">${Number(selectedOrder.total).toLocaleString()}</span>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}