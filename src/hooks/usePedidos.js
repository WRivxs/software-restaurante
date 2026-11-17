import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function usePedidos() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['pedidos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, detalle_pedido(*, productos(nombre))')
        .order('creado_en', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const guardarPedido = useMutation({
    mutationFn: async ({ id, items, ...pedido }) => {
      // 1. Insertar encabezado del pedido
      const { data: nuevoPedido, error: errorPedido } = await supabase
        .from('pedidos')
        .insert({
          codigo: pedido.codigo,
          canal: pedido.canal,
          estado: pedido.estado,
          total: pedido.total || 0,
          nombre_cliente: pedido.nombre_cliente || '',
          mesa_id: pedido.mesa_id ? Number(pedido.mesa_id) : null,
          mesero_id: pedido.mesero_id || null,
          notas: pedido.notas || null,
        })
        .select()
        .single();

      if (errorPedido) throw errorPedido;

      // 2. Insertar los items en detalle_pedido
      const detalles = items.map(it => ({
        pedido_id: nuevoPedido.id,
        producto_id: Number(it.productoId),
        cantidad: Number(it.cantidad),
        precio_unitario: Number(it.precio),
        subtotal: Number(it.precio) * Number(it.cantidad),
        notas: it.notas || null
      }));

      const { error: errorDetalles } = await supabase
        .from('detalle_pedido')
        .insert(detalles);

      if (errorDetalles) throw errorDetalles;

      return nuevoPedido;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos'] });
      qc.invalidateQueries({ queryKey: ['mesas'] });
    },
  });

  const actualizarEstado = useMutation({
    mutationFn: async ({ id, estado }) => {
      const { error } = await supabase.from('pedidos').update({ estado }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pedidos'] }),
  });

  return { ...query, guardarPedido, actualizarEstado };
}
