import { Card, CardBody } from '../ui/Card';
import { formatCOP } from '../../utils/formatCOP';

export default function DetallePedido({ pedido }) {
  if (!pedido) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-white font-black text-lg uppercase tracking-tight">
          {pedido.nombre_cliente_dom || pedido.nombre_cliente || 'Sin nombre'}
        </h3>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
          Canal: <span className="text-zinc-300">{pedido.canal}</span> | {pedido.mesa_id ? `Mesa ${pedido.mesa_id}` : `Tipo: ${pedido.tipo_domicilio}`}
        </p>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
        {pedido.detalle_pedido?.map((it) => (
          <div key={it.id} className="flex justify-between items-start p-3 bg-bg-surface border border-bg-border rounded-xl">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-white font-bold text-sm uppercase flex items-center gap-2">
                <span className="text-brand-yellow font-black">{it.cantidad}x</span> 
                {it.productos?.nombre}
              </p>
              {it.notes && <p className="text-zinc-500 text-[10px] mt-1 italic italic">Nota: {it.notes}</p>}
            </div>
            <div className="text-zinc-400 font-bold text-sm whitespace-nowrap">{formatCOP(it.subtotal)}</div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-bg-border flex justify-between items-end">
        <span className="text-zinc-500 text-xs font-black uppercase tracking-widest pb-1">Total a cobrar</span>
        <span className="text-brand-yellow text-3xl font-black">{formatCOP(pedido.total)}</span>
      </div>
    </div>
  );
}
