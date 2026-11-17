// src/components/cajero/ModalCobro.jsx
// Modal de cobro en efectivo/transferencia con billetes rápidos COP
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../../hooks/useStore';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCOP } from '../../lib/utils';
import GenerarFactura from './GenerarFactura';

const BILLETES = [10000, 20000, 50000, 100000];

export default function ModalCobro({ pedido, onClose }) {
  const { user } = useAppStore();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [metodo, setMetodo] = useState('EFECTIVO');
  const [pagado, setPagado] = useState(0);
  const [mostrarFactura, setMostrarFactura] = useState(false);
  const cambio = Math.max(0, pagado - pedido.total);

  const cobrar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('pedidos').update({
        estado: 'PAGADO',
        metodo_pago: metodo,
        pago_cliente: metodo === 'EFECTIVO' ? pagado : pedido.total,
        cambio: metodo === 'EFECTIVO' ? cambio : 0,
        cajero_id: user?.id,
      }).eq('id', pedido.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      toast('¡Pedido cobrado exitosamente!', 'success');
      setMostrarFactura(true);
    },
    onError: () => toast('Error al procesar el cobro', 'error'),
  });

  if (mostrarFactura) {
    return <GenerarFactura pedido={{ ...pedido, metodo_pago: metodo, pago_cliente: pagado, cambio }} onClose={onClose} />;
  }

  const puedeConfirmar =
    metodo === 'TRANSFERENCIA' || (metodo === 'EFECTIVO' && pagado >= pedido.total);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-bg-surface border border-bg-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-bg-border flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge estado={pedido.estado}>{pedido.estado}</Badge>
              <span className="text-zinc-500 text-xs">· {pedido.codigo}</span>
            </div>
            <h2 className="text-white font-black text-lg">Cobrar Pedido</h2>
            {pedido.nombre_cliente && (
              <p className="text-zinc-400 text-sm mt-0.5">👤 {pedido.nombre_cliente}</p>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white ml-4">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Resumen ítems */}
          <div className="bg-bg-elevated rounded-xl p-4 space-y-2">
            {(pedido.detalle_pedido || []).map((d, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-zinc-300">{d.productos?.nombre} × {d.cantidad}</span>
                <span className="text-zinc-400">{formatCOP(d.subtotal)}</span>
              </div>
            ))}
            {pedido.costo_domicilio > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t border-bg-border">
                <span className="text-zinc-300">Domicilio</span>
                <span className="text-zinc-400">{formatCOP(pedido.costo_domicilio)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-base pt-2 border-t border-bg-border">
              <span className="text-white">Total</span>
              <span className="text-brand-yellow">{formatCOP(pedido.total)}</span>
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3">Método de Pago</p>
            <div className="flex gap-3">
              {['EFECTIVO', 'TRANSFERENCIA'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMetodo(m); setPagado(0); }}
                  className={`flex-1 py-3 rounded-xl text-sm font-black transition-all border ${
                    metodo === m
                      ? 'bg-brand-yellow text-black border-brand-yellow'
                      : 'bg-bg-elevated border-bg-border text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {m === 'EFECTIVO' ? '💵 Efectivo' : '📲 Transferencia'}
                </button>
              ))}
            </div>
          </div>

          {/* Billetes rápidos */}
          {metodo === 'EFECTIVO' && (
            <div>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3">Billetes Rápidos</p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {BILLETES.map((b) => (
                  <button
                    key={b}
                    onClick={() => setPagado(b)}
                    className={`py-2.5 rounded-xl text-xs font-black transition-all border ${
                      pagado === b
                        ? 'bg-brand-yellow text-black border-brand-yellow'
                        : 'bg-bg-elevated border-bg-border text-zinc-300 hover:border-zinc-500'
                    }`}
                  >
                    ${(b / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
              {/* Monto personalizado */}
              <input
                type="number"
                value={pagado || ''}
                onChange={(e) => setPagado(Number(e.target.value))}
                placeholder="Monto recibido..."
                className="w-full bg-bg-elevated border border-bg-border text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-yellow"
              />
              {pagado > 0 && (
                <div className={`mt-3 flex justify-between items-center px-4 py-3 rounded-xl ${cambio >= 0 ? 'bg-state-success/10 border border-state-success/30' : 'bg-state-error/10 border border-state-error/30'}`}>
                  <span className="text-zinc-400 text-sm font-bold">Cambio a entregar</span>
                  <span className={`font-black text-lg ${cambio >= 0 ? 'text-state-success' : 'text-state-error'}`}>
                    {formatCOP(cambio)}
                  </span>
                </div>
              )}
            </div>
          )}

          {metodo === 'TRANSFERENCIA' && (
            <div className="bg-state-info/10 border border-state-info/30 rounded-xl px-4 py-3">
              <p className="text-state-info text-sm font-bold text-center">
                📲 Confirma que la transferencia fue recibida antes de continuar.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1"
            onClick={() => cobrar.mutate()}
            disabled={!puedeConfirmar || cobrar.isPending}
          >
            {cobrar.isPending ? 'Procesando...' : '✓ Confirmar Cobro'}
          </Button>
        </div>
      </div>
    </div>
  );
}
