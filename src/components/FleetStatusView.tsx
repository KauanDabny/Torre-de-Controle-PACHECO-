import React from 'react';
import { 
  Search,
  Filter,
  Download,
  MoreVertical,
  Truck,
  Package,
  Wrench,
  MapPin,
  Building2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

export const FleetStatusView: React.FC = () => {
  return (
    <div className="p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Page Header & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="display-lg text-primary-container">Status da Frota</h2>
          <p className="text-body-sm text-slate-500 font-medium">Monitoramento em tempo real de 124 veículos ativos.</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <StatMiniCard 
            icon={<Package size={18} className="text-primary-container" />}
            label="Carregados"
            value="82"
            bgColor="bg-secondary-container"
          />
          <StatMiniCard 
            icon={<Wrench size={18} className="text-tertiary" />}
            label="Em Manutenção"
            value="14"
            bgColor="bg-tertiary-fixed"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <FilterChip label="Todos" active />
        <FilterChip label="Carregados" />
        <FilterChip label="Aguardando" />
        <FilterChip label="Vazios" />
        <FilterChip label="Em Manutenção" />
      </div>

      {/* Fleet List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4 label-caps text-slate-500">Veículo</th>
                <th className="px-6 py-4 label-caps text-slate-500">Status</th>
                <th className="px-6 py-4 label-caps text-slate-500">Informações Logísticas</th>
                <th className="px-6 py-4 label-caps text-slate-500">Horários</th>
                <th className="px-6 py-4 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              <FleetRow 
                plate="ABC-1234"
                model="Scania R450 - Carreta"
                status="CARREGADO"
                statusStyle="bg-secondary-container text-primary-container"
                client="J&T Express"
                route="São Paulo/SP → Rio de Janeiro/RJ"
                times={{ label1: 'Coleta', val1: '14/10 08:30', label2: 'Descarga', val2: '15/10 14:00' }}
              />
              <FleetRow 
                plate="XYZ-5678"
                model="Mercedes-Benz Actros - Truck"
                status="AGUARDANDO"
                statusStyle="bg-surface-container-high text-slate-600"
                client="Mercado Livre"
                route="Curitiba/PR → Porto Alegre/RS"
                times={{ label1: 'Coleta', val1: '16/10 10:00', label2: 'Descarga', val2: 'Pendente' }}
              />
               <FleetRow 
                plate="KLT-9012"
                model="VW Delivery - HR"
                status="VAZIO"
                statusStyle="bg-primary-fixed text-primary-container"
                location="Pátio Central - Guarulhos/SP"
                times={{ label1: '', val1: 'Disponível para carregamento', label2: '', val2: '' }}
                isVazio
              />
              <FleetRow 
                plate="OFF-4040"
                model="Volvo FH 540 - Carreta"
                status="EM MANUTENÇÃO"
                statusStyle="bg-error-container text-error"
                location="Mecânica Diesel Irmãos Rocha"
                times={{ label1: 'Entrada', val1: '12/10', label2: 'Previsão', val2: '16/10' }}
                isManutencao
              />
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-white border-t border-outline-variant flex justify-between items-center">
          <p className="text-xs text-slate-500 font-bold">Mostrando 4 de 124 veículos</p>
          <div className="flex gap-2">
            <button className="p-1 border border-outline-variant rounded hover:bg-slate-50 text-slate-400 disabled:opacity-50" disabled><ChevronLeft size={18}/></button>
            <button className="px-3 py-1 border border-outline-variant rounded bg-primary-container text-white text-xs font-bold">1</button>
            <button className="px-3 py-1 border border-outline-variant rounded hover:bg-slate-50 text-slate-600 text-xs font-bold">2</button>
            <button className="px-3 py-1 border border-outline-variant rounded hover:bg-slate-50 text-slate-600 text-xs font-bold">3</button>
            <button className="p-1 border border-outline-variant rounded hover:bg-slate-50 text-slate-400"><ChevronRight size={18}/></button>
          </div>
        </div>
      </div>

      {/* Performance Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 bg-white p-8 rounded-xl border border-outline-variant flex items-center justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="z-10 flex flex-col items-start h-full">
            <h4 className="title-sm text-primary-container mb-2 font-bold">Performance da Frota</h4>
            <p className="text-sm text-slate-500 max-w-sm font-medium leading-relaxed">
              94% dos veículos operando dentro do cronograma previsto. Atrasos detectados apenas na rota Rio-Santos devido a condições climáticas.
            </p>
            <button className="mt-8 px-6 py-2.5 bg-primary-container text-white rounded font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity">
              Ver Detalhes das Rotas
            </button>
          </div>
          <div className="z-10 flex gap-4 items-end pl-8">
            <ChartBar height="h-24" />
            <ChartBar height="h-32" />
            <ChartBar height="h-28" />
            <ChartBar height="h-40" active />
            <ChartBar height="h-36" />
          </div>
          {/* Aesthetic Overlay */}
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary-container/10 to-transparent pointer-events-none" />
        </div>

        <div className="md:col-span-4 bg-primary-container p-8 rounded-xl flex flex-col justify-between shadow-lg text-white">
          <div>
            <ShieldCheck size={36} className="text-teal-400" />
            <h4 className="title-sm mt-4 font-bold">Segurança 24h</h4>
            <p className="text-sm opacity-80 mt-2 font-medium leading-relaxed">
              Todos os rastreadores estão online e transmitindo sinais de telemetria.
            </p>
          </div>
          <div className="pt-6 border-t border-white/10 flex items-center justify-between mt-4">
            <span className="data-mono text-[11px] opacity-60">Última checagem: Agora</span>
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.8)] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatMiniCard: React.FC<{ icon: React.ReactNode; label: string; value: string; bgColor: string }> = ({ icon, label, value, bgColor }) => (
  <div className="bg-white border border-outline-variant p-4 rounded-xl flex items-center gap-4 shadow-sm min-w-[160px]">
    <div className={cn("p-2 rounded-lg", bgColor)}>{icon}</div>
    <div>
      <p className="label-caps !text-[10px] text-slate-500 mb-0.5">{label}</p>
      <p className="title-sm !text-xl text-primary-container font-black">{value}</p>
    </div>
  </div>
);

const FilterChip: React.FC<{ label: string; active?: boolean }> = ({ label, active }) => (
  <button className={cn(
    "px-6 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all whitespace-nowrap",
    active 
      ? "bg-primary-container text-white shadow-lg shadow-primary-container/20" 
      : "bg-white border border-outline-variant text-slate-600 hover:bg-slate-50"
  )}>
    {label}
  </button>
);

const FleetRow: React.FC<{
  plate: string;
  model: string;
  status: string;
  statusStyle: string;
  client?: string;
  route?: string;
  location?: string;
  times: { label1: string; val1: string; label2: string; val2: string };
  isVazio?: boolean;
  isManutencao?: boolean;
}> = ({ plate, model, status, statusStyle, client, route, location, times, isVazio, isManutencao }) => (
  <tr className="hover:bg-slate-50/50 transition-colors">
    <td className="px-6 py-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center border border-outline-variant/30">
          <Truck size={20} className="text-slate-400" />
        </div>
        <div>
          <p className="data-mono text-primary-container font-black">{plate}</p>
          <p className="text-[12px] text-slate-500 font-medium">{model}</p>
        </div>
      </div>
    </td>
    <td className="px-6 py-6">
      <span className={cn(
        "px-3 py-1 rounded-full font-black text-[10px] tracking-widest border border-current/10",
        statusStyle
      )}>
        {status}
      </span>
    </td>
    <td className="px-6 py-6">
      <div className="flex flex-col gap-1.5">
        {client ? (
          <p className="text-sm font-bold text-primary-container flex items-center gap-2">
            <Building2 size={14} className="text-slate-400" /> {client}
          </p>
        ) : (
           <p className="label-caps !text-[9px] text-slate-400">{isVazio ? 'LOCALIZAÇÃO ATUAL' : 'OFICINA / LOCAL'}</p>
        )}
        <p className="text-xs text-slate-500 flex items-center gap-2 font-medium">
          <MapPin size={14} className="text-slate-300" /> {route || location}
        </p>
      </div>
    </td>
    <td className="px-6 py-6 font-mono">
      <div className="space-y-1">
        <p className="text-[11px] text-slate-500">
           <span className="font-black text-primary-container uppercase min-w-[60px] inline-block">{times.label1}:</span> {times.val1}
        </p>
        {times.val2 && (
          <p className="text-[11px] text-slate-500">
            <span className="font-black text-primary-container uppercase min-w-[60px] inline-block">{times.label2}:</span> {times.val2}
          </p>
        )}
      </div>
    </td>
    <td className="px-6 py-6 text-right">
      <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-primary-container transition-colors">
        <MoreVertical size={18} />
      </button>
    </td>
  </tr>
);

const ChartBar: React.FC<{ height: string; active?: boolean }> = ({ height, active }) => (
  <div className={cn(
    "w-8 rounded-t-sm transition-all duration-500",
    height,
    active ? "bg-primary-container shadow-[0_0_15px_rgba(13,61,61,0.3)]" : "bg-secondary-container"
  )} />
);
