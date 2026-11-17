import { Card, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatCOP } from '../../utils/formatCOP';

const ESTADOS = {
  PENDIENTE: 'bg-state-error/20 text-state-error',
  EN_PROCESO: 'bg-brand-orange/20 text-brand-orange',
  PAGADO: 'bg-state-success/20 text-state-success',
};

export default function TarjetaPedido({ pedido, onClick }) {
  return (
    <Card onClick={onClick} className="cursor-pointer hover:bg-bg-elevated transition-colors border-bg-border">
      <CardBody className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{pedido.codigo}</p>
            <h3 className="text-white font-black text-sm truncate uppercase">
              {pedido.nombre_cliente_dom || pedido.nombre_cliente || 'Sin nombre'}
            </h3>
          </div>
          <Badge className={ESTADOS[pedido.estado]}>{pedido.estado}</Badge>
        </div>
        
        <div className="flex justify-between items-end">
          <div className="text-[10px] text-zinc-500 font-bold">
            {pedido.canal === 'MESA' ? `Mesa ${pedido.mesa_id}` : `Domicilio (${pedido.tipo_domicilio})`}
          </div>
          <div className="text-brand-yellow font-black text-sm">{formatCOP(pedido.total)}</div>
        </div>
      </CardBody>
    </Card>
  );
}
