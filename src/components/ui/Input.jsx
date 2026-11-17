// src/components/ui/Input.jsx
import { cn } from '../../lib/utils';
import { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  { className, label, error, icon, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-[#050505] border border-bg-border text-white rounded-[7px]',
            'px-4 py-3 text-sm font-medium placeholder-zinc-600',
            'focus:outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/10',
            'transition-all duration-150',
            icon && 'pl-10',
            error && 'border-state-error focus:border-state-error focus:ring-state-error/10',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-state-error text-xs font-medium pl-1">{error}</p>
      )}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { className, label, error, children, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full bg-[#050505] border border-bg-border text-white rounded-[7px]',
          'px-4 py-3 text-sm font-medium',
          'focus:outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/10',
          'transition-all duration-150',
          error && 'border-state-error',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-state-error text-xs font-medium pl-1">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { className, label, error, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'w-full bg-[#050505] border border-bg-border text-white rounded-[7px]',
          'px-4 py-3 text-sm font-medium placeholder-zinc-600 resize-none',
          'focus:outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/10',
          'transition-all duration-150',
          error && 'border-state-error',
          className
        )}
        {...props}
      />
      {error && <p className="text-state-error text-xs font-medium pl-1">{error}</p>}
    </div>
  );
});
