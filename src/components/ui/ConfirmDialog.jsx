// src/components/ui/ConfirmDialog.jsx
import React from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';

/**
 * Un diálogo de confirmación premium con diseño Pitch Black.
 * @param {boolean} open - Si el modal está abierto.
 * @param {function} onClose - Función para cerrar el modal.
 * @param {function} onConfirm - Función al confirmar.
 * @param {string} title - Título del diálogo.
 * @param {string} description - Mensaje de descripción.
 * @param {string} confirmText - Texto del botón de confirmación.
 * @param {string} cancelText - Texto del botón de cancelación.
 * @param {string} variant - 'danger' | 'warning' | 'primary'
 * @param {boolean} isLoading - Si el botón de confirmación está cargando.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirmar Acción",
  description = "¿Estás seguro de realizar esta operación?",
  confirmText = "SÍ, CONFIRMAR",
  cancelText = "VOLVER",
  variant = "danger",
  isLoading = false
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.1)]',
          button: 'bg-red-600 hover:bg-red-700 text-white',
          svg: (
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          )
        };
      case 'warning':
        return {
          icon: 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.1)]',
          button: 'bg-[#FFB100] hover:bg-[#FFD54F] text-black',
          svg: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          )
        };
      default:
        return {
          icon: 'bg-blue-500/10 border-blue-500/20 text-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.1)]',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          svg: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          )
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Dialog open={open} onClose={onClose} title={title} size="xs">
      <div className="flex flex-col items-center text-center space-y-4 py-2 px-1 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Icono Rediseñado - Compacto */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-500 ${styles.icon}`}>
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {styles.svg}
          </svg>
        </div>

        {/* Textos */}
        <div className="space-y-1.5">
          <h3 className="text-white font-black text-lg tracking-tighter uppercase italic leading-tight">
            {description}
          </h3>
          <p className="text-zinc-500 text-[10px] font-bold leading-relaxed uppercase tracking-widest opacity-60">
            Confirmación de Seguridad • Acción Irreversible
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col w-full gap-2 pt-1">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full h-11 font-black uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center ${styles.button} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'PROCESANDO...' : confirmText}
          </button>
          
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full h-11 bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 font-black uppercase text-[10px] tracking-[0.2em] rounded-xl border border-white/5 transition-all"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
