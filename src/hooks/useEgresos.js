import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useEgresos() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['egresos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('egresos').select('*').order('fecha', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const guardarEgreso = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { error } = id
        ? await supabase.from('egresos').update(payload).eq('id', id)
        : await supabase.from('egresos').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['egresos'] }),
  });

  return { ...query, guardarEgreso };
}
