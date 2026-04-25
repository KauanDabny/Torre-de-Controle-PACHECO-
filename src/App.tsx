import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './components/DashboardView';
import { RouteAnalysisView } from './components/RouteAnalysisView';
import { FleetStatusView } from './components/FleetStatusView';
import { PerformanceView } from './components/PerformanceView';
import { LoginView } from './components/LoginView';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ShipmentProvider } from './contexts/ShipmentContext';
import { Headphones, Loader2 } from 'lucide-react';
import { ShipmentsView } from './components/ShipmentsView';
import { Toaster } from 'react-hot-toast';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Dashboard Operacional';
      case 'routes': return 'Análise de Rodovias e Vias';
      case 'fleet': return 'Status da Frota';
      case 'performance': return 'Painel de Performance';
      case 'shipments': return 'Gestão de Envios';
      case 'reports': return 'Relatórios e BI';
      default: return 'Portal Logístico';
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'routes': return <RouteAnalysisView />;
      case 'fleet': return <FleetStatusView />;
      case 'performance': return <PerformanceView />;
      case 'shipments': return <ShipmentsView />;
      default: return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-slate-400 p-8">
          <div className="max-w-md w-full bg-white border border-outline-variant rounded-xl shadow-sm text-center p-12">
             <h3 className="headline-md mb-2">Módulo em Desenvolvimento</h3>
             <p className="text-sm">Esta funcionalidade estará disponível em breve.</p>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary-container animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-surface selection:bg-primary-container selection:text-white">
      <Toaster position="top-right" />
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="lg:ml-[280px] min-h-screen relative transition-all duration-300">
        <Topbar 
          viewTitle={getViewTitle()} 
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        <div className="animate-in fade-in duration-500 overflow-x-hidden">
          {renderView()}
        </div>

        {/* Floating Action Button for Emergency Contact */}
        <button className="fixed bottom-8 right-8 bg-primary-container text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-50 flex items-center gap-2 group">
          <Headphones size={20} />
          <span className="text-sm font-bold pr-2 max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-300">
            Torre de Controle
          </span>
        </button>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ShipmentProvider>
        <AppContent />
      </ShipmentProvider>
    </AuthProvider>
  );
}

