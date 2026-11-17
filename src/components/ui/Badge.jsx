// src/components/ui/Badge.jsx
import { cn } from '../../lib/utils';

const estadoMap = {
  PENDIENTE:  'bg-brand-orange/20 text-brand-orange border border-brand-orange/30',
  EN_PROCESO: 'bg-state-info/20 text-state-info border border-state-info/30',
  PAGADO:     'bg-state-success/20 text-state-success border border-state-success/30',
  ENTREGADO:  'bg-state-success/10 text-state-success border border-state-success/20',
  CANCELADO:  'bg-state-error/20 text-state-error border border-state-error/30',
  MESA:       'bg-bg-elevated text-zinc-300 border border-bg-border',
  DOMICILIO:  'bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20',
  RECOGER:    'bg-bg-elevated text-zinc-300 border border-bg-border',
  LLEVAR:     'bg-brand-orange/10 text-brand-orange border border-brand-orange/20',
};

export function Badge({ estado, className, children }) {
  const text = estado || (typeof children === 'string' ? children : '');
  const styles = estadoMap[text] || 'bg-bg-elevated text-zinc-400 border border-bg-border';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap',
        styles,
        className
      )}
    >
      {children || estado}
    </span>
  );
}
