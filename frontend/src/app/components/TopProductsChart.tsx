import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import axios from 'axios';

export default function TopProductsChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('erp_token');
        const res = await axios.get('http://localhost:3000/api/finances/top-products', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Formateamos para que el gráfico entienda
        const formatted = res.data.map((d: any) => ({ 
          name: d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name, // Acortar nombres largos
          full_name: d.name,
          revenue: Number(d.revenue) 
        }));
        setData(formatted);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Productos Estrella (Top 5)</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={100} 
              tick={{fill: '#64748b', fontSize: 12}} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{fill: '#f1f5f9'}}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ingresos']}
              labelFormatter={(label, payload) => payload[0]?.payload.full_name} // Mostrar nombre completo al pasar mouse
              contentStyle={{ borderRadius: '8px', border: 'none' }}
            />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}