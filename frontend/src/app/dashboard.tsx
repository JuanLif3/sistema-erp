import { useState } from 'react';
import axios from 'axios';
import { 
  Users, Package, ShoppingCart, DollarSign, LogOut, Menu, LayoutDashboard, X, ChevronRight, Shield, Wand2, 
  BarChart3, Wallet // Iconos nuevos
} from 'lucide-react';

// Módulos
import ProductsList from './modules/products/ProductsList';
import SalesManager from './modules/sales/SalesManager';
import UsersList from './modules/users/UsersList';
import ExpensesManager from './modules/finances/ExpensesManager'; // 👈 IMPORTAR GASTOS

// Componentes Dashboard
import StatsCards from './components/StatsCards';
import LowStockWidget from './components/LowStockWidget';
import SalesChart from './components/SalesChart';
import CategoryChart from './components/CategoryChart';
import TopProductsChart from './components/TopProductsChart';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  // Roles
  const userRoles = JSON.parse(localStorage.getItem('erp_roles') || '["employee"]');
  const hasRole = (requiredRoles: string[]) => {
    if (userRoles.includes('admin')) return true;
    return requiredRoles.some(r => userRoles.includes(r));
  };

  const getInitialModule = () => {
    if (userRoles.includes('admin')) return 'resumen';
    if (userRoles.includes('manager')) return 'productos';
    return 'pedidos';
  };

  const [activeModule, setActiveModule] = useState(getInitialModule());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 👇 NUEVO: ESTADO PARA PESTAÑAS DE FINANZAS ('reports' | 'expenses')
  const [financeTab, setFinanceTab] = useState('reports');

  // Estado Fechas Reporte
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Descargar PDF
  const handleDownloadReport = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      const response = await axios.get(`http://localhost:3000/api/finances/report?startDate=${dateRange.start}&endDate=${dateRange.end}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_${dateRange.start}_al_${dateRange.end}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) { alert("Error descargando reporte"); }
  };

  const handleSimulate = async () => {
    try {
      const token = localStorage.getItem('erp_token');
      // eslint-disable-next-line no-restricted-globals
      if(confirm("¿Generar datos de prueba?")) {
        await axios.get('http://localhost:3000/api/finances/simulate', { headers: { Authorization: `Bearer ${token}` } });
        window.location.reload();
      }
    } catch (error) { console.error(error); }
  };

  const menuItems = [
    { id: 'resumen', label: 'Resumen General', icon: LayoutDashboard, allowedRoles: ['admin'] },
    { id: 'usuarios', label: 'Usuarios y Accesos', icon: Users, allowedRoles: ['admin'] },
    { id: 'productos', label: 'Inventario', icon: Package, allowedRoles: ['admin', 'manager'] },
    { id: 'pedidos', label: 'Ventas y Pedidos', icon: ShoppingCart, allowedRoles: ['admin', 'employee'] },
    { id: 'finanzas', label: 'Finanzas', icon: DollarSign, allowedRoles: ['admin', 'manager'] },
  ];

  const activeItemInfo = menuItems.find(m => m.id === activeModule);

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">

      {/* SIDEBAR */}
      {isSidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col shadow-2xl`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-600 p-2 rounded-lg"><LayoutDashboard size={24} className="text-white" /></div>
            <span className="text-2xl font-bold tracking-tight">ERP Pro</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X size={24} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {menuItems.filter(item => hasRole(item.allowedRoles)).map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveModule(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                <div className="flex items-center space-x-4"><Icon size={22} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} /> <span className="font-medium">{item.label}</span></div>
                {isActive && <ChevronRight size={18} className="text-brand-200" />}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-950 rounded-xl transition-colors"><LogOut size={20} /> <span className="font-medium">Cerrar Sesión</span></button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white shadow-sm z-10 h-20 flex items-center px-8 relative justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-500"><Menu size={28} /></button>
             <h1 className="text-2xl font-bold text-slate-800">{activeItemInfo?.label || 'Acceso Restringido'}</h1>
          </div>
          <div className="h-10 w-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold">{userRoles[0].charAt(0).toUpperCase()}</div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-7xl mx-auto h-full">

            {/* RESUMEN ADMIN */}
            {activeModule === 'resumen' && hasRole(['admin']) ? (
              <div className="space-y-6 animate-fade-in">
                <StatsCards />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2"> <SalesChart /> </div>
                  <div className="lg:col-span-1"> <LowStockWidget onNavigate={() => setActiveModule('productos')} /> </div>
                </div>
              </div>

            /* USUARIOS */
            ) : activeModule === 'usuarios' && hasRole(['admin']) ? (
              <UsersList />

            /* PRODUCTOS */
            ) : activeModule === 'productos' && hasRole(['admin', 'manager']) ? (
              <ProductsList />

            /* VENTAS POS */
            ) : activeModule === 'pedidos' && hasRole(['admin', 'employee']) ? (
              <SalesManager />

            /* FINANZAS CON PESTAÑAS */
            ) : activeModule === 'finanzas' && hasRole(['admin', 'manager']) ? (
              <div className="space-y-6 animate-fade-in pb-10">
                
                {/* Header Financiero */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   {/* PESTAÑAS */}
                   <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
                      <button 
                        onClick={() => setFinanceTab('reports')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${financeTab === 'reports' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        <BarChart3 size={18} /> Reportes
                      </button>
                      <button 
                        onClick={() => setFinanceTab('expenses')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${financeTab === 'expenses' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        <Wallet size={18} /> Gestión de Gastos
                      </button>
                   </div>

                   {/* Filtros (Solo visibles en Reportes) */}
                   {financeTab === 'reports' && (
                     <div className="flex flex-wrap items-center gap-3">
                       <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                         <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent text-sm text-slate-600 outline-none px-2" />
                         <span className="text-slate-400">-</span>
                         <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent text-sm text-slate-600 outline-none px-2" />
                       </div>
                       <button onClick={handleSimulate} className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-2 rounded-lg text-xs font-bold flex gap-2 items-center"><Wand2 size={14}/> Simular</button>
                       <button onClick={handleDownloadReport} className="bg-slate-900 text-white hover:bg-black px-4 py-2 rounded-lg text-sm font-bold shadow-md flex gap-2 items-center">📄 PDF</button>
                     </div>
                   )}
                </div>

                {/* CONTENIDO CONDICIONAL */}
                {financeTab === 'reports' ? (
                  <>
                    <StatsCards />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2"> <SalesChart /> </div>
                      <div className="lg:col-span-1"> <CategoryChart /> </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2"> <TopProductsChart /> </div>
                      <div className="lg:col-span-1"> <LowStockWidget onNavigate={() => setActiveModule('productos')} /> </div>
                    </div>
                  </>
                ) : (
                  // 👇 AQUÍ SE MUESTRA EL GESTOR DE GASTOS
                  <ExpensesManager />
                )}
              </div>

            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Shield size={64} className="mb-4 text-slate-300" />
                <h2 className="text-xl font-bold">Acceso Restringido</h2>
                <p>No tienes permisos para ver este módulo.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}