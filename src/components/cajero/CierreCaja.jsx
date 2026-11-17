// src/components/cajero/CierreCaja.jsx
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCOP } from '../../lib/utils';
import { toast } from 'sonner';

export default function CierreCaja({ onClose, datos }) {
  const [totalFisico, setTotalFisico] = useState('');
  const [isCerrando, setIsCerrando] = useState(false);

  const totalEsperadoConBase = (datos.monto_apertura || 0) + datos.ventas_efectivo - (datos.total_egresos || 0);
  const diferencia = (Number(totalFisico) || 0) - totalEsperadoConBase;

  const handleCerrarCaja = async () => {
    if (!totalFisico) {
      toast.error('Ingresa el total físico contado');
      return;
    }

    setIsCerrando(true);
    try {
      const { error } = await supabase
        .from('cierres_caja')
        .update({
          ventas_efectivo: datos.ventas_efectivo,
          ventas_transferencia: datos.ventas_transferencia,
          total_esperado: totalEsperadoConBase,
          monto_real_contado: Number(totalFisico),
          diferencia: diferencia,
          estado: 'CERRADA',
          fecha_cierre: new Date().toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).replace(' ', 'T')
        })
        .eq('id', datos.id); // Usamos el ID del registro creado en la apertura

      if (error) throw error;

      toast.success('¡Caja cerrada correctamente!');
      onClose();
      // Opcional: Redirigir al inicio o mostrar resumen final
    } catch (err) {
      toast.error('Error al cerrar caja: ' + err.message);
    } finally {
      setIsCerrando(false);
    }
  };  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#121212] border border-white/[0.05] rounded-[10px] overflow-hidden shadow-2xl relative">
        
        <div className="p-8 space-y-6">
          
          {/* ── ENCABEZADO ── */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-[#FFB100]/10 rounded-xl flex items-center justify-center text-[#FFB100] border border-[#FFB100]/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
               </div>
               <div className="space-y-0.5">
                  <h3 className="text-white font-black text-xl tracking-tight leading-none">Cierre de Caja</h3>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Finalizar turno y arquear valores</p>
               </div>
            </div>
            <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors mt-1">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* ── RESUMEN EN TARJETAS ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#050505] p-3 rounded-[10px] border border-white/5 space-y-1">
               <span className="text-zinc-500 text-[8px] font-black uppercase tracking-widest leading-none">Base Apertura</span>
               <p className="text-white font-black text-sm italic tracking-tighter leading-none">{formatCOP(datos.monto_apertura)}</p>
            </div>
            <div className="bg-[#050505] p-3 rounded-[10px] border border-white/5 space-y-1">
               <span className="text-zinc-500 text-[8px] font-black uppercase tracking-widest leading-none">Ventas Efectivo</span>
               <p className="text-white font-black text-sm italic tracking-tighter leading-none">{formatCOP(datos.ventas_efectivo)}</p>
            </div>
            <div className="bg-[#050505] p-3 rounded-[10px] border border-white/5 space-y-1">
               <span className="text-red-500/80 text-[8px] font-black uppercase tracking-widest leading-none">Gastos (Egresos)</span>
               <p className="text-red-500/80 font-black text-sm italic tracking-tighter leading-none">-{formatCOP(datos.total_egresos || 0)}</p>
            </div>
          </div>

          <div className="bg-brand-yellow/5 p-4 rounded-[10px] border border-brand-yellow/10 flex justify-between items-center group">
             <span className="text-brand-yellow text-[10px] font-black uppercase tracking-widest">Total Esperado</span>
             <p className="text-brand-yellow font-black text-xl italic group-hover:scale-105 transition-transform">{formatCOP(totalEsperadoConBase)}</p>
          </div>

          <div className="bg-[#050505] p-4 rounded-[10px] border border-white/5 flex justify-between items-center">
             <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Transferencias</span>
             <p className="text-white font-black text-lg italic">{formatCOP(datos.ventas_transferencia)}</p>
          </div>

          {/* ── INPUT MONTO REAL ── */}
          <div className="space-y-3">
             <label className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em] ml-1">Monto Físico Total en Caja (Efectivo)</label>
             <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFB100] font-black text-lg italic">$</span>
                <input
                  autoFocus
                  type="number"
                  value={totalFisico}
                  onChange={e => setTotalFisico(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-14 bg-[#050505] border border-white/5 rounded-[10px] pl-10 pr-6 text-xl font-black text-white focus:outline-none focus:border-[#FFB100]/40 transition-all placeholder:text-zinc-800 italic"
                />
             </div>
          </div>

          {/* ── AVISO DE CIERRE ── */}
          <div className="bg-red-500/5 border border-red-500/10 rounded-[10px] p-4 flex gap-3 items-start">
             <div className="w-5 h-5 bg-red-500/10 rounded flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             </div>
             <p className="text-[9px] text-red-500/70 font-bold leading-relaxed uppercase tracking-wide">
                Al confirmar el cierre, no podrás agregar más ventas a este turno. Se generará un reporte automático para auditoría.
             </p>
          </div>

          {/* ── ACCIONES ── */}
          <div className="flex gap-3 pt-2">
             <button onClick={onClose} className="flex-1 h-12 bg-zinc-900/50 text-white font-black uppercase text-[10px] tracking-widest rounded-[10px] border border-white/5 transition-all hover:bg-zinc-800">
               Cancelar
             </button>
             <button
               onClick={handleCerrarCaja}
               disabled={isCerrando}
               className="flex-1 h-12 bg-[#FFB100] text-black font-black uppercase text-[10px] tracking-widest rounded-[10px] shadow-xl hover:bg-[#FFD54F] transition-all active:scale-95 flex items-center justify-center"
             >
               {isCerrando ? 'Procesando...' : 'Confirmar Cierre'}
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}
