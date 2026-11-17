// src/components/ui/Button.jsx
import { cn } from '../../lib/utils';

const variants = {
  primary: 'bg-brand-yellow text-black font-bold hover:bg-brand-hover active:scale-95',
  secondary: 'bg-brand-orange text-white font-bold hover:opacity-90 active:scale-95',
  outline: 'border border-bg-border text-white hover:bg-bg-elevated active:scale-95',
  ghost: 'text-zinc-400 hover:text-white hover:bg-bg-elevated active:scale-95',
  danger: 'bg-state-error text-white font-bold hover:opacity-90 active:scale-95',
  dark: 'bg-bg-elevated border border-bg-border text-white hover:border-brand-yellow/50 active:scale-95',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-[7px]',
  md: 'px-5 py-2.5 text-sm rounded-[7px]',
  lg: 'px-6 py-3.5 text-base rounded-[7px] font-bold',
  xl: 'px-8 py-5 text-lg rounded-[7px] font-bold',
};

export function Button({ className, variant = 'primary', size = 'md', disabled, children, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-150 select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
