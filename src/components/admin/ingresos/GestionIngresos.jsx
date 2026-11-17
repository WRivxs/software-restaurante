// src/components/admin/GestionIngresos.jsx
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { formatCOP } from '../../../lib/utils';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// ── Helpers de fecha ──────────────────────────────────────────────────────────
function getHoy()          { return new Date().toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).slice(0, 10); }
function getInicioSemana() { const d = new Date(); d.setDate(d.getDate() - 6); return d.toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).slice(0, 10); }
function getInicioMes()    { const d = new Date(); d.setDate(1);              return d.toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).slice(0, 10); }

const PERIODOS = [
  { key: 'hoy',    label: 'Hoy',          fn: getHoy },
  { key: 'semana', label: 'Últimos 7 días', fn: getInicioSemana },
  { key: 'mes',    label: 'Mes actual',    fn: getInicioMes },
];

const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ── Tooltip personalizado ─────────────────────────────────────────────────────
function TooltipCustom({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-3 shadow-2xl">
      <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white text-[11px] font-bold">{p.name}: </span>
          <span className="text-[11px] font-black" style={{ color: p.color }}>
            {typeof p.value === 'number' ? formatCOP(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Componente KPI ────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon, isCurrency = true }) {
  const colors = {
    yellow: { text: 'text-[#FFC107]', border: 'border-[#FFC107]/15', glow: 'shadow-[0_0_30px_rgba(255,193,7,0.05)]' },
    green:  { text: 'text-[#4ADE80]', border: 'border-[#4ADE80]/15', glow: 'shadow-[0_0_30px_rgba(74,222,128,0.05)]' },
    red:    { text: 'text-[#F87171]', border: 'border-[#F87171]/15', glow: 'shadow-[0_0_30px_rgba(248,113,113,0.05)]' },
    blue:   { text: 'text-[#60A5FA]', border: 'border-[#60A5FA]/15', glow: 'shadow-[0_0_30px_rgba(96,165,250,0.05)]' },
  };
  const c = colors[color] || colors.yellow;

  return (
    <div className={`relative bg-[#111111] border ${c.border} ${c.glow} rounded-[10px] p-5 flex flex-col justify-between h-32 overflow-hidden group hover:border-opacity-40 transition-all`}>
      <div className="flex justify-between items-start">
        <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.2em]">{label}</p>
        <span className="text-2xl opacity-10 group-hover:opacity-20 transition-opacity">{icon}</span>
      </div>
      <div>
        <p className={`text-2xl font-black tracking-tight ${c.text}`}>
          {isCurrency ? formatCOP(value || 0) : (value ?? 0)}
        </p>
        <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

// ── Componente Chart Card ─────────────────────────────────────────────────────
function ChartCard({ title, subtitle, accent = '#FFC107', children, className = '' }) {
  return (
    <div className={`bg-[#111111] border border-white/[0.06] rounded-[10px] p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">{title}</p>
      </div>
      <p className="text-white text-sm font-bold mb-5">{subtitle}</p>
      {children}
    </div>
  );
}

// ── Iconos SVG ────────────────────────────────────────────────────────────────
const BI_ICONS = {
  total: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  efectivo: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  transferencia: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  diferencia: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  stats: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function GestionIngresos() {
  const [periodo, setPeriodo] = useState('semana');

  const desde = useMemo(() => {
    const p = PERIODOS.find(p => p.key === periodo);
    return p ? p.fn() : getInicioSemana();
  }, [periodo]);

  // Query principal: cierres de caja
  const { data: cierres = [], isLoading } = useQuery({
    queryKey: ['ingresos_bi', periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cierres_caja')
        // Usamos la relación con usuarios. Si hay error de fkey, se ajustará a 'usuarios(nombre)'
        .select('*, usuarios(nombre)')
        .eq('estado', 'CERRADA')
        .gte('fecha_cierre', desde + 'T00:00:00')
        .order('fecha_cierre', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2, // 2 min cache
  });

  // ── Métricas calculadas ───────────────────────────────────────────────────
  const metricas = useMemo(() => {
    const totalIngresos     = cierres.reduce((s, c) => s + (c.ventas_efectivo || 0) + (c.ventas_transferencia || 0), 0);
    const totalEfectivo     = cierres.reduce((s, c) => s + (c.ventas_efectivo || 0), 0);
    const totalTransferencia= cierres.reduce((s, c) => s + (c.ventas_transferencia || 0), 0);
    const totalDiferencia   = cierres.reduce((s, c) => s + (c.diferencia || 0), 0);
    const totalEsperado     = cierres.reduce((s, c) => s + (c.total_esperado || 0), 0);
    const numCierres        = cierres.length;
    const promedio          = numCierres > 0 ? Math.round(totalIngresos / numCierres) : 0;
    const pctEfectivo       = totalIngresos > 0 ? ((totalEfectivo / totalIngresos) * 100).toFixed(1) : 0;
    const pctTransferencia  = totalIngresos > 0 ? ((totalTransferencia / totalIngresos) * 100).toFixed(1) : 0;

    return { totalIngresos, totalEfectivo, totalTransferencia, totalDiferencia, totalEsperado, numCierres, promedio, pctEfectivo, pctTransferencia };
  }, [cierres]);

  // ── Datos para gráfico de área (tendencia) ────────────────────────────────
  const dataTendencia = useMemo(() => {
    return cierres.map(c => {
      const fecha = new Date(c.fecha_cierre + (c.fecha_cierre.includes('Z') ? '' : '-05:00'));
      const label = periodo === 'hoy'
        ? fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        : periodo === 'mes'
        ? `${fecha.getDate()} ${MESES_CORTO[fecha.getMonth()]}`
        : DIAS[fecha.getDay()];
      return {
        label,
        ingresos: (c.ventas_efectivo || 0) + (c.ventas_transferencia || 0),
        efectivo: c.ventas_efectivo || 0,
        transferencia: c.ventas_transferencia || 0,
      };
    });
  }, [cierres, periodo]);

  // ── Datos para gráfico de barras por día de semana ────────────────────────
  const dataPorDia = useMemo(() => {
    const acum = {};
    DIAS.forEach(d => { acum[d] = { dia: d, ingresos: 0, count: 0 }; });
    cierres.forEach(c => {
      const dow = DIAS[new Date(c.fecha_cierre).getDay()];
      acum[dow].ingresos += (c.ventas_efectivo || 0) + (c.ventas_transferencia || 0);
      acum[dow].count++;
    });
    return Object.values(acum);
  }, [cierres]);

  // ── Datos para pie de métodos de pago ─────────────────────────────────────
  const dataPago = useMemo(() => [
    { name: 'Efectivo',       value: metricas.totalEfectivo,      color: '#FFC107' },
    { name: 'Transferencia',  value: metricas.totalTransferencia,  color: '#60A5FA' },
  ], [metricas]);

  // ── Ejes Y formateados ────────────────────────────────────────────────────
  const fmtY = v => {
    if (v >= 1000000) return `$${(v/1000000).toFixed(1)}M`;
    if (v >= 1000)    return `$${(v/1000).toFixed(0)}k`;
    return `$${v}`;
  };

  const CHART_STYLE = {
    cartesian: { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.04)', vertical: false },
    xAxis:     { axisLine: false, tickLine: false, tick: { fill: '#52525b', fontSize: 10, fontWeight: 700 } },
    yAxis:     { axisLine: false, tickLine: false, tick: { fill: '#52525b', fontSize: 10 }, tickFormatter: fmtY },
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse pb-10">
        <div className="h-8 bg-white/5 rounded-lg w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-[#111] rounded-[10px]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="h-72 bg-[#111] rounded-[10px]" />)}
        </div>
      </div>
    );
  }

  const sinDatos = cierres.length === 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tighter uppercase">Panel de Ingresos</h1>
          <p className="text-zinc-500 text-xs font-medium mt-1">
            Auditoría financiera · Basado en cierres de caja
          </p>
        </div>

        {/* Selector de período */}
        <div className="flex gap-1 bg-[#111111] border border-white/[0.06] rounded-[8px] p-1">
          {PERIODOS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              className={`px-4 py-2 rounded-[6px] text-[10px] font-black uppercase tracking-widest transition-all ${
                periodo === p.key
                  ? 'bg-[#FFC107] text-black shadow-sm'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Ingresos Totales"
          value={metricas.totalIngresos}
          sub={`${metricas.numCierres} cierre${metricas.numCierres !== 1 ? 's' : ''} de caja`}
          color="yellow" icon={BI_ICONS.total}
        />
        <KpiCard
          label="Ventas Efectivo"
          value={metricas.totalEfectivo}
          sub={`${metricas.pctEfectivo}% del total`}
          color="green" icon={BI_ICONS.efectivo}
        />
        <KpiCard
          label="Ventas Transferencia"
          value={metricas.totalTransferencia}
          sub={`${metricas.pctTransferencia}% del total`}
          color="blue" icon={BI_ICONS.transferencia}
        />
        <KpiCard
          label="Diferencia Acumulada"
          value={metricas.totalDiferencia}
          sub={metricas.totalDiferencia === 0 ? 'Sin faltantes' : metricas.totalDiferencia > 0 ? 'Sobrante' : 'Faltante'}
          color={metricas.totalDiferencia >= 0 ? 'green' : 'red'} icon={BI_ICONS.diferencia}
        />
      </div>

      {/* ── Sin datos ── */}
      {sinDatos ? (
        <div className="flex flex-col items-center justify-center h-64 bg-[#111111] border border-white/[0.06] rounded-[10px] gap-4">
          <div className="text-zinc-800">
            {BI_ICONS.stats}
          </div>
          <p className="text-zinc-600 font-black text-[10px] uppercase tracking-[0.3em]">
            Sin cierres de caja en este período
          </p>
        </div>
      ) : (
        <>
          {/* ── Gráficas ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Gráfico Área: Tendencia ── */}
            <ChartCard
              title="Tendencia de ingresos"
              subtitle={`Flujo de ventas — ${PERIODOS.find(p=>p.key===periodo)?.label}`}
              accent="#FFC107"
            >
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={dataTendencia} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#FFC107" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FFC107" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradEfectivo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4ADE80" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradTransf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#60A5FA" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...CHART_STYLE.cartesian} />
                  <XAxis dataKey="label" {...CHART_STYLE.xAxis} />
                  <YAxis {...CHART_STYLE.yAxis} />
                  <Tooltip content={<TooltipCustom />} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10, fontWeight: 700, color: '#71717a' }} />
                  <Area type="monotone" dataKey="ingresos"      name="Total"         stroke="#FFC107" strokeWidth={2} fill="url(#gradIngresos)" dot={{ fill:'#FFC107', r:3 }} />
                  <Area type="monotone" dataKey="efectivo"      name="Efectivo"      stroke="#4ADE80" strokeWidth={1.5} fill="url(#gradEfectivo)" strokeDasharray="4 2" dot={false} />
                  <Area type="monotone" dataKey="transferencia" name="Transferencia" stroke="#60A5FA" strokeWidth={1.5} fill="url(#gradTransf)"   strokeDasharray="4 2" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ── Mix de Pagos (Pie Chart) ── */}
            <ChartCard
              title="Mix de Métodos de Pago"
              subtitle="Participación Efectivo vs Transferencia"
              accent="#60A5FA"
            >
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-full sm:w-[55%] h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataPago}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {dataPago.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<TooltipCustom />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-col gap-4 flex-1 w-full">
                  {dataPago.map(item => (
                    <div key={item.name}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                          <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{item.name}</span>
                        </div>
                        <span className="font-black text-[10px]" style={{ color: item.color }}>
                          {metricas.totalIngresos > 0 ? ((item.value / metricas.totalIngresos) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            background: item.color,
                            width: metricas.totalIngresos > 0 ? `${(item.value / metricas.totalIngresos) * 100}%` : '0%'
                          }}
                        />
                      </div>
                      <p className="text-zinc-600 text-[9px] font-bold mt-1">{formatCOP(item.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>

          {/* ── Tabla de cierres ── */}
          <ChartCard
            title="Detalle de cierres de caja"
            subtitle={`${cierres.length} registro${cierres.length !== 1 ? 's' : ''} en el período`}
            accent="#4ADE80"
          >
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Fecha', 'Cajero', 'Apertura', 'Cierre', 'Efectivo', 'Transferencia', 'Total', 'Diferencia'].map(h => (
                      <th key={h} className="pb-3 pr-6 text-zinc-600 font-black text-[8px] uppercase tracking-[0.2em] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...cierres].reverse().map((c, i) => {
                    const total = (c.ventas_efectivo || 0) + (c.ventas_transferencia || 0);
                    const dif   = c.diferencia || 0;
                    const fecha = new Date(c.fecha_cierre);
                    const fmtFecha = fecha.toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' });
                    const fmtHora  = h => h ? new Date(h).toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' }) : '—';
                    return (
                      <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                        <td className="py-3 pr-6 text-white font-bold text-xs whitespace-nowrap">{fmtFecha}</td>
                        <td className="py-3 pr-6 text-zinc-400 text-xs font-medium whitespace-nowrap">
                          {c.usuarios?.nombre || '—'}
                        </td>
                        <td className="py-3 pr-6 text-zinc-500 text-xs whitespace-nowrap">{fmtHora(c.fecha_apertura)}</td>
                        <td className="py-3 pr-6 text-zinc-500 text-xs whitespace-nowrap">{fmtHora(c.fecha_cierre)}</td>
                        <td className="py-3 pr-6 text-[#4ADE80] font-bold text-xs whitespace-nowrap">{formatCOP(c.ventas_efectivo || 0)}</td>
                        <td className="py-3 pr-6 text-[#60A5FA] font-bold text-xs whitespace-nowrap">{formatCOP(c.ventas_transferencia || 0)}</td>
                        <td className="py-3 pr-6 text-[#FFC107] font-black text-xs whitespace-nowrap">{formatCOP(total)}</td>
                        <td className="py-3 pr-6">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                            dif === 0
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : dif > 0
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {dif > 0 ? '+' : ''}{formatCOP(dif)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
}
