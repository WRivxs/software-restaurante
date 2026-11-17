// src/components/cajero/HistorialPedidos.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { formatCOP } from '../../lib/utils';
import { startOfDay, endOfDay } from 'date-fns';
import CierreCaja from './CierreCaja';
import FacturaModal from '../factura/FacturaModal';
import { useCaja } from '../../hooks/useCaja';

export default function HistorialPedidos({ cajeroId }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [fechaFiltro, setFechaFiltro] = useState(todayStr);
  const [showCierre, setShowCierre] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [showFactura, setShowFactura] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const { caja, isAbierta, isCerrada } = useCaja();

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['historial', fechaFiltro],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, mesero:usuarios!pedidos_mesero_id_fkey(nombre), cajero:usuarios!pedidos_cajero_id_fkey(nombre), detalle_pedido(*, productos(nombre))')
        .gte('creado_en', fechaFiltro)
        .lt('creado_en', new Date(new Date(fechaFiltro).getTime() + 86400000).toISOString().split('T')[0])
        .or('and(canal.eq.DOMICILIO,estado.in.(ENTREGADO,CANCELADO)),and(canal.neq.DOMICILIO,estado.in.(PAGADO,CANCELADO))')
        .order('actualizado_en', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: egresos = [] } = useQuery({
    queryKey: ['egresos-hoy', fechaFiltro],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('egresos')
        .select('*')
        .gte('fecha', fechaFiltro)
        .lt('fecha', new Date(new Date(fechaFiltro).getTime() + 86400000).toISOString().split('T')[0]);
      if (error) throw error;
      return data || [];
    }
  });

  // KPIs
  const totalEgresos = egresos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
  const pedidosValidos = pedidos.filter(p => p.estado === 'PAGADO' || p.estado === 'ENTREGADO');
  const totalHoy = pedidosValidos.reduce((acc, p) => acc + p.total, 0);
  const nPedidos = pedidosValidos.length;
  const efectivo = pedidosValidos.filter(p => p.metodo_pago === 'EFECTIVO').reduce((acc, p) => acc + p.total, 0);
  const transferencia = pedidosValidos.filter(p => p.metodo_pago === 'TRANSFERENCIA').reduce((acc, p) => acc + p.total, 0);
  
  const porcentajeEfectivo = totalHoy > 0 ? Math.round((efectivo / totalHoy) * 100) : 0;
  const porcentajeTransferencia = totalHoy > 0 ? Math.round((transferencia / totalHoy) * 100) : 0;
  const ticketPromedio = nPedidos > 0 ? totalHoy / nPedidos : 0;

  const pedidosConSecuencia = pedidos.map((p, idx) => ({
    ...p,
    seq_id: pedidos.length - idx
  }));

  const pedidosFiltrados = pedidosConSecuencia.filter(p => 
    (p.codigo?.toLowerCase().includes(busqueda.toLowerCase())) ||
    (p.nombre_cliente?.toLowerCase().includes(busqueda.toLowerCase())) ||
    (p.nombre_cliente_dom?.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="px-10 py-8 w-full h-full overflow-y-auto custom-scrollbar space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* ── ENCABEZADO ESCALADO ── */}
      <div className="flex items-center gap-6">
        <h1 className="text-[#FFC107] font-black text-4xl tracking-tighter uppercase italic">Historial y Cierre</h1>
        <span className={`border px-3 py-1 rounded-[5px] text-[10px] font-black uppercase tracking-widest leading-none ${
          isAbierta ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
          isCerrada ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
          'bg-zinc-800/50 text-zinc-500 border-white/5'
        }`}>
          {isAbierta ? 'CAJA ABIERTA' : isCerrada ? 'CAJA CERRADA' : 'SIN ABRIR'}
        </span>
      </div>

      {/* ── KPIs ESCALADOS ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#111111] border border-white/5 p-6 rounded-[10px] relative overflow-hidden group hover:border-[#FFC107]/30 transition-all">
           <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1.5">
                 <p className="text-zinc-500 text-xs font-black uppercase tracking-widest leading-none">Total Ventas</p>
                 <h3 className="text-white text-3xl font-black italic tracking-tighter leading-none">{formatCOP(totalHoy)}</h3>
                 <p className="text-[#22C55E] text-[10px] font-bold flex items-center gap-1">
                    +12% vs ayer
                 </p>
              </div>
              <div className="w-10 h-10 bg-[#FFC107]/10 rounded-[10px] flex items-center justify-center text-[#FFC107]">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16V15m3.187-2.313L21 15m-4.5-4.5L21 9" /></svg>
              </div>
           </div>
        </div>

        <div className="bg-[#111111] border border-white/5 p-6 rounded-[10px] relative overflow-hidden group hover:border-[#22C55E]/30 transition-all">
           <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1.5">
                 <p className="text-zinc-500 text-xs font-black uppercase tracking-widest leading-none">Efectivo</p>
                 <h3 className="text-white text-3xl font-black italic tracking-tighter leading-none">{formatCOP(efectivo)}</h3>
                 <p className="text-zinc-500 text-[10px] font-bold leading-none">{porcentajeEfectivo}% del total</p>
              </div>
              <div className="w-10 h-10 bg-[#22C55E]/10 rounded-[10px] flex items-center justify-center text-[#22C55E]">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
           </div>
        </div>

        <div className="bg-[#111111] border border-white/5 p-6 rounded-[10px] relative overflow-hidden group hover:border-[#3B82F6]/30 transition-all">
           <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1.5">
                 <p className="text-zinc-500 text-xs font-black uppercase tracking-widest leading-none">Transferencia</p>
                 <h3 className="text-white text-3xl font-black italic tracking-tighter leading-none">{formatCOP(transferencia)}</h3>
                 <p className="text-zinc-500 text-[10px] font-bold leading-none">{porcentajeTransferencia}% del total</p>
              </div>
              <div className="w-10 h-10 bg-[#3B82F6]/10 rounded-[10px] flex items-center justify-center text-[#3B82F6]">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
              </div>
           </div>
        </div>

        <div className="bg-[#111111] border border-white/5 p-6 rounded-[10px] relative overflow-hidden group hover:border-[#F97316]/30 transition-all">
           <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1.5">
                 <p className="text-zinc-500 text-xs font-black uppercase tracking-widest leading-none">Pedidos</p>
                 <h3 className="text-white text-3xl font-black italic tracking-tighter leading-none">{nPedidos}</h3>
                 <p className="text-zinc-500 text-[10px] font-bold leading-none">Promed: {formatCOP(ticketPromedio)}</p>
              </div>
              <div className="w-10 h-10 bg-[#F97316]/10 rounded-[10px] flex items-center justify-center text-[#F97316]">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
           </div>
        </div>
      </div>

      {/* ── CONTROLES ESCALADOS ── */}
      <div className="flex items-center justify-between gap-6 bg-[#0A0A0A] p-4 rounded-[10px] border border-white/5 shadow-xl">
         <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full max-w-md bg-zinc-900/40 border border-white/5 rounded-[8px] pl-12 pr-6 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-[#FFC107]/30 transition-all font-medium"
            />
         </div>
         <div className="flex items-center gap-3">
            <div className="relative">
               <input 
                 type="date"
                 value={fechaFiltro}
                 max={todayStr}
                 onChange={(e) => {
                   const selected = e.target.value;
                   if (selected && selected > todayStr) return;
                   setFechaFiltro(selected);
                 }}
                 className="bg-zinc-900 border border-white/5 rounded-[8px] px-4 py-3 text-white text-xs font-black uppercase tracking-widest outline-none focus:border-[#FFC107]/40 transition-all appearance-none cursor-pointer"
                 style={{ colorScheme: 'dark' }}
               />
               <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               </div>
            </div>
            <button
               onClick={() => setShowCierre(true)}
               disabled={!isAbierta}
               className="h-12 px-8 bg-[#FFC107] text-black font-black uppercase text-xs tracking-widest rounded-[8px] shadow-lg hover:bg-[#FFD54F] transition-all transform active:scale-95 flex items-center gap-2 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
            >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
               {isCerrada ? 'Caja Cerrada' : 'Cerrar Caja'}
            </button>
         </div>
      </div>

      {/* ── TABLA ESCALADA ── */}
      <div className="bg-[#111111] border border-white/5 rounded-[10px] overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/40 text-zinc-600 text-xs font-black uppercase tracking-[0.2em] border-b border-white/5">
                <th className="px-4 py-5">Código</th>
                <th className="px-4 py-5">Cliente / Mesa</th>
                <th className="px-4 py-5 text-center">Canal</th>
                <th className="px-4 py-5 text-center">Pago</th>
                <th className="px-4 py-5 text-center">Hora</th>
                <th className="px-4 py-5 text-right">Total</th>
                <th className="px-4 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {pedidosFiltrados.map((p) => (
                <tr key={p.id} className={`hover:bg-white/[0.02] transition-all group ${p.estado === 'CANCELADO' ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                  <td className="px-4 py-4">
                    <span className="text-[#FFC107] font-black text-xs tracking-widest">#{String(p.seq_id).padStart(3, '0')}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-white font-black text-[14px] uppercase tracking-tight group-hover:text-[#FFC107] transition-colors leading-none">
                        {p.nombre_cliente || p.nombre_cliente_dom || (p.mesa_id ? `Mesa ${p.mesa_id}` : 'General')}
                      </span>
                      <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-1 leading-none">
                        {p.mesero?.nombre || 'Admin'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {p.estado === 'CANCELADO' ? (
                      <span className="px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.1em] bg-red-500/20 text-red-500 border border-red-500/30">
                        Cancelado
                      </span>
                    ) : (
                      <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.1em] border ${
                        p.canal === 'DOMICILIO' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}>
                        {p.canal === 'DOMICILIO' ? 'Domicilio' : (p.mesa_id ? `Mesa ${p.mesa_id}` : 'Salón')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {p.estado === 'CANCELADO' ? (
                      <span className="text-zinc-700 text-[11px] font-black uppercase tracking-widest">---</span>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                         <span className={`w-1.5 h-1.5 rounded-full ${p.metodo_pago === 'TRANSFERENCIA' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                         <span className={`text-[11px] font-black uppercase tracking-widest ${p.metodo_pago === 'TRANSFERENCIA' ? 'text-blue-500' : 'text-green-500'}`}>
                            {p.metodo_pago}
                         </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-white font-bold text-xs">{new Date(p.actualizado_en || p.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={`font-black text-sm italic tracking-tighter ${p.estado === 'CANCELADO' ? 'text-zinc-600 line-through decoration-red-500/50' : 'text-white'}`}>
                      {formatCOP(p.total)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button 
                      onClick={() => {
                        setPedidoSeleccionado(p);
                        setShowFactura(true);
                      }}
                      className="w-9 h-9 rounded-[8px] bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 hover:text-[#FFC107] hover:border-[#FFC107]/30 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-lg"
                    >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODALES ── */}
      {showCierre && (
        <CierreCaja 
          onClose={() => setShowCierre(false)}
          datos={{
            id: caja.id, // ID del turno actual
            cajeroId,
            monto_apertura: caja.monto_apertura,
            ventas_efectivo: efectivo,
            ventas_transferencia: transferencia,
            total_egresos: totalEgresos,
            total_esperado: totalHoy,
          }}
        />
      )}

      {showFactura && (
        <FacturaModal 
          open={showFactura}
          onClose={() => {
            setShowFactura(false);
            setPedidoSeleccionado(null);
          }}
          pedido={pedidoSeleccionado}
        />
      )}
    </div>
  );
}
