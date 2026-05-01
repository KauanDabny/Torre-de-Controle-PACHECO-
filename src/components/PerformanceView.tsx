import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Trophy, 
  TrendingUp, 
  AlertTriangle, 
  Gauge, 
  Clock, 
  Map as MapIcon,
  Zap,
  ShieldCheck,
  ChevronRight,
  TrendingDown,
  Activity,
  FileDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { DriverScoreboard, FleetMetrics } from '../types';
import { cn } from '../lib/utils';

export const PerformanceView: React.FC = () => {
  const [data, setData] = useState<{
    scoreboard: DriverScoreboard[];
    overallFleetMetrics: FleetMetrics;
    lastUpdate: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get('/api/sascar/metrics');
        setData(response.data);
      } catch (err) {
        console.error('Error fetching fleet metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-container"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Carregando Indicadores Sascar...</p>
        </div>
      </div>
    );
  }

  const { scoreboard, overallFleetMetrics } = data;

  const rpmData = [
    { name: 'Extra Verde', value: overallFleetMetrics.rpmBands.extraGreen * 100, color: '#065f46' },
    { name: 'Verde', value: overallFleetMetrics.rpmBands.green * 100, color: '#1e40af' },
    { name: 'Transição', value: overallFleetMetrics.rpmBands.transition * 100, color: '#f59e0b' },
    { name: 'Amarela', value: overallFleetMetrics.rpmBands.yellow * 100, color: '#c2410c' },
    { name: 'Perigo', value: overallFleetMetrics.rpmBands.danger * 100, color: '#991b1b' },
  ];

  const timeDistribution = [
    { name: 'Movimento', value: overallFleetMetrics.movingTimePercentage * 100, color: '#3b82f6' },
    { name: 'Parado Ligado', value: overallFleetMetrics.stoppedTimePercentage * 100, color: '#fb923c' },
    { name: 'Desligado', value: overallFleetMetrics.stoppedOffTimePercentage * 100, color: '#94a3b8' },
  ];

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-full overflow-y-auto max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary-container p-2 rounded-lg text-white">
              <TrendingUp size={20} />
            </div>
            <h2 className="display-lg text-primary-container">Performance da Frota</h2>
          </div>
          <p className="text-slate-500 font-medium">Indicadores de condução e eficiência extraídos via Sascar.</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button className="bg-white text-slate-600 px-6 py-2.5 rounded-xl border border-outline-variant font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
            <FileDown size={16} /> Relatórios BI
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Última Atualização</p>
            <p className="font-mono text-sm font-bold text-primary-container">
              {new Date(data.lastUpdate).toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {/* Main KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          label="% Movimento" 
          value={`${(overallFleetMetrics.movingTimePercentage * 100).toFixed(1)}%`}
          subValue="Meta: > 60%"
          icon={<Zap size={20} className="text-blue-500" />}
          trend={+2.4}
        />
        <KpiCard 
          label="Km Rodados" 
          value={overallFleetMetrics.kmsTraveled.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          subValue="Total do Período"
          icon={<MapIcon size={20} className="text-emerald-500" />}
          trend={+15.2}
        />
        <KpiCard 
          label="Infrações / 1000km" 
          value={overallFleetMetrics.infractionRatePer1000km.toFixed(2)}
          subValue="Média da Frota"
          icon={<AlertTriangle size={20} className="text-red-500" />}
          trend={-5.1}
          inverseTrend
        />
        <KpiCard 
          label="Score de Condução" 
          value={overallFleetMetrics.drivingScore.toFixed(1)}
          subValue="Média Geral (0-5)"
          icon={<Trophy size={20} className="text-amber-500" />}
          trend={+0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* RPM Distribution */}
        <div className="lg:col-span-8 bg-white p-8 rounded-2xl border border-outline-variant shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="font-black text-primary-container uppercase tracking-tight flex items-center gap-2">
                <Gauge size={18} /> Faixas de RPM (Tempo em Movimento)
              </h3>
              <p className="text-xs text-slate-500 font-medium">Distribuição percentual do tempo de motor ligado em movimento.</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#065f46]" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Extra Verde</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#1e40af]" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Verde</span>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rpmData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                  {rpmData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Distribution */}
        <div className="lg:col-span-4 bg-white p-8 rounded-2xl border border-outline-variant shadow-sm flex flex-col">
          <div className="mb-8">
            <h3 className="font-black text-primary-container uppercase tracking-tight flex items-center gap-2">
              <Clock size={18} /> Utilização do Tempo
            </h3>
            <p className="text-xs text-slate-500 font-medium">Divisão do tempo total do motor.</p>
          </div>

          <div className="flex-1 min-h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={timeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {timeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 space-y-3">
             <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
               <span className="text-[10px] font-black text-blue-700 uppercase">Eficiência Horária</span>
               <span className="text-sm font-black text-blue-900">84.2%</span>
             </div>
          </div>
        </div>
      </div>

      {/* Driver Scoreboard */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-8 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 gap-4">
          <div>
            <h3 className="font-black text-primary-container uppercase tracking-tight flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" /> Ranking de Performance - Top 5
            </h3>
            <p className="text-xs text-slate-500 font-medium">Os motoristas com melhores indicadores de condução no período.</p>
          </div>
          <button className="text-[10px] font-black text-primary-container uppercase tracking-widest hover:underline flex items-center gap-1">
            Ver Ranking Completo <ChevronRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50/30">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Motorista</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classificação</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Km Rodados</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">% Verde</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {scoreboard.map((driver, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                        idx === 0 ? "bg-amber-100 text-amber-600" :
                        idx === 1 ? "bg-slate-100 text-slate-500" :
                        idx === 2 ? "bg-orange-100 text-orange-600" : "bg-slate-50 text-slate-400"
                      )}>
                        {idx + 1}
                      </div>
                      <span className="font-bold text-slate-900">{driver.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      driver.category.includes('Elite') ? "bg-amber-100 text-amber-700" :
                      driver.category.includes('Muito Bom') ? "bg-emerald-100 text-emerald-700" :
                      driver.category.includes('Bom') ? "bg-blue-100 text-blue-700" :
                      driver.category.includes('Médio') ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                    )}>
                      {driver.category}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-mono text-xs font-bold text-slate-600">
                      {driver.metrics.kmsTraveled.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} km
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-black text-primary-container">{(driver.metrics.rpmBands.green * 100).toFixed(1)}%</span>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${driver.metrics.rpmBands.green * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="font-black text-lg text-primary-container">{driver.metrics.drivingScore.toFixed(1)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ 
  label: string; 
  value: string; 
  subValue: string; 
  icon: React.ReactNode; 
  trend?: number;
  inverseTrend?: boolean;
}> = ({ label, value, subValue, icon, trend, inverseTrend }) => {
  const isPositive = trend && trend > 0;
  const isGood = inverseTrend ? !isPositive : isPositive;

  return (
    <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
          {icon}
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full",
            isGood ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h4 className="display-sm text-primary-container font-black">{value}</h4>
        <p className="text-[10px] font-medium text-slate-400 mt-1">{subValue}</p>
      </div>
      <div className="absolute right-0 bottom-0 opacity-[0.03] scale-150 p-4 pointer-events-none">
        {icon}
      </div>
    </div>
  );
};
