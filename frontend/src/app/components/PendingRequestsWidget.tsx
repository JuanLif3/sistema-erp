import { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, XCircle, User, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface RequestOrder {
  id: string;
  total: number;
  cancellationReason: string;
  user: { fullName: string };
  createdAt: string;
}

export default function PendingRequestsWidget() {
  const [requests, setRequests] = useState<RequestOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      const res = await axios.get('http://localhost:3000/api/finances/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // El backend ahora nos manda 'pendingRequests'
      setRequests(res.data.pendingRequests || []);
    } catch (error) { console.error(error); }
  };

  const handleResolve = async (id: string, approved: boolean) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_token');
      await axios.post(`http://localhost:3000/api/orders/${id}/resolve-cancellation`, 
        { approved }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRequests(); // Recargar lista
      alert(approved ? "Solicitud Aprobada (Venta Anulada)" : "Solicitud Rechazada");
    } catch (error) { alert("Error al procesar"); }
    finally { setLoading(false); }
  };

  if (requests.length === 0) return null; // Si no hay nada, no mostramos nada

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden mb-6 animate-fade-in">
      <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex justify-between items-center">
        <h3 className="font-bold text-amber-800 flex items-center gap-2">
          <AlertTriangle size={20}/> Solicitudes de Cancelación ({requests.length})
        </h3>
      </div>
      
      <div className="divide-y divide-slate-100">
        {requests.map((req) => (
          <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              
              {/* Info Principal */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-slate-400">#{req.id.slice(0,8)}</span>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 flex items-center gap-1">
                    <User size={10}/> {req.user?.fullName}
                  </span>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 flex items-center gap-1">
                    <Clock size={10}/> {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {/* Motivo Destacado */}
                <div className="bg-red-50 p-3 rounded-lg border border-red-100 mt-2">
                  <p className="text-sm font-bold text-red-800 mb-1">Motivo:</p>
                  <p className="text-sm text-red-700 italic">"{req.cancellationReason}"</p>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-col items-end justify-center gap-2 min-w-[120px]">
                <div className="text-xl font-bold text-slate-800">${Number(req.total).toLocaleString()}</div>
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => handleResolve(req.id, true)}
                    disabled={loading}
                    className="flex-1 bg-green-100 text-green-700 hover:bg-green-200 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <CheckCircle size={16}/> Aprobar
                  </button>
                  <button 
                    onClick={() => handleResolve(req.id, false)}
                    disabled={loading}
                    className="flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <XCircle size={16}/> Rechazar
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}