// src/components/mesero/CuadriculaMesas.jsx
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export default function CuadriculaMesas({ onSelect, seleccionada }) {
  const { data: mesas = [], isLoading } = useQuery({ 
    queryKey: ['mesas'], 
    queryFn: async () => {
      const [{ data: m }, { data: pedidosActivos }] = await Promise.all([
        supabase.from('mesas').select('*').eq('activa', true).order('numero'),
        supabase.from('pedidos').select('mesa_id').in('estado', ['PENDIENTE', 'EN_PROCESO']),
      ]);

      const ocupadasIds = new Set((pedidosActivos || []).map(p => p.mesa_id));

      return (m || []).map(mesa => ({
        ...mesa,
        estado: ocupadasIds.has(mesa.id) ? 'OCUPADA' : 'LIBRE',
      }));
    }
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('mesas_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, () => {
        queryClient.invalidateQueries({ queryKey: ['mesas'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        // Cuando cambia un pedido (nuevo, pagado, etc.) actualizamos el estado de las mesas
        queryClient.invalidateQueries({ queryKey: ['mesas'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-32 bg-[#111111] rounded-[10px] animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-3 animate-fade-in">
      {mesas.map((m) => {
        const isSelected = seleccionada === m.id;
        const ocupada = m.estado === 'OCUPADA'; 

        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m)}
            className={`h-24 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 group relative ${
              isSelected
                ? 'border-[#FFC107] bg-[#FFC107]/10 shadow-[0_0_20px_rgba(255,193,7,0.1)]'
                : 'border-white/5 bg-[#0D0D0D] hover:bg-[#151515] active:scale-95'
            }`}
          >
            <span className={`text-[10px] font-black tracking-tighter ${isSelected ? 'text-white' : 'text-zinc-600'}`}>
              M{m.numero.toString().padStart(2, '0')}
            </span>
            
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] ${
              ocupada 
                ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                : 'bg-green-500/10 text-green-500 border border-green-500/20'
            }`}>
              {ocupada ? '!' : '✓'}
            </div>

            <span className={`text-[7px] font-black uppercase tracking-widest ${
              ocupada ? 'text-red-500' : 'text-green-500'
            }`}>
              {ocupada ? 'OCUPADA' : 'LIBRE'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
