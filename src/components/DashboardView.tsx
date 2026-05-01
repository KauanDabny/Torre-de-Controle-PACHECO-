import React from 'react';
import { cn } from '../lib/utils';
import { FleetMapView } from './FleetMapView';
import { useShipments } from '../contexts/ShipmentContext';
import { 
  RefreshCw, 
  Power, 
  Navigation, 
  Pause, 
  Clock, 
  MapPin, 
  Activity, 
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle as AlertIcon,
  Truck,
  AlertTriangle,
  Map as MapIcon,
  User as UserIcon
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { shipments, vehicles, syncSascar, loading } = useShipments();
  
  // Real-time KPI Calculations from verified Sascar data
  const totalFrota = vehicles.length;
  const ignLigada = vehicles.filter(v => v.ignition).length;
  const emMovimento = vehicles.filter(v => v.speed > 5).length;
  
  // Operational segments (from deriveStatus logic in server)
  const emViagem = vehicles.filter(v => v.status === 'Em Viagem').length;
  const encerrado = vehicles.filter(v => v.status === 'Encerrado').length;
  const parado = vehicles.filter(v => v.status === 'Parado').length;
  const aguardando = vehicles.filter(v => v.status === 'Aguardando').length;
  
  // Alerta Parado em Viagem (Ignition ON or Em Viagem but speed 0)
  const paradoEmViagem = vehicles.filter(v => v.status === 'Em Viagem' && v.speed === 0).length;
  
  // Sem Sinal (last update more than 15 mins ago)
  const semSinal = vehicles.filter(v => {
    const last = new Date(v.lastUpdate).getTime();
    const now = new Date().getTime();
    return (now - last) > 15 * 60 * 1000;
  }).length;
  
  // Average Speed
  const movingVehicles = vehicles.filter(v => v.speed > 0);
  const avgSpeed = movingVehicles.length > 0 
    ? movingVehicles.reduce((acc, v) => acc + v.speed, 0) / movingVehicles.length 
    : 0;

  return (
    <div className="p-6 space-y-6 bg-[#f4f6f9] min-h-screen">
      {/* Minimized Header Info */}
      <div className="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <h2 className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Live Operations Status</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono text-slate-400 uppercase">Sync: {new Date().toLocaleTimeString()}</span>
          <button 
            onClick={syncSascar}
            disabled={loading}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50",
              loading && "animate-pulse"
            )}
          >
            <RefreshCw size={10} className={cn(loading && "animate-spin")} />
            {loading ? 'Aguarde...' : 'Sincronizar'}
          </button>
        </div>
      </div>

      {/* Primary KPI Row - Styled as requested (compact, clean cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPIBox 
          label="Viagens Ativas" 
          value={emViagem} 
          secondaryLabel="0 vs ontem"
          color="text-[#004d40]" 
          barColor="bg-[#004d40]" 
          icon={<Truck size={20} />} 
          iconBgColor="bg-emerald-50"
        />
        <KPIBox 
          label="Dentro do Horário" 
          value={emMovimento} 
          secondaryLabel="100,0% do total"
          color="text-[#004d40]" 
          barColor="bg-teal-500" 
          icon={<Clock size={20} />} 
          iconBgColor="bg-teal-50"
        />
        <KPIBox 
          label="Em Atraso" 
          value={paradoEmViagem} 
          secondaryLabel="Alertas" 
          color={paradoEmViagem > 0 ? "text-red-600" : "text-[#004d40]"} 
          barColor={paradoEmViagem > 0 ? "bg-red-500" : "bg-slate-100"} 
          icon={<AlertTriangle size={20} />} 
          iconBgColor="bg-red-50"
        />
        <KPIBox 
          label="Aguardando / Carga" 
          value={aguardando} 
          secondaryLabel="Pendente"
          color="text-[#004d40]" 
          barColor="bg-[#e65100]" 
          icon={<AlertOctagon size={20} />} 
          iconBgColor="bg-orange-50"
        />
        <KPIBox 
          label="Velocidade Média" 
          value={avgSpeed > 0 ? `${avgSpeed.toFixed(0)}` : "00"} 
          secondaryLabel="KM/A"
          color="text-[#004d40]" 
          barColor="bg-indigo-500" 
          icon={<Activity size={20} />} 
          iconBgColor="bg-indigo-50"
        />
      </section>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Map Section */}
          <div className="bg-white border border-outline-variant rounded-xl h-[520px] flex flex-col overflow-hidden shadow-sm">
            <div className="p-3 border-b border-outline-variant flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <MapIcon size={16} className="text-green-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Visualização Geográfica da Frota</span>
              </div>
            </div>
            <div className="flex-1 relative bg-slate-100">
              <FleetMapView vehicles={vehicles} />
            </div>
          </div>

          {/* Detailed Table - Styled according to reference image */}
          <div className="bg-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <h3 className="text-xl font-bold text-slate-800">Últimos Movimentos da Frota</h3>
               <div className="flex gap-2">
                 <button className="px-6 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Filtro</button>
                 <button className="px-6 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Exportador</button>
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Veículo / Placa</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rota / Motorista</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Progresso</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Última Att.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {vehicles.map((v) => {
                    const progress = v.status === 'Em Viagem' ? 39 : 0; // Mocking progress for visual fidelity
                    const progressColor = v.status === 'Em Viagem' ? 'bg-[#004d40]' : 'bg-slate-200';
                    
                    return (
                      <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                              <Truck size={20} />
                            </div>
                            <div>
                              <p className="text-base font-black text-slate-800 leading-tight">
                                {v.plate}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                ATEGO
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-slate-700 uppercase tracking-tight mb-1">
                            {v.macro && v.macro !== 'Sem Macro' ? v.macro : 'ROTA NÃO IDENTIFICADA'}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                            <UserIcon size={12} className="text-slate-300" />
                            <span className="uppercase">{v.driver}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "inline-block px-3 py-1 text-[10px] font-black rounded-md uppercase tracking-wider leading-none",
                            v.status === 'Em Viagem' ? "bg-blue-50 text-blue-400" : 
                            v.status === 'Encerrado' ? "bg-slate-100 text-slate-500" :
                            v.status === 'Parado' ? "bg-amber-50 text-amber-500" : 
                            v.status === 'Aguardando' ? "bg-blue-50/50 text-blue-300" : "bg-purple-50 text-purple-400"
                          )}>{v.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center w-32 mx-auto">
                            <span className={cn("text-[10px] font-black mb-1.5", progress > 0 ? "text-slate-700" : "text-slate-400")}>
                              {progress} %
                            </span>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full transition-all duration-1000", progressColor)} 
                                style={{ width: `${progress}%` }} 
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <p className="text-[13px] font-black text-slate-700 font-mono">
                             {v.lastUpdate.includes('T') 
                               ? `${v.lastUpdate.split('-')[2].split('T')[0]}/${v.lastUpdate.split('-')[1]} ${v.lastUpdate.split('T')[1].substring(0, 5)}`
                               : v.lastUpdate}
                           </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col h-[520px]">
             <div className="p-4 border-b border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertIcon size={18} className="text-red-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Alertas de Atenção</span>
                </div>
                <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded">
                  {(paradoEmViagem + semSinal).toString().padStart(2, '0')} ATIVOS
                </span>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                {vehicles.filter(v => v.speed === 0 && v.ignition).map(v => (
                  <div key={v.id} className="bg-white border-l-4 border-l-orange-500 border border-outline-variant p-3 shadow-sm rounded-r-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[11px] font-black text-slate-700 uppercase">{v.plate}</span>
                      <span className="text-[9px] font-bold text-orange-600 uppercase">Parado em Viagem</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2 truncate">{v.address}</p>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-mono text-slate-400">Há 0h12m</span>
                       <button className="text-[9px] font-bold text-blue-600 hover:underline">VER NO MAPA</button>
                    </div>
                  </div>
                ))}
                {semSinal > 0 && vehicles.filter(v => {
                  const last = new Date(v.lastUpdate).getTime();
                  return (new Date().getTime() - last) > 15 * 60 * 1000;
                }).map(v => (
                  <div key={v.id} className="bg-white border-l-4 border-l-red-600 border border-outline-variant p-3 shadow-sm rounded-r-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[11px] font-black text-slate-800 uppercase">{v.plate}</span>
                      <span className="text-[9px] font-bold text-red-600 uppercase">Sem Sinal</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2 truncate">Última pos: {v.address}</p>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-mono text-slate-400">{v.lastUpdate}</span>
                       <button className="text-[9px] font-bold text-blue-600 hover:underline">CHECK-IN</button>
                    </div>
                  </div>
                ))}
                {(paradoEmViagem === 0 && semSinal === 0) && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 mt-12">
                    <CheckCircle2 size={48} className="text-slate-200 mb-4" />
                    <p className="text-slate-500 font-bold text-sm">Operação Normal</p>
                    <p className="text-slate-400 text-xs mt-1">Nenhum veículo com desvio crítico detectado no momento.</p>
                  </div>
                )}
             </div>
           </div>

           <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-4 space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-2">Distribuição de Status</h4>
             <div className="space-y-3">
                <StatusRow label="Em Viagem" count={emViagem} total={totalFrota} color="bg-blue-600" />
                <StatusRow label="Parado" count={parado} total={totalFrota} color="bg-amber-500" />
                <StatusRow label="Aguardando" count={aguardando} total={totalFrota} color="bg-cyan-500" />
                <StatusRow label="Encerrado" count={encerrado} total={totalFrota} color="bg-slate-400" />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const KPIBox: React.FC<{
  label: string;
  value: string | number;
  color: string;
  barColor: string;
  icon: React.ReactNode;
  secondaryLabel?: string;
  secondaryColor?: string;
  iconBgColor?: string;
}> = ({ label, value, color, barColor, icon, secondaryLabel, secondaryColor = "text-teal-600", iconBgColor = "bg-teal-50" }) => (
  <div className="bg-white p-4 border border-slate-200 rounded-2xl flex flex-col h-[150px] justify-between transition-all shadow-sm hover:shadow-md relative group">
    <div className="flex justify-between items-start">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105", iconBgColor)}>
        <div className={cn(color)}>{icon}</div>
      </div>
      <span className={cn("text-[9px] font-black uppercase tracking-tight", secondaryColor)}>
        {secondaryLabel}
      </span>
    </div>
    
    <div className="mt-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <h3 className={cn("text-4xl font-black tracking-tighter leading-none", color)}>
        {typeof value === 'number' ? value.toString().padStart(2, '0') : value}
      </h3>
    </div>
    
    <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden mt-3">
      <div 
        className={cn("h-full transition-all duration-1000", barColor)} 
        style={{ width: (value !== 0 && value !== '0' && value !== '00') ? '85%' : '0%' }} 
      />
    </div>
  </div>
);

const StatusRow: React.FC<{ label: string; count: number; total: number; color: string }> = ({ label, count, total, color }) => {
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{label}</span>
        <span className="text-[10px] font-mono font-bold text-slate-400">{count} ({percent.toFixed(0)}%)</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${percent}%` }} />
      </div>
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
  driver?: string;
  status: string;
  progress: number;
  time: string;
  statusColor?: string;
  progressColor?: string;
}> = ({ id, vehicle, plate, route, driver, status, progress, time, statusColor, progressColor }) => (
  <tr className="hover:bg-slate-50/50 transition-colors group">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-container/10 rounded-xl flex items-center justify-center text-primary-container text-primary-container">
          <Truck size={20} />
        </div>
        <div>
          <p className="text-sm font-black text-primary-container uppercase leading-none mb-1 uppercase leading-none mb-1">
            {plate}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            {vehicle || 'ATEGO'}
          </p>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 text-xs font-bold text-slate-600">
      <div className="flex items-center gap-2">
        <UserIcon size={12} className="text-slate-400" />
        {driver || '---'}
      </div>
    </td>
    <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500">
      {route}
    </td>
    <td className="px-6 py-4">
      <div className="flex justify-center">
        <span className={cn(
          "px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider",
          statusColor || "bg-teal-100 text-teal-800"
        )}>{status}</span>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="w-32">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-black text-slate-400">{progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-500", progressColor || "bg-primary-container")} 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
    </td>
    <td className="px-6 py-4 text-right">
      <span className="text-xs font-black text-slate-600 font-black text-slate-600">{time}</span>
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
