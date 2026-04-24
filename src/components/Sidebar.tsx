import React from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Truck, 
  BarChart3, 
  Package, 
  ClipboardList, 
  Plus, 
  Settings, 
  HelpCircle,
  LogOut,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isOpen, onClose }) => {
  const { user, logout } = useAuth();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'routes', label: 'Análise de Rotas', icon: MapIcon },
    { id: 'fleet', label: 'Status da Frota', icon: Truck },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'shipments', label: 'Envios', icon: Package },
    { id: 'reports', label: 'Relatórios', icon: ClipboardList },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-all animate-in fade-in"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-full w-[280px] border-r border-outline-variant bg-white flex flex-col py-6 px-4 z-50 transition-transform duration-300 transform lg:translate-x-0 overflow-y-auto",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-2 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center overflow-hidden">
               <img 
                src="https://transportadorapacheco.com/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.className = "h-10 w-10 bg-primary-container rounded-lg flex items-center justify-center text-white font-bold";
                    parent.innerText = "TP";
                  }
                }}
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary-container leading-tight">Pacheco</h1>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">Logística</p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-primary-container">
            <X size={20} />
          </button>
        </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onViewChange(item.id);
              onClose?.();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-md transition-colors duration-200",
              activeView === item.id 
                ? "text-primary-container font-bold border-r-4 border-primary-container bg-surface-container-low" 
                : "text-slate-500 hover:bg-slate-50 hover:text-primary-container"
            )}
          >
            <item.icon size={20} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 space-y-1">
        <div className="px-3 py-3 mb-6 bg-slate-50 rounded-xl border border-outline-variant/50">
          <div className="flex items-center gap-3">
             <img 
              src={user?.avatar}
              className="w-8 h-8 rounded-full border border-outline-variant"
              alt="Avatar"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-primary-container truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">{user?.role}</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => onViewChange('shipments')}
          className="w-full bg-primary-container text-white py-3 rounded-md mb-4 font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Novo Envio
        </button>
        
        <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-primary-container transition-colors">
          <Settings size={20} />
          <span className="text-sm">Configurações</span>
        </button>
        
        <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-primary-container transition-colors">
          <HelpCircle size={20} />
          <span className="text-sm">Suporte</span>
        </button>

        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-error transition-colors mt-2"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </aside>
    </>
  );
};
