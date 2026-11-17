import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Helper de shadcn/ui para combinar clases Tailwind */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Formatea un número como moneda COP */
export function formatCOP(amount) {
  if (amount == null || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Genera las iniciales de un nombre */
export function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

/** Genera un código de pedido único */
export function generarCodigo(canal) {
  const prefix = canal === 'MESA' ? 'M' : 'D';
  const num = Date.now().toString().slice(-4);
  return `${prefix}-${num}`;
}
