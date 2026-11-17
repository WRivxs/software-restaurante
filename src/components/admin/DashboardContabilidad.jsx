// src/components/admin/DashboardContabilidad.jsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { formatCOP } from '../../lib/utils';
import { Card } from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export default function DashboardContabilidad() {
  const { data: pedidos = [] } = useQuery({
    queryKey: ['pedidos_stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pedidos')
        .select('*')
        .or('and(canal.eq.DOMICILIO,estado.in.(ENTREGADO,CANCELADO)),and(canal.neq.DOMICILIO,estado.in.(PAGADO,CANCELADO))');
      return data || [];
    }
  });

  const { data: egresos = [] } = useQuery({
    queryKey: ['egresos_stats'],
    queryFn: async () => {
      const { data } = await supabase.from('egresos').select('*');
      return data || [];
    }
  });

  const totalIngresos = pedidos.reduce((s, p) => s + p.total, 0);
  const totalEgresos = egresos.reduce((s, e) => s + e.monto, 0);
  const utilidad = totalIngresos - totalEgresos;
  const margen = totalIngresos > 0 ? ((utilidad / totalIngresos) * 100).toFixed(1) : 0;
  const promedio = pedidos.length > 0 ? totalIngresos / pedidos.length : 0;

  const kpis = [
    { 
      label: 'TOTAL INGRESOS', 
      value: totalIngresos, 
      color: '#4ADE80', 
      sub: '+ 12% vs ayer', 
      isCurrency: true,
      icon: (
        <svg className="w-5 h-5 text-[#4ADE80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    { 
      label: 'TOTAL EGRESOS', 
      value: totalEgresos, 
      color: '#F87171', 
      sub: '↑ 5% vs ayer', 
      isCurrency: true,
      icon: (
        <svg className="w-5 h-5 text-[#F87171]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
        </svg>
      )
    },
    { 
      label: 'UTILIDAD NETA', 
      value: utilidad, 
      color: '#FFD700', 
      sub: `Margen del ${margen}%`, 
      isCurrency: true,
      icon: (
        <svg className="w-5 h-5 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      label: 'PEDIDOS DEL DÍA', 
      value: pedidos.length, 
      color: '#FFFFFF', 
      sub: `Promedio ${formatCOP(promedio)} / orden`, 
      isCurrency: false,
      icon: (
        <svg className="w-5 h-5 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header Dashboard */}
      <div className="flex flex-col gap-1 pb-4">
        <h1 className="text-white font-black text-2xl tracking-tighter uppercase italic">Panel de Resumen</h1>
        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Información clave en tiempo real</p>
      </div>

      {/* Tarjetas Estilo Premium Referencia */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-[#111111] p-5 rounded-[10px] border border-white/[0.05] relative flex flex-col justify-between h-32 group hover:border-white/[0.1] transition-all">
            <div className="flex justify-between items-start">
              <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-[0.15em]">{kpi.label}</p>
              <div className="p-1.5 bg-black/50 rounded-lg border border-white/[0.03]">
                {kpi.icon}
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <h3 className="text-2xl font-black tracking-tight" style={{ color: kpi.color }}>
                {kpi.isCurrency ? formatCOP(kpi.value) : kpi.value}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-tight" style={{ color: kpi.color + 'CC' }}>
                {kpi.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos Compactos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <div className="bg-[#111111] p-6 rounded-[10px] border border-white/[0.05] flex flex-col h-[350px]">
          <h3 className="text-white font-black text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#FFB100] rounded-full" />
            Movimiento Diario
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'HOY', ingresos: totalIngresos, egresos: totalEgresos }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={9} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={9} fontWeight="bold" axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#ffffff02' }}
                  contentStyle={{ backgroundColor: '#050505', border: '1px solid #ffffff05', borderRadius: '7px', padding: '10px' }}
                  itemStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', color: '#fff' }}
                />
                <Bar dataKey="ingresos" fill="#4ADE80" radius={[4, 4, 0, 0]} barSize={50} />
                <Bar dataKey="egresos" fill="#F87171" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111111] p-6 rounded-[10px] border border-white/[0.05] flex flex-col h-[350px]">
          <h3 className="text-white font-black text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#FFD700] rounded-full" />
            Distribución de Capital
          </h3>
          <div className="flex-1 w-full flex items-center justify-center">
             {totalEgresos > 0 || totalIngresos > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={[
                        { name: 'EGRESOS', value: totalEgresos }, 
                        { name: 'UTILIDAD', value: Math.max(0, utilidad) }
                      ]}
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#F87171" />
                      <Cell fill="#4ADE80" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#050505', border: '1px solid #ffffff05', borderRadius: '7px' }}
                    />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
               <div className="text-center space-y-2">
                 <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2">
                   <svg className="w-6 h-6 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                 </div>
                 <p className="text-zinc-600 font-bold uppercase text-[9px] tracking-widest">Sin datos registrados hoy</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
