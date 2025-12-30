import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale'; // Para fechas en español

export default function SalesChart() {
  const [data, setData] = useState([]);
  const [range, setRange] = useState('7'); // Filtro por defecto: 7 días

  useEffect(() => {
    loadData();
  }, [range]); // Se recarga cuando cambias el rango

  const loadData = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      const response = await axios.get(`http://localhost:3000/api/finances/history?days=${range}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      console.error("Error cargando gráfico", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      {/* Cabecera con Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 sm:mb-0">
          Tendencia de Ventas
        </h3>
        
        {/* Botones de Filtro */}
        <div className="bg-gray-100 p-1 rounded-lg flex space-x-1">
          {[
            { label: '7 Días', value: '7' },
            { label: '30 Días', value: '30' },
            { label: '3 Meses', value: '90' },
            { label: '1 Año', value: '365' },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setRange(btn.value)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                range === btn.value 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* El Gráfico */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(str) => format(parseISO(str), 'dd MMM', { locale: es })}
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value/1000}k`} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
              labelFormatter={(label) => format(parseISO(label), 'EEEE dd MMMM', { locale: es })}
            />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="#2563eb" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorTotal)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}