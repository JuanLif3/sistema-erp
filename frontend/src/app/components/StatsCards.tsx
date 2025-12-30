import { useEffect, useState } from 'react';
import axios from 'axios';
import { DollarSign, ShoppingBag, TrendingUp, Calendar } from 'lucide-react';

export default function StatsCards() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    todayOrders: 0,
    lastUpdated: new Date()
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('erp_token');
        const response = await axios.get('http://localhost:3000/api/finances/summary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (error) {
        console.error("Error cargando estadísticas", error);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Ventas Totales',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-blue-500',
      description: 'Ingresos históricos'
    },
    {
      title: 'Pedidos Hoy',
      value: stats.todayOrders,
      icon: Calendar,
      color: 'bg-emerald-500',
      description: 'Transacciones del día'
    },
    {
      title: 'Total Pedidos',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'bg-purple-500',
      description: 'Volumen acumulado'
    },
    {
      title: 'Ticket Promedio',
      value: stats.totalOrders > 0 ? `$${Math.round(stats.totalRevenue / stats.totalOrders).toLocaleString()}` : '$0',
      icon: TrendingUp,
      color: 'bg-amber-500',
      description: 'Promedio por venta'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
      {cards.map((card, index) => (
        <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">{card.title}</p>
              <h3 className="text-2xl font-bold text-slate-800">{card.value}</h3>
            </div>
            <div className={`${card.color} p-3 rounded-xl text-white shadow-lg shadow-blue-500/20 opacity-90`}>
              <card.icon size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-400">
            <span>{card.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}