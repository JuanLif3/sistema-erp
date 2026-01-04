import { useEffect, useState } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle, Calendar as CalendarIcon, Filter } from 'lucide-react';

type RangeOption = '7D' | '30D' | '3M' | '1Y' | 'CUSTOM';

export default function SalesChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado del Filtro
  const [range, setRange] = useState<RangeOption>('7D');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [showCustomInputs, setShowCustomInputs] = useState(false);

  useEffect(() => {
    fetchData();
  }, [range, customDates.start, customDates.end]); // Recargar si cambia el rango o fechas custom

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('erp_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      // Calcular Fechas
      const endObj = new Date();
      const startObj = new Date();
      let startStr = '';
      let endStr = endObj.toISOString().split('T')[0];

      if (range === 'CUSTOM') {
        if (!customDates.start || !customDates.end) {
          setLoading(false); return; // Esperar a que el usuario llene ambas fechas
        }
        startStr = customDates.start;
        endStr = customDates.end;
      } else {
        // Lógica de rangos predefinidos
        if (range === '7D') startObj.setDate(endObj.getDate() - 7);
        if (range === '30D') startObj.setDate(endObj.getDate() - 30);
        if (range === '3M') startObj.setMonth(endObj.getMonth() - 3);
        if (range === '1Y') startObj.setFullYear(endObj.getFullYear() - 1);
        startStr = startObj.toISOString().split('T')[0];
      }

      const response = await axios.get(`${API_URL}/api/finances/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: startStr, endDate: endStr }
      });

      // Formatear para el gráfico
      const formattedData = response.data.map((item: any) => ({
        ...item,
        displayDate: new Date(item.date).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
      }));

      setData(formattedData);
    } catch (error) {
      console.error("Error cargando gráfico", error);
    } finally {
      setLoading(false);
    }
  };

  // Botón Helper
  const FilterButton = ({ label, value }: { label: string, value: RangeOption }) => (
    <button 
      onClick={() => {
        setRange(value);
        setShowCustomInputs(value === 'CUSTOM');
      }}
      className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
        range === value 
          ? 'bg-indigo-600 text-white shadow-md' 
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[450px] flex flex-col animate-fade-in">
      {/* Header y Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
           <h3 className="font-bold text-slate-700 flex items-center gap-2">
             <TrendingUp className="text-emerald-500" size={20} />
             Tendencia de Ingresos
           </h3>
           <p className="text-xs text-slate-400">Comportamiento de ventas en el tiempo</p>
        </div>

        <div className="flex flex-col items-end gap-2">
           <div className="flex gap-2">
             <FilterButton label="7 Días" value="7D" />
             <FilterButton label="3 Meses" value="3M" />
             <FilterButton label="1 Año" value="1Y" />
             <FilterButton label="Personalizado" value="CUSTOM" />
           </div>

           {/* Inputs para Rango Personalizado */}
           {showCustomInputs && (
             <div className="flex items-center gap-2 animate-in slide-in-from-top-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <input 
                  type="date" 
                  className="text-xs border rounded p-1 outline-none focus:border-indigo-500"
                  value={customDates.start}
                  onChange={e => setCustomDates({...customDates, start: e.target.value})}
                />
                <span className="text-slate-400">-</span>
                <input 
                  type="date" 
                  className="text-xs border rounded p-1 outline-none focus:border-indigo-500"
                  value={customDates.end}
                  onChange={e => setCustomDates({...customDates, end: e.target.value})}
                />
             </div>
           )}
        </div>
      </div>

      {/* Gráfico */}
      <div className="flex-1 w-full min-h-0">
        {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 10}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 10}} 
                tickFormatter={(value) => `$${value/1000}k`} 
              />
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
                labelStyle={{color: '#64748b', marginBottom: '0.5rem'}}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
                isAnimationActive={true}
                dot={{ r: 3, fill: "#6366f1", strokeWidth: 1, stroke: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg">
            <CalendarIcon size={32} className="mb-2 opacity-30"/>
            <p className="text-sm">No hay datos en este periodo.</p>
          </div>
        )}
      </div>
    </div>
  );
}