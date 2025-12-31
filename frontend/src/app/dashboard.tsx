import { useState } from 'react';
import axios from 'axios'; // <--- IMPORTANTE
import { 
  Users, Package, ShoppingCart, DollarSign, LogOut, Menu, LayoutDashboard, X, ChevronRight, Shield
} from 'lucide-react';

// Módulos
import ProductsList from './modules/products/ProductsList';
import SalesManager from './modules/sales/SalesManager';
import StatsCards from './components/StatsCards';
import LowStockWidget from './components/LowStockWidget';
import SalesChart from './components/SalesChart';
import UsersList from './modules/users/UsersList';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeModule, setActiveModule] = useState('resumen');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
});

  // 1. LEER ROLES
  const userRoles = JSON.parse(localStorage.getItem('erp_roles') || '["employee"]');

  // 2. SEGURIDAD DE ROLES
  const hasRole = (requiredRoles: string[]) => {
    if (userRoles.includes('admin')) return true;
    return requiredRoles.some(r => userRoles.includes(r));
  };

  // 3. FUNCIÓN DE DESCARGA PDF
const handleDownloadReport = async () => {
  try {
    const token = localStorage.getItem('erp_token');
    // 👇 ENVIAMOS LAS FECHAS COMO PARÁMETROS
    const response = await axios.get(`http://localhost:3000/api/finances/report?startDate=${dateRange.start}&endDate=${dateRange.end}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    // Nombre del archivo con las fechas
    link.setAttribute('download', `Reporte_${dateRange.start}_al_${dateRange.end}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Error descargando reporte", error);
    alert("No se pudo generar el reporte.");
  }
};

  // 4. CONFIGURACIÓN DEL MENÚ
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

      {/* SIDEBAR */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:shadow-none
      `}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-600 p-2 rounded-lg"><LayoutDashboard size={24} className="text-white" /></div>
            <span className="text-2xl font-bold tracking-tight">ERP Pro</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Principal</p>
          {menuItems.filter(item => hasRole(item.allowedRoles)).map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveModule(item.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <Icon size={22} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={18} className="text-brand-200" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-950 hover:text-red-300 rounded-xl transition-colors">
            <LogOut size={20} /> <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white shadow-sm z-10 h-20 flex items-center px-8 relative">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-500 mr-4 p-2"><Menu size={28} /></button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">{activeItemInfo?.label}</h1>
            <p className="text-sm text-slate-500 hidden sm:block">Panel de Control - {userRoles.includes('admin') ? 'Administrador' : 'Empleado'}</p>
          </div>
          <div className="flex items-center space-x-4 pl-8 border-l border-gray-200">
             <div className="h-10 w-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold">
               {userRoles[0].charAt(0).toUpperCase()}
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-8 relative">
          <div className="max-w-7xl mx-auto h-full">

            {/* MÓDULO RESUMEN */}
            {activeModule === 'resumen' && hasRole(['admin', 'manager', 'employee']) ? (
              <div className="space-y-6 animate-fade-in">
                <StatsCards />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2"> <SalesChart /> </div>
                  <div className="lg:col-span-1"> <LowStockWidget onNavigate={() => setActiveModule('productos')} /> </div>
                </div>
              </div>

            /* MÓDULO USUARIOS */
            ) : activeModule === 'usuarios' && hasRole(['admin']) ? (
              <UsersList />

            /* MÓDULO PRODUCTOS */
            ) : activeModule === 'productos' && hasRole(['admin', 'manager']) ? (
              <ProductsList />

            /* MÓDULO VENTAS */
            ) : activeModule === 'pedidos' && hasRole(['admin', 'employee']) ? (
              <SalesManager />

            /* MÓDULO FINANZAS (CON BOTÓN DE REPORTE) */
) : activeModule === 'finanzas' && hasRole(['admin', 'manager']) ? (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
               <div>
                 <h2 className="text-xl font-bold text-slate-700">Reporte Financiero</h2>
                 <p className="text-sm text-slate-500">Selecciona el rango de fechas para el PDF</p>
               </div>

               <div className="flex items-center gap-3">
                 {/* Input DESDE */}
                 <div className="flex flex-col">
                   <label className="text-xs font-semibold text-slate-500 mb-1">Desde</label>
                   <input 
                     type="date" 
                     value={dateRange.start}
                     onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                     className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                   />
                 </div>

                 {/* Input HASTA */}
                 <div className="flex flex-col">
                   <label className="text-xs font-semibold text-slate-500 mb-1">Hasta</label>
                   <input 
                     type="date" 
                     value={dateRange.end}
                     onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                     className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                   />
                 </div>

                 {/* Botón Descargar */}
                 <button 
                   onClick={handleDownloadReport}
                   className="bg-slate-900 text-white hover:bg-black px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-all flex items-center gap-2 h-fit mt-auto"
                 >
                   📄 Descargar PDF
                 </button>
               </div>
            </div>

            <StatsCards />
            <SalesChart />
          </div>

            ) : (
              // ACCESO DENEGADO
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