// src/components/cajero/ModalApertura.jsx
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../hooks/useStore';
import { toast } from 'sonner';

export default function ModalApertura({ onAperturaExitosa }) {
  const { user } = useAppStore();
  const [monto, setMonto] = useState('');
  const [isCargando, setIsCargando] = useState(false);

  const handleAbrirCaja = async () => {
    if (!monto || Number(monto) < 0) {
      toast.error('Ingresa un monto base válido');
      return;
    }

    setIsCargando(true);
    try {
      // Formato para Bogotá
      const ahora = new Date().toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).replace(' ', 'T');

      const { error } = await supabase
        .from('cierres_caja')
        .insert({
          cajero_id: user?.id,
          monto_apertura: Number(monto),
          estado: 'ABIERTA',
          fecha_apertura: ahora
        });

      if (error) throw error;

      toast.success('¡Caja abierta correctamente!');
      onAperturaExitosa();
    } catch (err) {
      toast.error('Error al abrir caja: ' + err.message);
    } finally {
      setIsCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-sm bg-[#121212] border border-white/[0.08] rounded-[15px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        <div className="p-8 space-y-6 text-center">
            <div className="w-20 h-20 bg-brand-yellow/10 rounded-full flex items-center justify-center text-brand-yellow mx-auto border border-brand-yellow/20 shadow-glow-sm">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>

            <div className="space-y-1">
                <h3 className="text-white font-black text-2xl tracking-tighter uppercase italic">Apertura de Caja</h3>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">Inicia el turno registrando la base</p>
            </div>

            <div className="space-y-3 pt-2">
                <label className="text-zinc-400 text-[9px] font-black uppercase tracking-widest block text-left ml-1">Monto para Vuelto / Cambio</label>
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-yellow font-black text-xl italic">$</span>
                    <input
                        autoFocus
                        type="number"
                        value={monto}
                        onChange={e => setMonto(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-16 bg-[#050505] border border-white/[0.05] rounded-[12px] pl-10 pr-6 text-2xl font-black text-white focus:outline-none focus:border-brand-yellow/50 transition-all placeholder:text-zinc-800 italic"
                    />
                </div>
            </div>

            <p className="text-zinc-600 text-[9px] leading-relaxed font-medium">
                * Este monto se sumará al total de efectivo al final del turno para facilitar el cuadre de caja.
            </p>

            <button
                onClick={handleAbrirCaja}
                disabled={isCargando}
                className="w-full h-14 bg-brand-yellow text-black font-black uppercase text-xs tracking-[0.2em] rounded-[12px] shadow-xl hover:bg-brand-yellow/90 transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
                {isCargando ? 'Iniciando...' : (
                    <>
                        Abrir Turno Ahora
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </>
                )}
            </button>
        </div>

      </div>
    </div>
  );
}
