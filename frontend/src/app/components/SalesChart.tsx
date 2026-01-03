import { useEffect, useState } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';

export default function SalesChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      // Pedimos rango de 30 días explícito para asegurar datos
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startString = startDate.toISOString().split('T')[0];

      const response = await axios.get(`${API_URL}/api/finances/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: startString, endDate: endDate }
      });

      // Formatear fechas para que se vean bonitas (DD/MM)
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

  if (loading) return <div className="h-64 bg-slate-50 rounded-xl animate-pulse"></div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <TrendingUp className="text-emerald-500" size={20} />
          Tendencia de Ingresos
        </h3>
      </div>

      <div className="flex-1 w-full min-h-0">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}} 
                tickFormatter={(value) => `$${value/1000}k`} 
              />
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
                // 👇 Esto asegura que se vea un punto si solo hay un dato
                isAnimationActive={true}
                dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <AlertCircle size={32} className="mb-2 opacity-50"/>
            <p>No hay datos suficientes para mostrar tendencias.</p>
          </div>
        )}
      </div>
    </div>
  );
}