import { useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SalesChart() {
  const [data, setData] = useState([]);
  
  // Modo de filtro: 'preset' (botones) o 'custom' (fechas)
  const [filterMode, setFilterMode] = useState<'preset' | 'custom'>('preset');
  const [range, setRange] = useState('30'); // Días por defecto
  const [customRange, setCustomRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, [range, filterMode]); // Recargar si cambia el preset o el modo

  const loadData = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      let url = 'http://localhost:3000/api/finances/history';
      
      // Construimos la URL según el modo
      if (filterMode === 'preset') {
        url += `?days=${range}`;
      } else {
        url += `?startDate=${customRange.start}&endDate=${customRange.end}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      console.error("Error cargando gráfico", error);
    }
  };

  // Manejar cambio manual de fechas
  const handleCustomFilter = () => {
    setFilterMode('custom');
    loadData(); // Forzar recarga con las fechas nuevas
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
      {/* Cabecera con Controles */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <h3 className="text-lg font-bold text-slate-800">
          Tendencia de Ingresos
        </h3>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Botones Rápidos */}
          <div className="bg-slate-100 p-1 rounded-lg flex space-x-1">
            {[
              { label: '7D', value: '7' },
              { label: '30D', value: '30' },
              { label: '3M', value: '90' },
              { label: '1A', value: '365' },
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => { setRange(btn.value); setFilterMode('preset'); }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  filterMode === 'preset' && range === btn.value 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

          {/* Selector de Fechas Personalizado */}
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={customRange.start}
              onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
              className={`border rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-500 ${filterMode === 'custom' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-600'}`}
            />
            <span className="text-slate-400 text-xs">-</span>
            <input 
              type="date" 
              value={customRange.end}
              onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
              className={`border rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-500 ${filterMode === 'custom' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-600'}`}
            />
            <button 
              onClick={handleCustomFilter}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all border ${
                filterMode === 'custom'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Área del Gráfico */}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(str) => {
                try { return format(parseISO(str), 'dd MMM', { locale: es }); } 
                catch { return str; }
              }}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis 
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
              labelFormatter={(label) => {
                try { return format(parseISO(label), 'EEEE dd MMMM yyyy', { locale: es }); }
                catch { return label; }
              }}
            />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorTotal)" 
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}