import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Hook que escucha cambios en tiempo real en la tabla `pedidos`.
 * Cuando un mesero inserta un pedido, el cajero lo recibe al instante.
 * 
 * Al recibir un INSERT: reproduce el sonido de alerta y recarga los datos.
 * Al recibir un UPDATE: recarga los datos silenciosamente.
 */
export function useRealtimePedidos() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('pedidos-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pedidos' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pedidos'] });
          // Reproducir sonido de alerta (archivo en /public/sounds/)
          const audio = new Audio('/sounds/nuevo-pedido.mp3');
          audio.volume = 0.7;
          audio.play().catch(() => {}); // silenciar el error si el usuario no ha interactuado
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pedidos'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'pedidos' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pedidos'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
