import { useState, useEffect } from 'react';
import POS from './POS';
import SalesHistory from './SalesHistory';
import { ShoppingCart, History, TrendingUp } from 'lucide-react';

export default function SalesManager() {
  const [activeTab, setActiveTab] = useState('pos');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // 👇 CORRECCIÓN: Leer de sessionStorage
    const roles = JSON.parse(sessionStorage.getItem('erp_roles') || '[]');
    
    if (roles.includes('admin')) setUserRole('admin');
    else if (roles.includes('manager')) setUserRole('manager');
    else setUserRole('employee');
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Simplificado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Ventas y Pedidos</h2>
          <p className="text-slate-500 text-sm">Gestiona transacciones y revisa el historial</p>
        </div>
        
        {/* Navegación de Pestañas */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'pos' 
                ? 'bg-brand-600 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShoppingCart size={18} />
            Nueva Venta (POS)
          </button>
          
          <div className="w-px bg-slate-200 my-2 mx-1"></div>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history' 
                ? 'bg-brand-600 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <History size={18} />
            Historial de Ventas
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="min-h-[500px]">
        {activeTab === 'pos' ? (
          <POS />
        ) : (
          <SalesHistory userRole={userRole} />
        )}
      </div>
    </div>
  );
}