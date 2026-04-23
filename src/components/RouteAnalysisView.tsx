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
  Minus
} from 'lucide-react';
import { cn } from '../lib/utils';

const rankingData = [
  { name: 'BR-116 (Dutra)', value: 450, color: '#002626' },
  { name: 'BR-381 (Fernão Dias)', value: 320, color: '#4d6262' },
  { name: 'BR-262', value: 180, color: '#3a6565' },
  { name: 'SP-070 (Airton Senna)', value: 120, color: '#a2cfce' },
];

const historyData = [
  { time: '00:00', dutra: 40, fernão: 30 },
  { time: '04:00', dutra: 20, fernão: 45 },
  { time: '08:00', dutra: 85, fernão: 60 },
  { time: '12:00', dutra: 55, fernão: 35 },
  { time: '16:00', dutra: 95, fernão: 70 },
  { time: '20:00', dutra: 45, fernão: 90 },
  { time: 'Agora', dutra: 65, fernão: 40 },
];

export const RouteAnalysisView: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h2 className="display-lg text-primary-container">Análise de Rodovias e Vias</h2>
        <p className="text-slate-500 text-sm font-medium">Relatório consolidado de fluxos e gargalos logísticos em tempo real.</p>
      </div>

      {/* KPIs Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalysisKPI 
          label="RODOVIA MAIS CRÍTICA"
          value="BR-116 Dutra"
          trend="+12% vs ontem"
          trendIcon={<TrendingUp size={14} />}
          icon={<AlertTriangle size={18} className="text-error" />}
          bgColor="bg-error-container"
          trendColor="text-error"
        />
        <AnalysisKPI 
          label="ATRASO ACUMULADO"
          value="1.240h"
          subLabel="Total frota ativa"
          icon={<Clock size={18} className="text-secondary" />}
          bgColor="bg-secondary-container"
        />
        <AnalysisKPI 
          label="VIAGENS IMPACTADAS"
          value="842"
          trend="85% monitoradas"
          trendIcon={<TrendingUp size={14} />}
          icon={<Truck size={18} className="text-primary-container" />}
          bgColor="bg-primary-fixed"
          trendColor="text-teal-600"
        />
        <AnalysisKPI 
          label="TEMPO MÉDIO LENTIDÃO"
          value="52min"
          subLabel="Por trecho congestionado"
          icon={<Timer size={18} className="text-tertiary" />}
          bgColor="bg-tertiary-fixed"
        />
      </div>

      {/* Ranking & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-outline-variant flex items-center justify-between">
            <h3 className="title-sm text-primary-container font-bold">Ranking de Atrasos por Rodovia</h3>
            <button className="text-primary-container text-xs font-bold flex items-center gap-1 hover:underline">
              VER TUDO <ArrowIcon />
            </button>
          </div>
          <div className="p-8 flex-1">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart layout="vertical" data={rankingData} margin={{ left: 20, right: 40 }}>
                <YAxis dataKey="name" type="category" hide />
                <XAxis type="number" hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {rankingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Legend Mock */}
            <div className="space-y-4 mt-[-40px]">
              {rankingData.map((item) => (
                <div key={item.name} className="flex justify-between items-center text-sm">
                  <span className="font-bold text-primary-container">{item.name}</span>
                  <span className="font-bold text-slate-500 font-mono">{item.value}h</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-outline-variant shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-outline-variant">
            <h3 className="title-sm text-primary-container font-bold">Alertas de Trechos Críticos</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-surface-container-lowest">
            <RoadAlert 
              road="BR-116 KM 210"
              desc="Lentidão extrema: 45min de atraso."
              status="CRÍTICO"
              severity="error"
              icon="report"
            />
            <RoadAlert 
              road="BR-381 Trevo de Sabará"
              desc="Acidente envolvendo bitrem. Pista parcial."
              status="ATENÇÃO"
              severity="warning"
              icon="car_crash"
            />
            <RoadAlert 
              road="BR-101 Angra dos Reis"
              desc="Neblina densa. Velocidade reduzida."
              status="MONITORAMENTO"
              severity="info"
              icon="cloud"
            />
          </div>
        </div>
      </div>

      {/* Historical Trend */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="title-sm text-primary-container font-bold">Histórico de Lentidão por Rodovia</h3>
            <p className="text-xs text-slate-400 mt-1">Comparativo de picos de atraso nas últimas 24 horas</p>
          </div>
          <div className="flex gap-4">
            <LegendItem color="bg-primary-container" label="Dutra" />
            <LegendItem color="bg-primary-fixed-dim" label="Fernão Dias" />
          </div>
        </div>
        <div className="h-64 w-full">
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
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Line type="monotone" dataKey="dutra" stroke="#002626" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="fernão" stroke="#a2cfce" strokeWidth={3} strokeDasharray="5 5" dot={false} />
            </ReLineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Impact Table */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant bg-slate-50/50">
          <h3 className="title-sm text-primary-container font-bold">Impacto Detalhado por Rodovia</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-outline-variant">
                <th className="px-6 py-4 label-caps text-slate-500">RODOVIA</th>
                <th className="px-6 py-4 label-caps text-slate-500">VIAGENS AFETADAS</th>
                <th className="px-6 py-4 label-caps text-slate-500">ATRASO MÉDIO</th>
                <th className="px-6 py-4 label-caps text-slate-500">TENDÊNCIA</th>
                <th className="px-6 py-4 label-caps text-slate-500">STATUS ATUAL</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              <ImpactRow 
                code="116"
                name="BR-116 (Dutra)"
                trips="142 viagens"
                delay="65 min"
                trend="Alta"
                trendIcon={<TrendingUp size={14}/>}
                status="CONGESTIONADO"
                statusColor="bg-error-container text-error"
              />
               <ImpactRow 
                code="381"
                name="BR-381 (Fernão Dias)"
                trips="98 viagens"
                delay="38 min"
                trend="Estável"
                trendIcon={<Minus size={14}/>}
                status="LENTO"
                statusColor="bg-tertiary-fixed text-tertiary"
                trendColor="text-slate-500"
              />
               <ImpactRow 
                code="262"
                name="BR-262"
                trips="45 viagens"
                delay="12 min"
                trend="Baixa"
                trendIcon={<TrendingDown size={14}/>}
                status="NORMAL"
                statusColor="bg-primary-fixed text-primary-container"
                trendColor="text-teal-600"
              />
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
  <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-4 hover:border-primary-container transition-all">
    <div className="flex items-center justify-between">
      <span className="text-slate-500 label-caps font-bold">{label}</span>
      <span className={cn("p-2 rounded-lg", bgColor)}>{icon}</span>
    </div>
    <div>
      <p className="headline-md text-primary-container font-black">{value}</p>
      {trend ? (
        <p className={cn("text-xs font-bold flex items-center gap-1 mt-1", trendColor)}>
          {trendIcon} {trend}
        </p>
      ) : (
        <p className="text-slate-400 text-xs mt-1">{subLabel}</p>
      )}
    </div>
  </div>
);

const RoadAlert: React.FC<{
  road: string;
  desc: string;
  status: string;
  severity: 'error' | 'warning' | 'info';
  icon: string;
}> = ({ road, desc, status, severity }) => (
  <div className={cn(
    "p-4 border-l-4 rounded-r-lg flex gap-4",
    severity === 'error' ? "bg-error/5 border-error" : 
    severity === 'warning' ? "bg-amber-50 border-amber-500" : "bg-slate-50 border-slate-300"
  )}>
    <div className={cn(
      "mt-1",
      severity === 'error' ? "text-error" : 
      severity === 'warning' ? "text-amber-600" : "text-slate-500"
    )}>
      <AlertCircle size={18} />
    </div>
    <div>
      <p className="text-sm font-bold text-primary-container">{road}</p>
      <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">{desc}</p>
      <p className={cn(
        "text-[10px] mt-1.5 font-black tracking-widest",
        severity === 'error' ? "text-error" : 
        severity === 'warning' ? "text-amber-700" : "text-slate-500"
      )}>STATUS: {status}</p>
    </div>
  </div>
);

const ImpactRow: React.FC<{
  code: string;
  name: string;
  trips: string;
  delay: string;
  trend: string;
  trendIcon: React.ReactNode;
  status: string;
  statusColor: string;
  trendColor?: string;
}> = ({ code, name, trips, delay, trend, trendIcon, status, statusColor, trendColor }) => (
  <tr className="hover:bg-slate-50 transition-colors">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-primary-container text-white flex items-center justify-center font-bold text-[10px]">{code}</div>
        <span className="text-sm font-bold text-primary-container">{name}</span>
      </div>
    </td>
    <td className="px-6 py-4 text-sm font-medium text-slate-700">{trips}</td>
    <td className="px-6 py-4 text-sm font-medium text-slate-700">{delay}</td>
    <td className={cn("px-6 py-4 font-bold flex items-center gap-1 text-sm", trendColor || "text-error")}>
      {trendIcon} {trend}
    </td>
    <td className="px-6 py-4">
      <span className={cn("px-3 py-1 text-[10px] font-extrabold rounded-full tracking-wider border border-current/10", statusColor)}>
        {status}
      </span>
    </td>
    <td className="px-6 py-4 text-right">
      <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 group-hover:text-primary-container transition-colors">
        <MoreVertical size={16} />
      </button>
    </td>
  </tr>
);

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <span className={cn("w-3 h-3 rounded-full", color)}></span>
    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</span>
  </div>
);

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);
