import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']; // Colores llamativos

export default function CategoryChart() {
  const [data, setData] = useState([]);

useEffect(() => {
    const fetchData = async () => {
      try {
        // 👇 1. Definimos la URL base (Si no encuentra la variable, usa localhost por defecto)
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        const token = localStorage.getItem('erp_token');
        
        // 👇 2. Usamos esa variable en la petición (fíjate en las comillas invertidas ` `)
        const res = await axios.get(`${apiUrl}/api/finances/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Convertimos el valor string a número
        const formatted = res.data.map((d: any) => ({ ...d, value: Number(d.value) }));
        setData(formatted);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Ventas por Categoría</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60} // Efecto Dona
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `$${value.toLocaleString()}`}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}