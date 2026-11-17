import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useCategorias() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categorias').select('*').order('orden');
      if (error) throw error;
      return data || [];
    },
  });

  const guardarCategoria = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { error } = id
        ? await supabase.from('categorias').update(payload).eq('id', id)
        : await supabase.from('categorias').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  });

  return { ...query, guardarCategoria };
}
