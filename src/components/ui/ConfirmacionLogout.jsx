// src/components/ui/ConfirmacionLogout.jsx
import React from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';

export default function ConfirmacionLogout({ open, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose} title="CONFIRMAR SALIDA" size="sm">
      <div className="flex flex-col items-center text-center space-y-6 py-2">
        {/* Icono de salida estilizado */}
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>

        <div className="space-y-2">
          <h3 className="text-white font-black text-xl tracking-tighter uppercase italic">
            ¿Deseas cerrar sesión?
          </h3>
          <p className="text-zinc-500 text-xs font-medium leading-relaxed max-w-[240px]">
            Tendrás que ingresar tus credenciales nuevamente para acceder al panel administrativo.
          </p>
        </div>

        <div className="flex flex-col w-full gap-3 pt-2">
          <button
            onClick={onConfirm}
            className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-lg transition-all active:scale-[0.98]"
          >
            SÍ, CERRAR SESIÓN
          </button>
          <button
            onClick={onClose}
            className="w-full h-14 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 font-black uppercase text-[11px] tracking-widest rounded-2xl border border-white/5 transition-all"
          >
            CANCELAR
          </button>
        </div>
      </div>
    </Dialog>
  );
}
