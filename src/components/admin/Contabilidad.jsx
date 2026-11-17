// src/components/admin/Contabilidad.jsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { formatCOP } from '../../lib/utils';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

async function fetchContabilidad() {
  // Corregir zona horaria para reportes exactos en Colombia (sv-SE devuelve YYYY-MM-DD)
  const hoy = new Date().toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).split(' ')[0];
  
  const [{ data: pedidos }, { data: egresos }] = await Promise.all([
    supabase.from('pedidos').select('total, creado_en, estado').eq('estado', 'PAGADO').gte('creado_en', hoy),
    supabase.from('egresos').select('monto, fecha').gte('fecha', hoy)
  ]);

  const ingresosHoy = (pedidos || []).reduce((s, p) => s + p.total, 0);
  const egresosHoy = (egresos || []).reduce((s, e) => s + e.monto, 0);

  return { ingresosHoy, egresosHoy, balance: ingresosHoy - egresosHoy };
}

export default function Contabilidad() {
  const { data, isLoading } = useQuery({ queryKey: ['contabilidad'], queryFn: fetchContabilidad });

  const chartData = data ? [
    { name: 'Ingresos', valor: data.ingresosHoy, color: '#F5B800' },
    { name: 'Egresos', valor: data.egresosHoy, color: '#EF4444' }
  ] : [];

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Resumen de Contabilidad</h1>
        <p className="text-zinc-500 text-xs font-medium mt-1">Visión general del día de hoy (Hora Local)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card glow className="border-brand-yellow/20">
          <CardBody className="flex flex-col gap-1">
            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Ingresos Brutos</span>
            <span className="text-brand-yellow text-2xl md:text-3xl font-black">{formatCOP(data?.ingresosHoy || 0)}</span>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-col gap-1">
            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Egresos Totales</span>
            <span className="text-state-error text-2xl md:text-3xl font-black">{formatCOP(data?.egresosHoy || 0)}</span>
          </CardBody>
        </Card>

        <Card className={data?.balance >= 0 ? 'bg-state-success/5 border-state-success/20' : 'bg-state-error/5 border-state-error/20'}>
          <CardBody className="flex flex-col gap-1">
            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Utilidad Neta</span>
            <span className={`text-2xl md:text-3xl font-black ${data?.balance >= 0 ? 'text-state-success' : 'text-state-error'}`}>
              {formatCOP(data?.balance || 0)}
            </span>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="h-[300px] md:h-[400px]">
          <CardHeader>
            <h3 className="text-white font-black text-xs uppercase tracking-widest">Comparativa Hoy</h3>
          </CardHeader>
          <CardBody className="h-full pb-16 md:pb-20">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: '7px' }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-white font-black text-xs uppercase tracking-widest">Siguientes Pasos</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-[7px] border border-white/[0.05]">
              <span className="text-lg">🏪</span>
              <div>
                <p className="text-white font-bold text-xs uppercase">Cierre de Caja</p>
                <p className="text-zinc-500 text-[10px] font-medium leading-relaxed mt-0.5">Recuerda realizar el arqueo de efectivo al finalizar la jornada para cuadrar los ingresos de hoy.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-[7px] border border-white/[0.05]">
              <span className="text-lg">📊</span>
              <div>
                <p className="text-white font-bold text-xs uppercase">Análisis BI</p>
                <p className="text-zinc-500 text-[10px] font-medium leading-relaxed mt-0.5">Verifica el rendimiento de productos en la sección de Analítica para optimizar tu stock mañana.</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
