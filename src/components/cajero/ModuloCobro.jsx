import { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCOP } from '../../utils/formatCOP';
import { calcularCambio } from '../../utils/calcularCambio';
import BilletesRapidos from './BilletesRapidos';

export default function ModuloCobro({ open, onClose, pedido, onConfirmar }) {
  const [pago, setPago] = useState('');
  const [metodo, setMetodo] = useState('EFECTIVO');

  if (!pedido) return null;

  const cambio = calcularCambio(pedido.total, Number(pago) || 0);

  return (
    <Dialog open={open} onClose={onClose} title="Procesar Cobro" size="md">
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-bg-elevated p-4 rounded-2xl border border-bg-border">
          <span className="text-zinc-500 text-xs font-black uppercase tracking-widest">Total Pedido</span>
          <span className="text-brand-yellow text-2xl font-black">{formatCOP(pedido.total)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMetodo('EFECTIVO')}
            className={`py-4 rounded-xl border-2 font-black transition-all ${metodo === 'EFECTIVO' ? 'border-brand-yellow bg-brand-yellow/10' : 'border-bg-border'}`}
          >
            💵 EFECTIVO
          </button>
          <button
            onClick={() => setMetodo('TRANSFERENCIA')}
            className={`py-4 rounded-xl border-2 font-black transition-all ${metodo === 'TRANSFERENCIA' ? 'border-brand-yellow bg-brand-yellow/10' : 'border-bg-border'}`}
          >
            📱 TRANSFERENCIA
          </button>
        </div>

        {metodo === 'EFECTIVO' && (
          <div className="space-y-4">
            <BilletesRapidos onSelect={(val) => setPago((Number(pago) || 0) + val)} />
            <Input
              label="Efectivo recibido"
              type="number"
              value={pago}
              onChange={(e) => setPago(e.target.value)}
              placeholder="0"
            />
            {Number(pago) >= pedido.total && (
              <div className="bg-state-success/10 border border-state-success/30 p-4 rounded-2xl flex justify-between items-center animate-in zoom-in-95">
                <span className="text-state-success text-xs font-black uppercase">Cambio a devolver</span>
                <span className="text-state-success text-2xl font-black">{formatCOP(cambio)}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button 
            className="flex-1" 
            disabled={metodo === 'EFECTIVO' && Number(pago) < pedido.total}
            onClick={() => onConfirmar({ pago: Number(pago), cambio, metodo })}
          >
            Confirmar Pago
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
