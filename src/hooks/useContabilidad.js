import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useContabilidad() {
  return useQuery({
    queryKey: ['contabilidad-hoy'],
    queryFn: async () => {
      const hoy = new Date().toISOString().split('T')[0];
      const [{ data: p }, { data: e }] = await Promise.all([
        supabase.from('pedidos')
          .select('total')
          .gte('creado_en', hoy)
          .or('and(canal.eq.DOMICILIO,estado.in.(ENTREGADO,CANCELADO)),and(canal.neq.DOMICILIO,estado.in.(PAGADO,CANCELADO))'),
        supabase.from('egresos').select('monto').gte('fecha', hoy)
      ]);
      
      const ingresos = (p || []).reduce((s, x) => s + x.total, 0);
      const egresos = (e || []).reduce((s, x) => s + x.monto, 0);
      
      return { ingresos, egresos, balance: ingresos - egresos };
    },
  });
}
