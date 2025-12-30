import { useState } from 'react';
import { 
  Users, Package, ShoppingCart, DollarSign, LogOut, Menu, LayoutDashboard, X, ChevronRight
} from 'lucide-react';

// Importamos todos los módulos
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

  const menuItems = [
    { id: 'resumen', label: 'Resumen General', icon: LayoutDashboard },
    { id: 'usuarios', label: 'Usuarios y Accesos', icon: Users },
    { id: 'productos', label: 'Inventario', icon: Package },
    { id: 'pedidos', label: 'Ventas y Pedidos', icon: ShoppingCart },
    { id: 'finanzas', label: 'Finanzas', icon: DollarSign },
  ];

  const activeItemInfo = menuItems.find(m => m.id === activeModule);

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">

      {/* === SIDEBAR === */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:shadow-none
      `}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-600 p-2 rounded-lg">
               <LayoutDashboard size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">ERP Pro</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Principal</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveModule(item.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <Icon size={22} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={18} className="text-brand-200" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-950/50 hover:text-red-300 rounded-xl transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* === ÁREA PRINCIPAL === */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <header className="bg-white shadow-sm z-10 h-20 flex items-center px-8 relative">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-brand-600 mr-4 p-2 -ml-2 rounded-lg hover:bg-gray-100">
            <Menu size={28} />
          </button>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">
              {activeItemInfo?.label}
            </h1>
            <p className="text-sm text-slate-500 hidden sm:block">
              Resumen general de tu negocio
            </p>
          </div>

          <div className="flex items-center space-x-4 pl-8 border-l border-gray-200">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-slate-800">Administrador</p>
              <p className="text-xs text-slate-500">admin@erp.com</p>
            </div>
            <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold shadow-lg border-2 border-white">
              AD
            </div>
          </div>
        </header>

        {/* AQUÍ ES DONDE CAMBIA TODO EL CONTENIDO DINÁMICO */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-8 relative">
          <div className="max-w-7xl mx-auto h-full">
            
            {/* 1. MÓDULO RESUMEN (HOME) */}
            {activeModule === 'resumen' ? (
              <div className="space-y-6 animate-fade-in">
                {/* Tarjetas Superiores */}
                <StatsCards />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Gráfico Principal (Ocupa 2 columnas) */}
                  <div className="lg:col-span-2">
                    <SalesChart />
                  </div>

                  {/* Widget Lateral (Ocupa 1 columna) */}
                  <div className="lg:col-span-1">
                    <LowStockWidget onNavigate={() => setActiveModule('productos')} />
                  </div>
                </div>
              </div>

            /* 2. MÓDULO PRODUCTOS */
            ) : activeModule === 'productos' ? (
              <ProductsList />

            /* 3. MÓDULO VENTAS/PEDIDOS */
            ) : activeModule === 'pedidos' ? (
              <SalesManager />

            /* 4. MÓDULO FINANZAS */
            ) : activeModule === 'finanzas' ? (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                   <h2 className="text-xl font-bold text-slate-700">Reporte Financiero</h2>
                   <button className="text-brand-600 text-sm font-medium hover:underline">Descargar Reporte</button>
                </div>
                <StatsCards />
                <SalesChart />
              </div>

            /* 5. MÓDULO USUARIOS (Aún pendiente) */
            ) : activeModule === 'usuarios' ? (
              <UsersList />
            ) : null}

          </div>
        </main>
      </div>
    </div>
  );
}