import React from 'react';
import { Search, Bell, Grid, HelpCircle, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface TopbarProps {
  viewTitle: string;
  onMenuToggle?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ viewTitle, onMenuToggle }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-outline-variant h-16 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-2 lg:gap-4">
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-600 hover:text-primary-container"
        >
          <Menu size={24} />
        </button>
        <h2 className="title-sm lg:headline-md text-primary-container truncate max-w-[120px] sm:max-w-none">{viewTitle}</h2>
        <div className="hidden sm:block h-6 w-[1px] bg-outline-variant mx-2"></div>
        <div className="hidden md:flex items-center bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/30">
          <Search size={18} className="text-slate-400 mr-2" />
          <input
            className="bg-transparent border-none focus:ring-0 text-sm p-0 w-64 placeholder-slate-400 text-on-surface"
            placeholder="Procurar carga, motorista..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex gap-4">
          <button className="text-slate-600 cursor-pointer hover:text-primary-container transition-colors">
            <Bell size={20} />
          </button>
          <button className="text-slate-600 cursor-pointer hover:text-primary-container transition-colors">
            <Grid size={20} />
          </button>
          <button className="text-slate-600 cursor-pointer hover:text-primary-container transition-colors">
            <HelpCircle size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant relative group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-primary-container leading-none">{user?.name || 'Visitante'}</p>
            <p className="text-[11px] text-slate-500 font-medium tracking-tight">{user?.role || 'Acesso Limitado'}</p>
          </div>
          <div className="h-10 w-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-200 cursor-pointer hover:ring-2 hover:ring-primary-container/20 transition-all relative">
             <img 
              src={user?.avatar || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop"} 
              alt="User" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Simple Hover Dropdown for Logout */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-outline-variant overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="p-4 border-b border-outline-variant bg-slate-50">
              <p className="text-xs font-bold text-primary-container truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{user?.role}</p>
            </div>
            <button 
              onClick={logout}
              className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-red-50 flex items-center gap-3 hover:text-error transition-all"
            >
              <LogOut size={16} />
              <span className="font-medium">Sair da conta</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
