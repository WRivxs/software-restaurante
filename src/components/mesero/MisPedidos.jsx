// src/components/mesero/MisPedidos.jsx
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { formatCOP, cn } from '../../lib/utils';

const ESTADO_ESTILOS = {
  PENDIENTE:  { bg: 'bg-yellow-500/10',  text: 'text-yellow-400',  border: 'border-yellow-500/20',  label: 'PENDIENTE'  },
  PAGADO:     { bg: 'bg-green-500/10',   text: 'text-green-400',   border: 'border-green-500/20',   label: 'PAGADO'     },
  EN_PROCESO: { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20',    label: 'EN PROCESO' },
  LISTO:      { bg: 'bg-green-500/10',   text: 'text-green-400',   border: 'border-green-500/20',   label: 'LISTO'      },
  ENTREGADO:  { bg: 'bg-zinc-500/10',    text: 'text-zinc-400',    border: 'border-zinc-500/20',    label: 'ENTREGADO'  },
  CANCELADO:  { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20',     label: 'CANCELADO'  },
};

export default function MisPedidos({ meseroId }) {
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const queryClient = useQueryClient();

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['mis_pedidos', meseroId],
    enabled: !!meseroId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, detalle_pedido(*, productos(nombre, descripcion, imagen_url)), mesas(numero)')
        .eq('mesero_id', meseroId)
        .order('creado_en', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (!meseroId) return;

    // Suscripción en tiempo real para cambios en pedidos de este mesero
    const channel = supabase
      .channel(`mis_pedidos_${meseroId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'pedidos',
          filter: `mesero_id=eq.${meseroId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['mis_pedidos', meseroId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meseroId, queryClient]);

  const formatHora = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  const formatFecha = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  };

  const detalle = pedidoSeleccionado
    ? pedidos.find((p) => p.id === pedidoSeleccionado)
    : null;

  return (
    <div className="flex h-full flex-col lg:flex-row overflow-hidden relative">
      {/* ── Columna Izquierda: Lista de Pedidos ── */}
      <div className={cn(
        "w-full lg:w-[420px] shrink-0 border-r border-white/5 flex flex-col bg-[#080808]",
        pedidoSeleccionado && "hidden lg:flex" // Ocultar lista en móvil si hay detalle
      )}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-white font-medium text-xs uppercase tracking-[0.2em]">Historial</h2>
            <p className="text-zinc-600 text-[9px] uppercase tracking-widest mt-1">
              {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* ... (isLoading and empty states) ... */}
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : pedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-20 gap-3">
              {/* ... (svg part) ... */}
              <svg className="w-10 h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Sin pedidos aún</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {pedidos.map((p) => {
                const est = ESTADO_ESTILOS[p.estado] || ESTADO_ESTILOS.PENDIENTE;
                const isActive = pedidoSeleccionado === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPedidoSeleccionado(p.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                      isActive
                        ? 'border-[#FFC107]/40 bg-[#FFC107]/5 shadow-[0_0_20px_rgba(255,193,7,0.05)]'
                        : 'border-white/5 bg-[#0D0D0D] hover:border-white/15 hover:bg-[#111]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${est.bg} ${est.text} ${est.border}`}>
                          {est.label}
                        </span>
                      </div>
                      <span className="text-zinc-600 text-[9px] uppercase tracking-widest">
                        {formatFecha(p.creado_en)} · {formatHora(p.creado_en)}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-white font-black text-xs uppercase tracking-tight truncate">
                          {p.codigo || `#${p.id?.slice(-6).toUpperCase()}`}
                        </p>
                        <p className="text-zinc-500 text-[9px] mt-0.5 uppercase tracking-widest truncate">
                          {p.mesas ? `Mesa ${String(p.mesas.numero).padStart(2,'0')}` : 'Mesa —'} · {p.nombre_cliente || '—'}
                        </p>
                      </div>
                      <span className="text-[#FFC107] font-black text-sm shrink-0">
                        {formatCOP(p.total)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Columna Derecha: Detalle del Pedido ── */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#050505]",
        !pedidoSeleccionado && "hidden lg:flex"
      )}>
        {!detalle ? (
          <div className="flex flex-col items-center justify-center h-full opacity-10 gap-4">
             {/* ... empty state svg ... */}
            <svg className="w-14 h-14 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Selecciona un pedido</p>
          </div>
        ) : (
          <>
            {/* Header del Detalle */}
            <div className="px-6 md:px-8 py-5 md:py-6 border-b border-white/5 bg-black/30 shrink-0">
              <div className="flex items-center gap-3 mb-4 lg:hidden">
                <button onClick={() => setPedidoSeleccionado(null)} className="text-zinc-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Volver al historial</span>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-medium text-xs uppercase tracking-[0.2em]">Detalle</h3>
                  <p className="text-[#FFC107] font-black text-base md:text-lg uppercase tracking-tighter mt-1">
                    {detalle.codigo || `#${detalle.id?.slice(-6).toUpperCase()}`}
                  </p>
                </div>
                <div className="text-right">
                  {(() => {
                    const est = ESTADO_ESTILOS[detalle.estado] || ESTADO_ESTILOS.PENDIENTE;
                    return (
                      <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 md:px-3 py-1 rounded-full border ${est.bg} ${est.text} ${est.border}`}>
                        {est.label}
                      </span>
                    );
                  })()}
                  <p className="text-zinc-600 text-[8px] md:text-[9px] uppercase tracking-widest mt-2">
                    {formatFecha(detalle.creado_en)} · {formatHora(detalle.creado_en)}
                  </p>
                </div>
              </div>
              {/* ... rapid info ... */}
              <div className="flex gap-4 md:gap-6 mt-4 md:mt-5">
                <div>
                  <p className="text-zinc-600 text-[7px] md:text-[8px] uppercase tracking-widest">Mesa</p>
                  <p className="text-white font-black text-xs mt-0.5">
                    {detalle.mesas ? `Mesa ${String(detalle.mesas.numero).padStart(2,'0')}` : '—'}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-zinc-600 text-[7px] md:text-[8px] uppercase tracking-widest">Cliente</p>
                  <p className="text-white font-black text-xs mt-0.5 truncate">{detalle.nombre_cliente || '—'}</p>
                </div>
              </div>
            </div>

            {/* Nota General del Pedido */}
            {detalle.notas && detalle.notas.trim() !== '' && (
              <div className="mx-6 md:mx-8 mt-5 p-4 bg-[#FFC107]/5 border border-[#FFC107]/10 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#FFC107] text-xs">📋</span>
                  <p className="text-[#FFC107] text-[10px] font-black uppercase tracking-[0.2em]">Nota General</p>
                </div>
                <p className="text-white text-xs md:text-sm italic font-medium leading-relaxed">
                  "{detalle.notas}"
                </p>
              </div>
            )}

            {/* Items del Pedido */}
            <div className="flex-1 overflow-y-auto px-6 md:px-8 py-5 md:py-6 space-y-3 custom-scrollbar">
              {detalle.detalle_pedido?.map((item, i) => (
                <div key={i} className="flex gap-3 md:gap-4 bg-[#0A0A0A] border border-white/5 rounded-xl p-3 md:p-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#151515] border border-white/10 flex items-center justify-center font-black text-[10px] md:text-xs text-zinc-400 shrink-0">
                    {item.cantidad}x
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-white font-black text-[11px] md:text-xs uppercase tracking-tight truncate">
                        {item.productos?.nombre || '—'}
                      </p>
                      <span className="text-zinc-400 text-[10px] md:text-xs font-medium ml-2 shrink-0">
                        {formatCOP(item.subtotal)}
                      </span>
                    </div>
                    {item.productos?.descripcion && (
                      <p className="text-zinc-600 text-[9px] md:text-[10px] leading-tight mt-0.5 line-clamp-2">
                        {item.productos.descripcion}
                      </p>
                    )}
                    {(item.notas || item.nota) && (
                      <div className="mt-2 p-2.5 bg-[#FFC107]/10 border border-[#FFC107]/20 rounded-lg animate-fade-in">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[#FFC107] text-[9px]">✎</span>
                          <p className="text-[#FFC107] text-[10px] font-black uppercase tracking-widest">Nota Especial</p>
                        </div>
                        <p className="text-zinc-200 text-[11px] italic font-medium leading-relaxed">
                          "{item.notas || item.nota}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer de Totales */}
            <div className="px-6 md:px-8 py-5 md:py-6 border-t border-white/5 bg-black/30 shrink-0 space-y-2">
              <div className="flex justify-between items-end bg-zinc-900/40 p-4 rounded-xl border border-white/5">
                <span className="text-white font-black text-[10px] md:text-xs uppercase tracking-[0.2em] italic">Total</span>
                <span className="text-[#FFC107] font-black text-xl md:text-2xl tracking-tighter">
                  {formatCOP(detalle.total)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
