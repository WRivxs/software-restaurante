// src/components/ui/Card.jsx
import { cn } from '../../lib/utils';

export function Card({ className, glow = false, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-bg-surface border border-bg-border rounded-card',
        glow && 'hover:shadow-glow hover:border-brand-yellow/30 transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('p-5 border-b border-bg-border', className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn('p-5 border-t border-bg-border', className)} {...props}>
      {children}
    </div>
  );
}
