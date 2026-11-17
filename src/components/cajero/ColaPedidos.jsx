// src/components/cajero/ColaPedidos.jsx — Tarjetas según captura de pantalla
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCOP } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ColaPedidos({ seleccionado, onSelect }) {
  const qc = useQueryClient();

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos-activos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          usuarios!pedidos_mesero_id_fkey(nombre),
          detalle_pedido(cantidad, precio_unitario, productos(nombre))
        `)
        .in('estado', ['PENDIENTE', 'EN_PROCESO'])
        .order('creado_en', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 8000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('cajero-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        qc.invalidateQueries({ queryKey: ['pedidos-activos'] });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [qc]);

  if (isLoading) return <div className="space-y-4 opacity-50">{[1,2,3].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-3">
      {/* ── LISTA DE TARJETAS ── */}
      {pedidos.map(p => {
        const isSelected = seleccionado === p.id;
        const productsText = p.detalle_pedido?.map(d => d.productos?.nombre).join(', ') || 'Sin productos';
        const tiempo = formatDistanceToNow(new Date(p.creado_en), { addSuffix: false, locale: es });
        const mesero = p.usuarios?.nombre || 'S/M';

        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p)}
            className={`w-full text-left bg-[#1A1A1A] rounded-[10px] py-1 px-4 border-2 transition-all relative overflow-hidden group ${
              isSelected 
              ? 'border-[#FFC107]/30 bg-[#222222] shadow-[0_15px_40px_rgba(0,0,0,0.4)]' 
              : 'border-white/[0.02] hover:border-white/5'
            }`}
          >
            {/* Indicador lateral curvo matching screenshot */}
            <div className={`absolute left-0 top-[15%] bottom-[15%] w-1.5 rounded-r-2xl transition-all duration-300 ${
              isSelected ? 'bg-[#FFC107] shadow-[4px_0_15px_rgba(255,193,7,0.3)]' : 'bg-transparent'
            }`} />

            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="text-[#FFC107] font-black text-[15px] uppercase tracking-tighter italic">
                  {p.mesa_id ? `Mesa ${String(p.mesa_id).padStart(2, '0')}` : 'Domicilio'}
                </span>
                
                <div className="mt-1 space-y-0.5">
                  <p className="text-zinc-500 text-[11px] font-bold leading-tight truncate pr-4 opacity-80">
                    {productsText}
                  </p>
                  <p className="text-zinc-600 text-[10px] font-medium leading-none">
                    Hace {tiempo} • <span className="opacity-60 italic text-[9px]">Mesero: {mesero}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                  p.estado === 'PENDIENTE' 
                  ? 'bg-[#FFC107]/5 text-[#FFC107] border border-[#FFC107]/10' 
                  : 'bg-[#FF5722]/5 text-[#FF5722] border border-[#FF5722]/10'
                }`}>
                  {p.estado.replace('_', ' ')}
                </div>
                
                <div className="text-white font-black text-[22px] tracking-tighter leading-none flex items-center gap-1.5 mt-1">
                  <span className="text-zinc-500 text-xl font-bold italic">$</span>
                  {new Intl.NumberFormat('es-CO').format(p.total)}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
