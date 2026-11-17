// src/components/ui/Toast.jsx
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { cn } from '../../lib/utils';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const typeMap = {
    success: 'border-state-success/50 text-state-success',
    error: 'border-state-error/50 text-state-error',
    warning: 'border-brand-orange/50 text-brand-orange',
    info: 'border-state-info/50 text-state-info',
  };

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'bg-bg-elevated border rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl',
              'animate-in slide-in-from-right-5 duration-300 pointer-events-auto min-w-[260px]',
              typeMap[t.type]
            )}
          >
            <span className="text-base font-black">{iconMap[t.type]}</span>
            <p className="text-white text-sm font-medium">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe estar dentro de ToastProvider');
  return ctx;
}
