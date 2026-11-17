import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useMesas() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['mesas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('mesas').select('*').order('numero');
      if (error) throw error;
      return data || [];
    },
  });

  const guardarMesa = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { error } = id
        ? await supabase.from('mesas').update(payload).eq('id', id)
        : await supabase.from('mesas').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mesas'] }),
  });

  const toggleActiva = useMutation({
    mutationFn: async ({ id, activa }) => {
      const { error } = await supabase.from('mesas').update({ activa }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mesas'] }),
  });

  return { ...query, guardarMesa, toggleActiva };
}
