// src/hooks/useCaja.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useCaja() {
  const { data: caja, isLoading, refetch } = useQuery({
    queryKey: ['caja_estado_hoy'],
    queryFn: async () => {
      // Fecha hoy en formato YYYY-MM-DD (Bogotá)
      const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Bogota' });
      
      const { data, error } = await supabase
        .from('cierres_caja')
        .select('*')
        .gte('fecha_apertura', hoy + 'T00:00:00')
        .lte('fecha_apertura', hoy + 'T23:59:59')
        .order('fecha_apertura', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return { estado: 'SIN_ABRIR' };
      return data; // Retorna el registro completo: { id, estado, monto_apertura, ... }
    },
    refetchInterval: 30000, // Verificar cada 30s por si otro cajero cierra/abre
  });

  return {
    caja,
    isLoading,
    refetch,
    isAbierta: caja?.estado === 'ABIERTA',
    isCerrada: caja?.estado === 'CERRADA',
    isSinAbrir: caja?.estado === 'SIN_ABRIR'
  };
}
