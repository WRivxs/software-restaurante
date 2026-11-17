// src/components/mesero/ComandaActiva.jsx
import { useAppStore } from '../../hooks/useStore';
import { formatCOP } from '../../lib/utils';
export default function ComandaActiva({ onEnviar, enviando, onClose }) {
  const { borradorPedido, actualizarNotas, eliminarItem, agregarItem, quitarItem, limpiarBorrador, setBorradorCampo } = useAppStore();
  const subtotal = borradorPedido.items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const total = subtotal;

  return (
    <div className="flex flex-col h-full animate-fade-in relative">
      {/* Header Comanda */}
      <div className="p-6 border-b border-white/5 bg-black/20">
        <div className="flex justify-between items-start">
           <div className="flex items-center gap-3">
             {/* Solo visible en móvil/tablet para cerrar el Sheet */}
             {onClose && (
               <div className="lg:hidden">
                 <button 
                   onClick={onClose}
                   className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400"
                 >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                 </button>
               </div>
             )}
             <div>
               <h2 className="text-white font-medium text-xs uppercase tracking-[0.2em]">Comanda Activa</h2>
               <p className="text-[#FFC107] text-[10px] font-black uppercase tracking-widest mt-1">
                 MESA {borradorPedido.mesaNumero ? String(borradorPedido.mesaNumero).padStart(2, '0') : '—'}
               </p>
             </div>
           </div>
           <button 
             onClick={limpiarBorrador}
             className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all border border-white/5 group"
             title="Vaciar Comanda"
           >
             <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
             </svg>
           </button>
        </div>
      </div>

      {/* Lista de Items */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar pb-32 lg:pb-6">
        {borradorPedido.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-10">
            <span className="text-4xl mb-2">🍽️</span>
            <p className="font-black text-[9px] uppercase tracking-[0.3em]">Esperando pedido...</p>
          </div>
        ) : (
          borradorPedido.items.map((item) => (
            <div key={item.productoId} className="group">
              <div className="flex justify-between items-center gap-3">
                <div className="flex gap-2 min-w-0 flex-1 items-center">
                  <span className="text-zinc-600 font-black text-[9px] shrink-0">{item.cantidad}X</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-black text-[11px] uppercase tracking-tight truncate leading-none">{item.nombre}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-zinc-400 font-bold text-[10px]">{formatCOP(item.precio * item.cantidad)}</span>
                  
                  {/* Selector Mini Horizontal */}
                  <div className="flex items-center bg-white/5 rounded-md border border-white/10 p-0.5">
                    <button 
                      type="button"
                      onClick={() => quitarItem(item.productoId)}
                      className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-red-500 transition-all text-[10px]"
                    >
                      −
                    </button>
                    <span className="px-1.5 text-[9px] font-black text-white">{item.cantidad}</span>
                    <button 
                      type="button"
                      onClick={() => agregarItem({ id: item.productoId, nombre: item.nombre, precio_venta: item.precio })}
                      className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-[#FFC107] transition-all text-[10px]"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notas Generales */}
      <div className="px-6 pb-2">
        <div className="bg-black/20 rounded-lg p-3 border border-white/5">
          <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <span className="text-[#FFC107]">✎</span> Nota General
          </p>
          <textarea 
            placeholder="Instrucciones para caja/cocina..."
            value={borradorPedido.notas}
            onChange={(e) => setBorradorCampo('notas', e.target.value)}
            className="w-full h-8 bg-transparent text-[11px] text-white placeholder:text-zinc-800 transition-all resize-none outline-none font-medium italic"
          />
        </div>
      </div>

      {/* Bloque de Totales */}
      <div className="p-6 border-t border-white/10 bg-black/40 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-zinc-500 font-medium uppercase tracking-widest">Subtotal</span>
            <span className="text-white font-medium">{formatCOP(subtotal)}</span>
          </div>
          <div className="flex justify-between items-end pt-2">
            <span className="text-[#FFC107] font-black text-sm uppercase tracking-[0.2em] italic">TOTAL</span>
            <span className="text-[#FFC107] font-black text-2xl tracking-tighter">{formatCOP(total)}</span>
          </div>
        </div>

        <button 
          onClick={onEnviar}
          disabled={enviando || borradorPedido.items.length === 0}
          className="w-full h-14 bg-[#FFC107] text-black font-black uppercase text-[11px] tracking-[0.2em] rounded-xl flex items-center justify-center gap-3 hover:bg-[#FFD54F] transition-all active:scale-95 disabled:opacity-20 disabled:grayscale"
        >
          {enviando ? (
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <>➤ ENVIAR A CAJA</>
          )}
        </button>
      </div>
    </div>
  );
}
