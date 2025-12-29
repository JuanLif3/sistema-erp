import { useState } from 'react';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  LogOut,
  Menu,
  LayoutDashboard
} from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeModule, setActiveModule] = useState('resumen');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'resumen', label: 'Resumen General', icon: LayoutDashboard },
    { id: 'usuarios', label: 'Usuarios y Accesos', icon: Users },
    { id: 'productos', label: 'Inventario', icon: Package },
    { id: 'pedidos', label: 'Ventas y Pedidos', icon: ShoppingCart },
    { id: 'finanzas', label: 'Finanzas', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100">

      {/* ===== SIDEBAR ===== */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64
        bg-gradient-to-b from-slate-900 to-slate-800
        text-white transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="h-full flex flex-col">

          {/* LOGO */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              <span className="text-blue-400">ERP</span> Pro
            </h2>
            <button
              className="md:hidden text-white/70"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ✖
            </button>
          </div>

          {/* MENU */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon;
              const active = activeModule === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveModule(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    relative w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all
                    ${active
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2
                      h-6 w-1 bg-blue-400 rounded-r-full" />
                  )}
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* LOGOUT */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3
              text-red-400 hover:bg-red-500/10 rounded-xl transition"
            >
              <LogOut size={20} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200
          flex items-center justify-between px-6 shadow-sm">

          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={22} />
          </button>

          <h1 className="text-lg font-semibold text-slate-800">
            {menuItems.find(m => m.id === activeModule)?.label}
          </h1>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">Administrador</p>
              <p className="text-xs text-slate-500">admin@erp.com</p>
            </div>
            <div className="
              h-10 w-10 rounded-full
              bg-gradient-to-br from-blue-500 to-indigo-600
              flex items-center justify-center
              text-white font-semibold shadow-md">
              AD
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <section className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">

            <div className="
              bg-white rounded-2xl border border-slate-200
              shadow-md hover:shadow-xl transition
              min-h-[420px] p-10
              flex flex-col items-center justify-center text-center">

              <div className="
                bg-gradient-to-br from-blue-100 to-indigo-100
                p-5 rounded-2xl shadow-inner mb-6">

                {(() => {
                  const item = menuItems.find(m => m.id === activeModule);
                  const Icon = item?.icon || LayoutDashboard;
                  return <Icon size={52} className="text-blue-600" />;
                })()}
              </div>

              <h2 className="text-2xl font-semibold text-slate-900">
                Módulo {menuItems.find(m => m.id === activeModule)?.label}
              </h2>

              <p className="text-slate-500 max-w-md mt-3">
                Aquí irá la lógica real del sistema: tablas, formularios,
                métricas y acciones avanzadas.
              </p>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
