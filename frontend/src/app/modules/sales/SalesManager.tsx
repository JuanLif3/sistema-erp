import { useState } from 'react';
import { ShoppingCart, History } from 'lucide-react';
import POS from './POS';
import SalesHistory from './SalesHistory';

export default function SalesManager() {
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  return (
    <div className="h-full flex flex-col">
      {/* Barra de Pestañas Superior */}
      <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 mb-6 w-fit mx-auto sm:mx-0">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'pos'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <ShoppingCart size={18} />
          Terminal POS
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <History size={18} />
          Historial de Ventas
        </button>
      </div>

      {/* Contenido de la Pestaña */}
      <div className="flex-1">
        {activeTab === 'pos' ? <POS /> : <SalesHistory />}
      </div>
    </div>
  );
}