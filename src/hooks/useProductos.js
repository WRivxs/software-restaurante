import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useProductos() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['productos-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('productos').select('*, categorias(nombre)').order('nombre');
      if (error) throw error;
      return data || [];
    },
  });

  const guardarProducto = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { error } = id
        ? await supabase.from('productos').update(payload).eq('id', id)
        : await supabase.from('productos').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos-admin'] }),
  });

  return { ...query, guardarProducto };
}
