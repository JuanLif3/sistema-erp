import { useState } from 'react';
import { 
  Users, Package, ShoppingCart, DollarSign, LogOut, Menu, LayoutDashboard, X, ChevronRight
} from 'lucide-react';
import ProductsList from './modules/products/ProductsList';

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
    // Contenedor Principal: Altura completa, fondo gris claro, fuente profesional
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">

      {/* === SIDEBAR (Barra Lateral) === */}
      {/* Overlay oscuro para móvil cuando el menú está abierto */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* El Sidebar en sí */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:shadow-none
      `}>
        {/* Logo del Sidebar */}
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

        {/* Navegación */}
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

        {/* Botón Salir */}
        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-950/50 hover:text-red-300 rounded-xl transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* === ÁREA PRINCIPAL DE CONTENIDO === */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Superior */}
        <header className="bg-white shadow-sm z-10 h-20 flex items-center px-8 relative">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-brand-600 mr-4 p-2 -ml-2 rounded-lg hover:bg-gray-100">
            <Menu size={28} />
          </button>
          
          {/* Título del Módulo Actual */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">
              {activeItemInfo?.label}
            </h1>
            <p className="text-sm text-slate-500 hidden sm:block">
              Resumen general de tu negocio
            </p>
          </div>

          {/* Perfil de Usuario */}
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

        {/* Contenido Scrollable */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-8 relative">
          <div className="max-w-7xl mx-auto h-full">
            
            {/* Lógica de enrutamiento manual simple */}
            {activeModule === 'productos' ? (
              <ProductsList />
            ) : (
              // Placeholder para los otros módulos que aún no hacemos
              <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center h-[500px] flex flex-col items-center justify-center border-dashed">
                 <div className="bg-brand-50 p-6 rounded-full mb-6">
                    {activeItemInfo && <activeItemInfo.icon size={64} className="text-brand-600" />}
                 </div>
                 <h2 className="text-3xl font-bold text-slate-800 mb-4">
                    Módulo de {activeItemInfo?.label}
                 </h2>
                 <p className="text-lg text-slate-500 max-w-md mb-8">
                    Próximamente verás aquí las funciones de {activeItemInfo?.label}.
                 </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}