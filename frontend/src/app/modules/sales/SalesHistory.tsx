import { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, DollarSign, Package, Eye, X } from 'lucide-react';

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
}

export default function SalesHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      const response = await axios.get('http://localhost:3000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Error cargando historial", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Historial de Transacciones</h2>
          <p className="text-slate-500 text-sm">Registro completo de movimientos</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium shadow-sm">
          Total Registros: {orders.length}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Cargando ventas...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No hay ventas registradas aún.</div>
        ) : (
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
                      <div className="font-mono text-xs text-slate-400 mb-1">
                        #{order.id.slice(0, 8)}...
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Calendar size={14} className="text-brand-500" />
                        {new Date(order.createdAt).toLocaleDateString()} 
                        <span className="text-slate-400 text-xs">
                          {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500">
                        {order.items.length} productos vendidos
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[200px]">
                        {order.items.map(i => i.product?.name).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-medium capitalize">
                        {order.status === 'completed' ? 'Completada' : order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">
                      ${Number(order.total).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Ver Detalle"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE DETALLE */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Detalle de Venta</h3>
                <p className="text-slate-400 text-xs font-mono">ID: {selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto bg-slate-50">
              <div className="space-y-3">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-brand-50 p-2 rounded-lg text-brand-600">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800 text-sm">
                          {item.product?.name || 'Producto Eliminado'}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {item.product?.sku}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800 text-sm">
                        ${Number(item.priceAtPurchase * item.quantity).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.quantity} x ${Number(item.priceAtPurchase).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center">
              <span className="text-slate-500 text-sm">Fecha: {new Date(selectedOrder.createdAt).toLocaleString()}</span>
              <div className="text-right">
                <span className="block text-xs text-slate-400 uppercase font-bold">Total Pagado</span>
                <span className="text-xl font-bold text-slate-900">${Number(selectedOrder.total).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}