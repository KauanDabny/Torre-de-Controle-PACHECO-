import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  FileDown,
  MoreVertical
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';

const trendData = [
  { name: 'Semana 1', onTime: 80, delayed: 10 },
  { name: 'Semana 2', onTime: 85, delayed: 8 },
  { name: 'Semana 3', onTime: 75, delayed: 15 },
  { name: 'Semana 4', onTime: 92, delayed: 5 },
];

const reasonsData = [
  { name: 'Congestionamento', value: 42 },
  { name: 'Docas Lotadas', value: 28 },
  { name: 'Manutenção', value: 18 },
  { name: 'Falha Sistêmica', value: 12 },
];

export const PerformanceView: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Title */}
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="display-lg text-primary-container">Painel de Performance</h2>
          <p className="text-slate-500 font-medium">Métricas detalhadas de nivel de serviço e SLA operacional.</p>
        </div>
        <button className="bg-primary-container text-white px-6 py-2.5 rounded font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-90 w-full sm:w-auto justify-center">
          <FileDown size={14} /> Relatório Global
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PerfCard 
          label="SLA GLOBAL" 
          value="94.2%" 
          trend="+1.2%" 
          trendUp 
          icon={<ShieldCheck size={18} />} 
          progress={94.2}
        />
        <PerfCard 
          label="ENTREGAS NO PRAZO" 
          value="2.480" 
          subLabel="Volume total deste mês"
          icon={<CheckCircle2 size={18} className="text-teal-600" />} 
        />
        <PerfCard 
          label="ENTREGAS EM ATRASO" 
          value="152" 
          trend="-4%" 
          trendUp={false} 
          icon={<AlertCircle size={18} className="text-error" />} 
          isError
        />
        <PerfCard 
          label="ATRASO MÉDIO" 
          value="42 min" 
          subLabel="Calculado sobre ocorrências"
          icon={<Clock size={18} className="text-secondary" />} 
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-outline-variant rounded-xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h3 className="title-sm text-primary-container font-black">Tendência Mensal: On-time vs Delayed</h3>
            <div className="flex gap-4 text-[10px] font-black tracking-widest uppercase">
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-primary-container rounded-sm"></span> No Prazo</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-error rounded-sm"></span> Atraso</div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barGap={12}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="onTime" fill="#002626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="delayed" fill="#ba1a1a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-outline-variant rounded-xl p-8 shadow-sm">
          <h3 className="title-sm text-primary-container font-black mb-10">Motivos de Atraso</h3>
          <div className="space-y-8">
            {reasonsData.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                  <span>{item.name}</span>
                  <span className="text-primary-container">{item.value}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary-container h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${item.value}%`, opacity: 1 - (reasonsData.indexOf(item) * 0.2) }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-8 border-b border-outline-variant flex justify-between items-center bg-slate-50/30">
          <div>
            <h3 className="title-sm text-primary-container font-black">Performance por Operação: J&T Express</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Dados consolidados por rota regional</p>
          </div>
          <button className="bg-primary-container text-white px-6 py-2.5 rounded font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-90">
            <FileDown size={14} /> Exportar PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 label-caps text-slate-500 border-b border-outline-variant">
                <th className="px-6 py-4">Rota / Região</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Volume</th>
                <th className="px-6 py-4 text-right">SLA Real</th>
                <th className="px-6 py-4 text-right">Meta SLA</th>
                <th className="px-6 py-4 text-center">Tendência</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-outline-variant/30">
              <PerfRow 
                route="São Paulo - Interior (HUB-01)" status="EM OPERAÇÃO" volume="1.240" real="97.8%" meta="96.0%" trend="up"
              />
              <PerfRow 
                route="Rio de Janeiro - Metropolitana" status="EM OPERAÇÃO" volume="890" real="94.2%" meta="96.0%" trend="stable"
              />
              <PerfRow 
                route="Belo Horizonte - Rota Sul" status="ALERTA" volume="350" real="88.5%" meta="96.0%" trend="down" isAlert
              />
              <PerfRow 
                route="Curitiba - Eixo Logístico" status="EM OPERAÇÃO" volume="520" real="95.1%" meta="96.0%" trend="up"
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PerfCard: React.FC<{
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  subLabel?: string;
  icon: React.ReactNode;
  progress?: number;
  isError?: boolean;
}> = ({ label, value, trend, trendUp, subLabel, icon, progress, isError }) => (
  <div className="bg-white border border-outline-variant p-6 rounded-xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start">
      <span className="label-caps !text-[11px] text-slate-400">{label}</span>
      <div className="p-1.5 rounded-lg bg-surface-container-low">{icon}</div>
    </div>
    <div className="flex items-baseline gap-2">
      <span className={cn("headline-md !text-3xl font-black", isError ? "text-error" : "text-primary-container")}>{value}</span>
      {trend && (
        <span className={cn("text-[11px] font-black px-1.5 py-0.5 rounded", trendUp ? "text-teal-600 bg-teal-50" : "text-error bg-error/5")}>
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      )}
    </div>
    {progress !== undefined ? (
      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
        <div className="bg-primary-container h-full" style={{ width: `${progress}%` }}></div>
      </div>
    ) : (
      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{subLabel}</p>
    )}
  </div>
);

const PerfRow: React.FC<{
  route: string;
  status: string;
  volume: string;
  real: string;
  meta: string;
  trend: 'up' | 'stable' | 'down';
  isAlert?: boolean;
}> = ({ route, status, volume, real, meta, trend, isAlert }) => (
  <tr className="hover:bg-teal-50/30 transition-colors">
    <td className="px-6 py-4 font-bold text-primary-container tracking-tight">{route}</td>
    <td className="px-6 py-4">
      <span className={cn(
        "px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border",
        isAlert ? "bg-error-container text-error border-error/10" : "bg-teal-100 text-teal-800 border-teal-800/10"
      )}>{status}</span>
    </td>
    <td className="px-6 py-4 text-right data-mono text-slate-700">{volume}</td>
    <td className={cn("px-6 py-4 text-right font-black", isAlert ? "text-error" : "text-teal-700")}>{real}</td>
    <td className="px-6 py-4 text-right text-slate-400 font-bold">{meta}</td>
    <td className="px-6 py-4 text-center">
      <div className="flex justify-center">
        {trend === 'up' && <TrendingUp size={16} className="text-teal-600" />}
        {trend === 'stable' && <Minus size={16} className="text-slate-400" />}
        {trend === 'down' && <TrendingDown size={16} className="text-error" />}
      </div>
    </td>
  </tr>
);
