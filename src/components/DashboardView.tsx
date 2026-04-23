import React from 'react';
import { 
  Truck, 
  Timer, 
  AlertTriangle, 
  AlertCircle,
  Map as MapIcon,
  Plus,
  Minus,
  Layers,
  MoreVertical,
  ArrowRight,
  QrCode,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LeafletMap } from './LeafletMap'; 

import { useShipments } from '../contexts/ShipmentContext';

export const DashboardView: React.FC = () => {
  const { shipments, vehicles } = useShipments();
  
  // KPI Calculations
  const totalActive = shipments.length;
  const onTimeCount = shipments.filter(s => s.status === 'EM TRÂNSITO' || s.status === 'ENTREGA FINAL').length;
  const delayedCount = shipments.filter(s => s.status === 'PARADO (PONTO DE APOIO)').length;
  const atRiskCount = shipments.filter(s => s.status === 'AGUARDANDO' || s.status === 'CARREGANDO').length;

  // Percentages for progress bars
  const onTimePercent = totalActive > 0 ? (onTimeCount / totalActive) * 100 : 0;
  const delayedPercent = totalActive > 0 ? (delayedCount / totalActive) * 100 : 0;
  const atRiskPercent = totalActive > 0 ? (atRiskCount / totalActive) * 100 : 0;

  // Get latest 5 shipments for the dashboard table
  const latestShipments = [...shipments].slice(0, 5);

  // Critical shipments are those that are "PARADO" or have low progress but are "EM TRÂNSITO"
  const criticalShipments = shipments.filter(s => 
    s.status === 'PARADO (PONTO DE APOIO)' || 
    (s.status === 'EM TRÂNSITO' && s.progress < 20)
  ).slice(0, 5);

  return (
    <div className="p-8 space-y-8">
      {/* Real-time Indicators Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPIItem 
          icon={<Truck className="text-primary-container" />}
          label="Viagens Ativas"
          value={totalActive.toString().padStart(2, '0')}
          trend={`${totalActive > 0 ? '+1' : '0'} vs ontem`}
          trendColor="text-teal-600"
          progress={100}
          progressColor="bg-primary-container"
          bgColor="bg-teal-50"
        />
        <KPIItem 
          icon={<Timer className="text-secondary" />}
          label="Dentro do Horário"
          value={onTimeCount.toString().padStart(2, '0')}
          trend={`${onTimePercent.toFixed(1)}% do total`}
          trendColor="text-teal-600"
          progress={onTimePercent}
          progressColor="bg-teal-500"
          bgColor="bg-secondary-container"
        />
        <KPIItem 
          icon={<AlertTriangle className="text-error" />}
          label="Em Atraso"
          value={delayedCount.toString().padStart(2, '0')}
          trend={delayedCount > 0 ? "Ação imediata" : "Nenhum alerta"}
          trendColor={delayedCount > 0 ? "text-error" : "text-slate-400"}
          progress={delayedPercent}
          progressColor="bg-error"
          bgColor="bg-error-container"
        />
        <KPIItem 
          icon={<AlertCircle className="text-tertiary" />}
          label="Aguardando / Carga"
          value={atRiskCount.toString().padStart(2, '0')}
          trend="Status Pendente"
          trendColor="text-slate-500"
          progress={atRiskPercent}
          progressColor="bg-amber-600"
          bgColor="bg-surface-container-highest"
        />
      </section>

      {/* Main Operational Area (Bento Grid) */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Map View */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-outline-variant rounded-xl h-[580px] flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-white/50">
            <div className="flex items-center gap-2">
              <MapIcon size={18} className="text-primary-container" />
              <h4 className="title-sm text-primary-container">Monitoramento da Frota em Tempo Real</h4>
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden bg-slate-100">
            {/* Interactive Leaflet Map (Ready to use) */}
            <LeafletMap className="w-full h-full" vehicles={vehicles} />
            
            {/* Floating Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <button className="bg-white shadow-md p-2 rounded hover:bg-slate-50 border border-outline-variant"><Plus size={16}/></button>
              <button className="bg-white shadow-md p-2 rounded hover:bg-slate-50 border border-outline-variant"><Minus size={16}/></button>
              <button className="bg-white shadow-md p-2 rounded hover:bg-slate-50 border border-outline-variant"><Layers size={16}/></button>
            </div>
          </div>
        </div>

        {/* Critical Shipments Panel */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-outline-variant rounded-xl h-[580px] flex flex-col shadow-sm overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex items-center justify-between">
            <h4 className="title-sm text-primary-container flex items-center gap-2">
              <AlertCircle size={20} className="text-error" />
              Carregamentos Críticos
            </h4>
            <span className="text-xs font-bold text-error bg-error-container px-2 py-0.5 rounded">
              {criticalShipments.length.toString().padStart(2, '0')} ALERTAS
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {criticalShipments.map((s) => (
              <CriticalItem 
                key={s.id}
                id={s.id}
                type={s.status === 'PARADO (PONTO DE APOIO)' ? 'Veículo Parado' : 'Atraso de Início'}
                route={s.route}
                cargo={`Veículo: ${s.vehicle} | ${s.client || 'Geral'}`}
                progress={s.progress}
                btnLabel="REVISAR VIAGEM"
                severity={s.status === 'PARADO (PONTO DE APOIO)' ? 'error' : 'warning'}
              />
            ))}
            {criticalShipments.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck size={32} />
                </div>
                <p className="text-slate-500 font-bold text-sm">Sem alertas críticos</p>
                <p className="text-slate-400 text-xs mt-1">Toda a frota operando conforme o planejado.</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 border-t border-outline-variant">
            <button className="w-full py-2 text-sm text-slate-600 font-medium hover:text-primary-container">
              Ver Todas as Ocorrências
            </button>
          </div>
        </div>
      </div>

      {/* Operational Activity Table */}
      <section className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-outline-variant flex justify-between items-center">
          <h4 className="title-sm text-primary-container">Últimas Movimentações da Frota</h4>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-outline-variant rounded-md text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50">
              Filtrar
            </button>
            <button className="px-4 py-2 bg-white border border-outline-variant rounded-md text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50">
              Exportar
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-outline-variant">
              <tr>
                <th className="px-6 py-3 label-caps text-slate-500">Identificador</th>
                <th className="px-6 py-3 label-caps text-slate-500">Veículo</th>
                <th className="px-6 py-3 label-caps text-slate-500">Origem / Destino</th>
                <th className="px-6 py-3 label-caps text-slate-500">Status</th>
                <th className="px-6 py-3 label-caps text-slate-500">Progresso</th>
                <th className="px-6 py-3 label-caps text-slate-500">Última Att.</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {latestShipments.map((s) => (
                <ActivityRow 
                  key={s.id}
                  id={s.id}
                  vehicle={s.vehicle}
                  plate={s.plate}
                  route={s.route}
                  status={s.status}
                  progress={s.progress}
                  time={s.lastUpdate}
                  statusColor={getStatusStyle(s.status)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const KPIItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  trendColor: string;
  progress: number;
  progressColor: string;
  bgColor: string;
}> = ({ icon, label, value, trend, trendColor, progress, progressColor, bgColor }) => (
  <div className="bg-white p-6 border border-outline-variant rounded-xl flex flex-col gap-2 group hover:border-primary-container transition-all hover:shadow-md">
    <div className="flex justify-between items-start">
      <div className={cn("p-2 rounded-lg", bgColor)}>{icon}</div>
      <span className={cn("text-[11px] font-bold", trendColor)}>{trend}</span>
    </div>
    <p className="text-slate-500 label-caps tracking-widest">{label}</p>
    <h3 className="display-lg text-primary-container">{value}</h3>
    <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
      <div className={cn("h-full transition-all duration-1000", progressColor)} style={{ width: `${progress}%` }}></div>
    </div>
  </div>
);

const CriticalItem: React.FC<{
  id: string;
  type: string;
  route: string;
  cargo: string;
  progress?: number;
  btnLabel: string;
  severity: 'error' | 'warning';
}> = ({ id, type, route, cargo, progress, btnLabel, severity }) => (
  <div className={cn(
    "border-l-4 p-4 bg-surface rounded-r-lg shadow-sm",
    severity === 'error' ? "border-error" : "border-amber-500"
  )}>
    <div className="flex justify-between items-start mb-2">
      <span className="text-[11px] font-bold text-slate-500 font-mono tracking-tighter">ID: {id}</span>
      <span className={cn(
        "text-[10px] font-bold uppercase",
        severity === 'error' ? "text-error" : "text-amber-600"
      )}>{type}</span>
    </div>
    <p className="text-sm font-bold text-primary-container">{route}</p>
    <p className="text-xs text-slate-500 mb-3">{cargo}</p>
    {progress !== undefined && (
      <div className="flex items-center gap-2 mb-3">
        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="bg-error h-full" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="text-[10px] font-bold font-mono">{progress}%</span>
      </div>
    )}
    <button className="w-full text-[11px] font-bold text-primary-container border border-primary-container py-2 rounded hover:bg-slate-50 transition-colors uppercase">
      {btnLabel}
    </button>
  </div>
);

const ActivityRow: React.FC<{
  id: string;
  vehicle: string;
  plate: string;
  route: string;
  status: string;
  progress: number;
  time: string;
  statusColor?: string;
  progressColor?: string;
}> = ({ id, vehicle, plate, route, status, progress, time, statusColor, progressColor }) => (
  <tr className="hover:bg-slate-50 transition-colors group">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-100 flex items-center justify-center rounded border border-outline-variant/30">
          <QrCode size={14} className="text-slate-400" />
        </div>
        <span className="data-mono font-bold text-primary-container">{id}</span>
      </div>
    </td>
    <td className="px-6 py-4">
      <p className="text-sm font-semibold text-slate-700">{vehicle}</p>
      <p className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">{plate}</p>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center text-sm text-slate-600 gap-2">
        <span>{route.split(' → ')[0]}</span>
        <ArrowRight size={12} className="text-slate-300" />
        <span>{route.split(' → ')[1]}</span>
      </div>
    </td>
    <td className="px-6 py-4">
      <span className={cn(
        "px-2 py-1 text-[10px] font-bold rounded",
        statusColor || "bg-teal-100 text-teal-800"
      )}>{status}</span>
    </td>
    <td className="px-6 py-4 w-48">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
          <div className={cn("h-full", progressColor || "bg-primary-container")} style={{ width: `${progress}%` }}></div>
        </div>
        <span className="text-[10px] font-mono text-slate-500">{progress}%</span>
      </div>
    </td>
    <td className="px-6 py-4 text-xs text-slate-500">{time}</td>
    <td className="px-6 py-4 text-right">
      <button className="text-slate-400 hover:text-primary-container p-1 rounded-full"><MoreVertical size={16} /></button>
    </td>
  </tr>
);

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'EM TRÂNSITO': return 'bg-teal-100 text-teal-800';
    case 'ENTREGA FINAL': return 'bg-blue-100 text-blue-800';
    case 'PARADO (PONTO DE APOIO)': return 'bg-slate-100 text-slate-600';
    case 'CARREGANDO': return 'bg-purple-100 text-purple-800';
    case 'AGUARDANDO': return 'bg-slate-50 text-slate-400';
    default: return 'bg-teal-100 text-teal-800';
  }
};
