import { useState } from 'react';
import axios from 'axios';
import { 
  Users, Package, ShoppingCart, DollarSign, LogOut, Menu, LayoutDashboard, X, ChevronRight, Shield, Wand2 
} from 'lucide-react';

// Módulos y Componentes
import ProductsList from './modules/products/ProductsList';
import SalesManager from './modules/sales/SalesManager';
import StatsCards from './components/StatsCards';
import LowStockWidget from './components/LowStockWidget';
import SalesChart from './components/SalesChart';
import UsersList from './modules/users/UsersList';
import CategoryChart from './components/CategoryChart';
import TopProductsChart from './components/TopProductsChart';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeModule, setActiveModule] = useState('resumen');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 👇 ESTADO PARA FECHAS (Por defecto: últimos 30 días)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const userRoles = JSON.parse(localStorage.getItem('erp_roles') || '["employee"]');

  const hasRole = (requiredRoles: string[]) => {
    if (userRoles.includes('admin')) return true;
    return requiredRoles.some(r => userRoles.includes(r));
  };

  // 👇 DESCARGAR PDF CON FECHAS
  const handleDownloadReport = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      // Enviamos las fechas seleccionadas al backend
      const response = await axios.get(`http://localhost:3000/api/finances/report?startDate=${dateRange.start}&endDate=${dateRange.end}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Ventas_${dateRange.start}_${dateRange.end}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error descargando reporte", error);
      alert("No se pudo generar el reporte.");
    }
  };

  const handleSimulate = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      // eslint-disable-next-line no-restricted-globals
      if(confirm("¿Generar datos de prueba aleatorios?")) {
        await axios.get('http://localhost:3000/api/finances/simulate', {
          headers: { Authorization: `Bearer ${token}` }
        });
        window.location.reload();
      }
    } catch (error) { console.error(error); }
  };

  const menuItems = [
    { id: 'resumen', label: 'Resumen General', icon: LayoutDashboard, allowedRoles: ['admin', 'manager', 'employee'] },
    { id: 'usuarios', label: 'Usuarios y Accesos', icon: Users, allowedRoles: ['admin'] },
    { id: 'productos', label: 'Inventario', icon: Package, allowedRoles: ['admin', 'manager'] },
    { id: 'pedidos', label: 'Ventas y Pedidos', icon: ShoppingCart, allowedRoles: ['admin', 'employee'] },
    { id: 'finanzas', label: 'Finanzas', icon: DollarSign, allowedRoles: ['admin', 'manager'] },
  ];

  const activeItemInfo = menuItems.find(m => m.id === activeModule);

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      
      {/* SIDEBAR (Igual que antes) */}
      {isSidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        <div className="flex items-center p-6 border-b border-slate-800 gap-3">
          <div className="bg-brand-600 p-2 rounded-lg"><LayoutDashboard size={24} /></div>
          <span className="text-2xl font-bold">ERP Pro</span>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.filter(item => hasRole(item.allowedRoles)).map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveModule(item.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <div className="flex items-center gap-4"><Icon size={22} /> <span>{item.label}</span></div>
                {isActive && <ChevronRight size={18} />}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800 mt-auto">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-950 rounded-xl"><LogOut size={20} /> Cerrar Sesión</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white shadow-sm h-20 flex items-center px-8 justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-500"><Menu size={28} /></button>
            <h1 className="text-2xl font-bold text-slate-800">{activeItemInfo?.label}</h1>
          </div>
          <div className="h-10 w-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold">
            {userRoles[0].charAt(0).toUpperCase()}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-7xl mx-auto">
            
            {activeModule === 'resumen' && (
              <div className="space-y-6 animate-fade-in">
                <StatsCards />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2"><SalesChart /></div>
                  <div className="lg:col-span-1"><LowStockWidget onNavigate={() => setActiveModule('productos')} /></div>
                </div>
              </div>
            )}

            {activeModule === 'usuarios' && <UsersList />}
            {activeModule === 'productos' && <ProductsList />}
            {activeModule === 'pedidos' && <SalesManager />}

            {/* MÓDULO FINANZAS ACTUALIZADO */}
            {activeModule === 'finanzas' && hasRole(['admin', 'manager']) ? (
              <div className="space-y-6 animate-fade-in pb-10">
                
                {/* Header con Controles de Fecha */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                   <div>
                     <h2 className="text-xl font-bold text-slate-700">Panel Financiero</h2>
                     <p className="text-sm text-slate-500">Selecciona un rango para generar el reporte</p>
                   </div>
                   
                   <div className="flex flex-wrap items-center gap-3">
                     {/* Inputs de Fecha */}
                     <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                       <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} 
                         className="bg-transparent text-sm text-slate-600 outline-none px-2" />
                       <span className="text-slate-400">-</span>
                       <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} 
                         className="bg-transparent text-sm text-slate-600 outline-none px-2" />
                     </div>

                     <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                     {/* Botones de Acción */}
                     <button onClick={handleSimulate} className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                       <Wand2 size={16} /> Simular
                     </button>

                     <button onClick={handleDownloadReport} className="bg-slate-900 text-white hover:bg-black px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-all flex items-center gap-2">
                       📄 Descargar PDF Completo
                     </button>
                   </div>
                </div>

                {/* Dashboard Visual */}
                <StatsCards />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2"> <SalesChart /> </div>
                  <div className="lg:col-span-1"> <CategoryChart /> </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2"> <TopProductsChart /> </div>
                  <div className="lg:col-span-1"> <LowStockWidget onNavigate={() => setActiveModule('productos')} /> </div>
                </div>
              </div>
            ) : null}

          </div>
        </main>
      </div>
    </div>
  );
}