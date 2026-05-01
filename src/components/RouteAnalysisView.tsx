import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  Cell
} from 'recharts';
import { 
  AlertTriangle, 
  Clock, 
  Truck, 
  Timer, 
  TrendingUp,
  AlertCircle,
  MoreVertical,
  TrendingDown,
  Minus,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useShipments } from '../contexts/ShipmentContext';

export const RouteAnalysisView: React.FC = () => {
  const { vehicles, loading } = useShipments();
  const [history, setHistory] = React.useState<{ topCongestedRoutes: any[], totalEvents: number }>({ topCongestedRoutes: [], totalEvents: 0 });

  React.useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/sascar/history');
        const data = await res.json();
        setHistory(data);
      } catch (e) {
        console.error("Error fetching history:", e);
      }
    };
    fetchHistory();
  }, [vehicles]); // Refetch when vehicles update (likely after a sync)

  // Process vehicle data for route analysis (Current State)
  const routeData = React.useMemo(() => {
    const routes: Record<string, {
      name: string;
      vehicles: any[];
      movingCount: number;
      stoppedInTransitCount: number;
      avgSpeed: number;
      totalDelayScore: number;
    }> = {};

    vehicles.forEach(v => {
      const routeName = v.macro && v.macro !== 'Sem Macro' ? v.macro : 'NÃO IDENTIFICADO';
      if (!routes[routeName]) {
        routes[routeName] = {
          name: routeName,
          vehicles: [],
          movingCount: 0,
          stoppedInTransitCount: 0,
          avgSpeed: 0,
          totalDelayScore: 0
        };
      }

      routes[routeName].vehicles.push(v);
      if (v.speed > 5) {
        routes[routeName].movingCount++;
      }
      
      // Stopped in transit logic: ignition ON but speed 0
      if (v.ignition && v.speed === 0) {
        routes[routeName].stoppedInTransitCount++;
        routes[routeName].totalDelayScore += 1; // Basic scoring
      }
    });

    // Finalize averages and convert to array
    return Object.values(routes).map(r => {
      const movingVehicles = r.vehicles.filter(v => v.speed > 0);
      r.avgSpeed = movingVehicles.length > 0 
        ? movingVehicles.reduce((acc, v) => acc + v.speed, 0) / movingVehicles.length 
        : 0;
      return r;
    }).sort((a, b) => b.totalDelayScore - a.totalDelayScore || b.vehicles.length - a.vehicles.length);
  }, [vehicles]);

  // KPIs
  const criticalRoute = routeData.find(r => r.name !== 'NÃO IDENTIFICADO')?.name || "Nenhuma";
  const totalImpactedTrips = vehicles.filter(v => v.ignition && v.speed === 0).length;
  const activeRoutesCount = routeData.filter(r => r.name !== 'NÃO IDENTIFICADO').length;
  
  // Ranking Data for chart - Prioritize Historical Data if available
  const rankingData = React.useMemo(() => {
    if (history.topCongestedRoutes && history.topCongestedRoutes.length > 0) {
      return history.topCongestedRoutes.map((r, idx) => ({
         name: r.route.length > 20 ? r.route.substring(0, 20) + '...' : r.route,
         fullName: r.route,
         value: r.eventCount,
         critical: 0, // In history we don't have current critical status
         color: idx === 0 ? '#b91c1c' : idx < 3 ? '#e65100' : '#475569'
      }));
    }

    return routeData
      .filter(r => r.name !== 'NÃO IDENTIFICADO')
      .slice(0, 5)
      .map((r, idx) => ({
        name: r.name.length > 20 ? r.name.substring(0, 20) + '...' : r.name,
        fullName: r.name,
        value: r.vehicles.length,
        critical: r.stoppedInTransitCount,
        color: r.stoppedInTransitCount > 0 ? '#b91c1c' : idx === 0 ? '#0f172a' : '#475569'
      }));
  }, [history, routeData]);

  // Historical Mock - (Keeping some visual fidelity but using scale from real data)
  const historyData = [
    { time: '08:00', valor: Math.max(10, activeRoutesCount * 0.5) },
    { time: '10:00', valor: Math.max(15, activeRoutesCount * 0.8) },
    { time: '12:00', valor: Math.max(12, activeRoutesCount * 0.6) },
    { time: '14:00', valor: Math.max(20, activeRoutesCount * 1.1) },
    { time: '16:00', valor: activeRoutesCount },
  ];

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <Truck className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-bold">Analisando rotas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black tracking-tight text-slate-800 uppercase">Análise de Fluxo por Rota</h2>
        <p className="text-slate-500 text-sm font-medium">Relatório dinâmico baseado no macrocomando ativo dos veículos em campo.</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalysisKPI 
          label="ROTA MAIS CRÍTICA"
          value={criticalRoute.length > 15 ? criticalRoute.substring(0, 15) + '...' : criticalRoute}
          trend={routeData[0]?.stoppedInTransitCount > 0 ? "Foco prioritário" : "Estável"}
          trendIcon={<AlertCircle size={14} />}
          icon={<AlertTriangle size={18} className="text-red-600" />}
          bgColor="bg-red-50"
          trendColor="text-red-600"
        />
        <AnalysisKPI 
          label="VEÍCULOS PARADOS"
          value={totalImpactedTrips.toString().padStart(2, '0')}
          subLabel="Em rota, com ignição ligada"
          icon={<Clock size={18} className="text-slate-600" />}
          bgColor="bg-slate-100"
        />
        <AnalysisKPI 
          label="ROTAS ATIVAS"
          value={activeRoutesCount.toString().padStart(2, '0')}
          trend="Monitoramento em 100%"
          trendIcon={<TrendingUp size={14} />}
          icon={<Truck size={18} className="text-blue-600" />}
          bgColor="bg-blue-50"
          trendColor="text-blue-600"
        />
        <AnalysisKPI 
          label="VELOCIDADE MÉDIA"
          value={`${(vehicles.reduce((acc, v) => acc + (v.speed || 0), 0) / (vehicles.length || 1)).toFixed(0)} km/h`}
          subLabel="Geral de toda a frota"
          icon={<Timer size={18} className="text-emerald-600" />}
          bgColor="bg-emerald-50"
        />
      </div>

      {/* Ranking & Critical Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              {history.topCongestedRoutes.length > 0 ? "Trechos com Mais Lentidões (Histórico)" : "Volume por Rota (Atual)"}
            </h3>
          </div>
          <div className="p-8 flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart layout="vertical" data={rankingData} margin={{ left: 20, right: 40 }}>
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                <XAxis type="number" hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                  {rankingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4 px-2">
              {rankingData.map((item) => (
                <div key={item.fullName} className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase truncate">{item.fullName}</span>
                  <div className="flex justify-between items-end mt-1">
                    <span className="text-xl font-black text-slate-700">{item.value} {history.topCongestedRoutes.length > 0 ? 'lentidões' : 'veíc.'}</span>
                    {item.critical > 0 && <span className="text-[9px] font-bold text-red-600 uppercase flex items-center gap-1"><AlertCircle size={10} /> {item.critical} parados</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Veículos Críticos em Rota</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-50/30">
            {vehicles.filter(v => v.ignition && v.speed === 0).length > 0 ? (
              vehicles.filter(v => v.ignition && v.speed === 0).slice(0, 6).map(v => (
                <RoadAlert 
                  key={v.id}
                  road={v.plate}
                  desc={v.macro || "Rota não identificada"}
                  status=" PARADO EM OPERAÇÃO"
                  severity="error"
                  address={v.address}
                />
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-50">
                <ShieldCheck size={48} className="text-emerald-500 mb-2" />
                <p className="text-xs font-bold text-slate-600 uppercase">Tudo normal</p>
                <p className="text-[10px] text-slate-400 mt-1">Nenhum veículo parado com ignição ligada.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Trend */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Intensidade de Operação</h3>
            <p className="text-xs text-slate-400 mt-1">Estimativa de rotas ativas simuladas no tempo</p>
          </div>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReLineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Line type="monotone" dataKey="valor" stroke="#0f172a" strokeWidth={4} dot={{ r: 4, fill: '#0f172a' }} activeDot={{ r: 6 }} />
            </ReLineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Impact Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Painel Geral de Rotas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rota (Macrocomando)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Frequência</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Velocidade Média</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Eventos (Hist.)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Críticos</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status da Via</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {routeData.filter(r => r.name !== 'NÃO IDENTIFICADO').map((r) => {
                const histEvent = history.topCongestedRoutes.find(h => h.route === r.name);
                return (
                  <ImpactRow 
                    key={r.name}
                    name={r.name}
                    trips={`${r.vehicles.length} Veículos`}
                    delay={`${r.avgSpeed.toFixed(0)} km/h`}
                    trend={r.stoppedInTransitCount > 0 ? "Alerta" : "Normal"}
                    trendIcon={r.stoppedInTransitCount > 0 ? <AlertTriangle size={14}/> : <ShieldCheck size={14}/>}
                    status={r.stoppedInTransitCount > 2 ? "CONGESTIONADA" : r.stoppedInTransitCount > 0 ? "LENTA" : "FLUXO LIVRE"}
                    statusColor={r.stoppedInTransitCount > 2 ? "bg-red-50 text-red-600 border-red-200" : r.stoppedInTransitCount > 0 ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}
                    criticalCount={r.stoppedInTransitCount}
                    histCount={histEvent?.eventCount || 0}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AnalysisKPI: React.FC<{
  label: string;
  value: string;
  trend?: string;
  trendIcon?: React.ReactNode;
  subLabel?: string;
  icon: React.ReactNode;
  bgColor: string;
  trendColor?: string;
}> = ({ label, value, trend, trendIcon, subLabel, icon, bgColor, trendColor }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 hover:border-slate-400 transition-all group">
    <div className="flex items-center justify-between">
      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</span>
      <span className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", bgColor)}>{icon}</span>
    </div>
    <div>
      <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{value}</p>
      {trend ? (
        <p className={cn("text-[10px] font-black flex items-center gap-1 mt-2 uppercase tracking-tight", trendColor)}>
          {trendIcon} {trend}
        </p>
      ) : (
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight mt-2">{subLabel}</p>
      )}
    </div>
  </div>
);

const RoadAlert: React.FC<{
  road: string;
  desc: string;
  status: string;
  severity: 'error' | 'warning' | 'info';
  address?: string;
}> = ({ road, desc, status, severity, address }) => (
  <div className={cn(
    "p-4 border border-slate-200 rounded-xl flex gap-3 transition-all hover:bg-white hover:shadow-md",
    severity === 'error' ? "bg-red-50/30 border-l-4 border-l-red-600" : 
    severity === 'warning' ? "bg-amber-50/30 border-l-4 border-l-amber-500" : "bg-slate-50/30 border-l-4 border-l-slate-400"
  )}>
    <div className={cn(
      "mt-0.5",
      severity === 'error' ? "text-red-500" : 
      severity === 'warning' ? "text-amber-500" : "text-slate-400"
    )}>
      <AlertCircle size={16} />
    </div>
    <div className="overflow-hidden">
      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{road}</p>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest line-clamp-1">{desc}</p>
      <p className="text-[9px] text-slate-400 font-medium mt-1 truncate">{address}</p>
      <div className="flex items-center gap-1.5 mt-2">
        <span className={cn(
          "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest",
          severity === 'error' ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
        )}>{status}</span>
      </div>
    </div>
  </div>
);

const ImpactRow: React.FC<{
  name: string;
  trips: string;
  delay: string;
  trend: string;
  trendIcon: React.ReactNode;
  status: string;
  statusColor: string;
  criticalCount: number;
  histCount: number;
}> = ({ name, trips, delay, trend, trendIcon, status, statusColor, criticalCount, histCount }) => (
  <tr className="hover:bg-slate-50 transition-colors group">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-[10px] uppercase",
          criticalCount > 0 ? "bg-red-600" : "bg-slate-600"
        )}>
          {name.substring(0, 2)}
        </div>
        <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{name}</span>
      </div>
    </td>
    <td className="px-6 py-4 text-center">
      <span className="text-xs font-black text-slate-600">{trips}</span>
    </td>
    <td className="px-6 py-4 text-center text-xs font-black text-slate-400">
      {delay}
    </td>
    <td className="px-6 py-4 text-center">
      <span className="text-xs font-black text-slate-600">{histCount}</span>
    </td>
    <td className="px-6 py-4">
      <div className="flex flex-col items-center gap-1">
        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest", criticalCount > 0 ? "text-red-600 bg-red-100" : "text-emerald-600 bg-emerald-100")}>
          {trendIcon} {trend}
        </div>
      </div>
    </td>
    <td className="px-6 py-4 text-right">
      <span className={cn("px-3 py-1 text-[9px] font-black rounded-md tracking-widest border uppercase", statusColor)}>
        {status}
      </span>
    </td>
  </tr>
);
