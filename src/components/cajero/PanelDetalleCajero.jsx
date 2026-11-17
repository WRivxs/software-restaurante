// src/components/cajero/PanelDetalleCajero.jsx — Calco Visual de Referencia
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCOP } from '../../lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../../hooks/useStore';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ComandaCocinaPDF } from '../cocina/ComandaCocinaPDF';
import ConfirmDialog from '../ui/ConfirmDialog';

const BILLETES_COP = [10000, 20000, 50000, 100000];

export default function PanelDetalleCajero({ pedido, onCobrado }) {
  const { user } = useAppStore();
  const qc = useQueryClient();
  const [metodoPago, setMetodoPago] = useState('EFECTIVO'); // 'EFECTIVO' | 'TRANSFERENCIA'
  const [efectivoRecibido, setEfectivoRecibido] = useState(0);
  const comandaRef = useRef();
  const [imprimiendo, setImprimiendo] = useState(false);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);

  useEffect(() => {
    setEfectivoRecibido(0);
    setMetodoPago('EFECTIVO');
    setConfirmarCancelacion(false);
  }, [pedido?.id]);

  const updateEstadoMutation = useMutation({
    mutationFn: async ({ id, metadata = {} }) => {
      const { error } = await supabase
        .from('pedidos')
        .update({ 
          estado: 'PAGADO', 
          actualizado_en: new Date().toISOString(),
          ...metadata 
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos-activos'] });
      qc.invalidateQueries({ queryKey: ['historial-hoy'] });
      toast.success('Pago procesado correctamente');
      onCobrado?.();
    },
    onError: (err) => toast.error('Error: ' + err.message)
  });

  const cancelarPedidoMutation = useMutation({
    mutationFn: async () => {
      // 1. Marcar pedido como cancelado
      const { error: pError } = await supabase
        .from('pedidos')
        .update({ 
          estado: 'CANCELADO', 
          actualizado_en: new Date().toISOString() 
        })
        .eq('id', pedido.id);
      
      if (pError) throw pError;

      // 2. Si es de mesa, liberarla
      if (pedido.mesa_id) {
        await supabase
          .from('mesas')
          .update({ estado: 'LIBRE' })
          .eq('id', pedido.mesa_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos-activos'] });
      qc.invalidateQueries({ queryKey: ['mesas'] });
      toast.success('Pedido cancelado y mesa liberada');
      setConfirmarCancelacion(false);
      onCobrado?.();
    },
    onError: (err) => {
      toast.error('Error al cancelar: ' + err.message);
      setConfirmarCancelacion(false);
    }
  });

  if (!pedido) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-800">
        <div className="w-16 h-16 border-2 border-zinc-900 rounded-3xl flex items-center justify-center mb-4 rotate-45 opacity-20">
          <svg className="w-8 h-8 -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 022 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-30 italic">Esperando selección...</p>
      </div>
    );
  }

  const subtotal = pedido.total || 0;
  const propina = subtotal * 0.10;
  const totalConPropina = subtotal + propina;
  const cambio = efectivoRecibido > 0 ? (efectivoRecibido - totalConPropina) : 0;
  
  const canConfirm = metodoPago === 'TRANSFERENCIA' || efectivoRecibido >= totalConPropina;

  const handleCobrar = () => {
    updateEstadoMutation.mutate({ 
      id: pedido.id, 
      metadata: {
        metodo_pago: metodoPago,
        pago_cliente: metodoPago === 'EFECTIVO' ? efectivoRecibido : totalConPropina,
        cambio: metodoPago === 'EFECTIVO' ? cambio : 0,
        total: totalConPropina,
        cajero_id: user?.id
      }
    });
  };

  const handleImprimirComanda = async () => {
    if (imprimiendo) return;
    setImprimiendo(true);
    const toastId = toast.loading('Generando comanda para cocina...');

    try {
      // Pequeño delay para asegurar que el componente oculto se renderice si es necesario
      await new Promise(r => setTimeout(r, 100));
      
      const canvas = await html2canvas(comandaRef.current, { 
        backgroundColor: '#ffffff', 
        scale: 3, // Mayor calidad
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Calcular la altura dinámica basada en la proporción del canvas
      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({ 
        orientation: 'portrait', 
        unit: 'mm', 
        format: [pdfWidth, pdfHeight]
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      // Generar nombre de archivo descriptivo
      const nombreArchivo = pedido.mesa_id 
        ? `comanda-mesa-${String(pedido.mesa_id).padStart(2, '0')}.pdf`
        : `comanda-dom-${pedido.nombre_cliente || pedido.nombre_cliente_dom || 'cliente'}.pdf`;
      
      pdf.save(nombreArchivo);
      
      toast.success('Comanda generada correctamente', { id: toastId });
    } catch (error) {
      console.error('Error al generar comanda:', error);
      toast.error('Error al generar la comanda. Intenta de nuevo.', { id: toastId });
    } finally {
      setImprimiendo(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] relative">
      
      {/* ── COMANDA FUERA DE PANTALLA PARA CAPTURA (Solución Analítica) ── */}
      <div 
        style={{ 
          position: 'absolute', 
          left: '-10000px', 
          top: '0', 
          width: '300px', 
          background: 'white',
          visibility: 'visible' 
        }}
        aria-hidden="true"
      >
        <ComandaCocinaPDF ref={comandaRef} pedido={pedido} />
      </div>
      
      {/* ── HEADER COMPACTO ── */}
      <div className="flex items-start justify-between mb-4 p-5 pb-0">
        <div className="space-y-2">
          <h2 className="text-white font-black text-[20px] tracking-tighter leading-none">
            Resumen de Cuenta: <span className="text-[#FFC107] italic">{pedido.mesa_id ? `Mesa ${String(pedido.mesa_id).padStart(2, '0')}` : 'Domicilio'}</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="bg-white/5 border border-white/5 px-3 py-1 rounded-full text-zinc-500 text-[9px] font-black uppercase tracking-widest leading-none">
              Cajero: {user?.nombre || 'Admin'}
            </span>
            <span className="bg-white/5 border border-white/5 px-3 py-1 rounded-full text-zinc-500 text-[9px] font-black uppercase tracking-widest leading-none">
              Orden #{pedido.numero_pedido || pedido.id.split('-')[0]}
            </span>
            <span className="bg-[#FFC107]/10 border border-[#FFC107]/20 px-3 py-1 rounded-full text-[#FFC107] text-[9px] font-black uppercase tracking-widest leading-none">
              Cliente: {pedido.nombre_cliente || pedido.nombre_cliente_dom || 'S/N'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleImprimirComanda}
            disabled={imprimiendo}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all bg-white/5 border border-white/5 ${imprimiendo ? 'opacity-50' : 'hover:bg-[#FFC107] hover:text-black hover:scale-105 active:scale-95'}`}
            title="Imprimir Comanda Cocina"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
          <button onClick={() => onCobrado()} className="w-10 h-10 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>


      <div className="flex-1 border-t border-white/[0.03] pt-4 flex flex-col overflow-hidden px-5">
        
        {/* ── TABLA DE PRODUCTOS (Alta Densidad) ── */}
        <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar pr-2">
        {(pedido.notas || pedido.nota) && (
          <div className="mb-4 p-3 bg-[#FFC107]/5 border border-[#FFC107]/10 rounded-xl">
            <p className="text-[#FFC107] text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <span className="text-[12px]">📋</span> Nota General
            </p>
            <p className="text-white text-xs italic font-medium">{pedido.notas || pedido.nota}</p>
          </div>
        )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] border-b border-white/[0.03]">
                <th className="pb-3 font-black">Producto</th>
                <th className="pb-3 text-center font-black">Cant.</th>
                <th className="pb-3 text-right font-black">Precio</th>
                <th className="pb-3 text-right font-black">Total</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {pedido.detalle_pedido?.map((item, idx) => {
                const pUnit = item.precio_unitario || 0;
                return (
                  <tr key={idx} className="border-b border-white/[0.01] group">
                    <td className="py-2.5 font-bold text-white uppercase tracking-tight text-[11px] group-hover:text-[#FFC107] transition-colors leading-tight">
                      {item.productos?.nombre}
                      {(item.notas || item.nota) && <p className="text-[#FF5722] text-[8px] font-medium lowercase italic mt-0.5">{item.notas || item.nota}</p>}
                    </td>
                    <td className="py-2.5 text-center font-black text-white text-[11px]">{item.cantidad}</td>
                    <td className="py-2.5 text-right font-bold text-zinc-600 text-[11px]">{formatCOP(pUnit)}</td>
                    <td className="py-2.5 text-right font-black text-white text-[11px] tracking-tight">{formatCOP(pUnit * item.cantidad)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── SECCIÓN DE PAGO (Ancho Completo Borde a Borde) ── */}
        <div className="bg-black border-t border-white/[0.05] p-3 -mx-5 mt-auto">
          
          {/* Selector de Método de Pago */}
          <div className="mb-3 space-y-2">
            <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] ml-1">Método de Pago</p>
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/40 rounded-xl border border-white/5">
              <button
                onClick={() => setMetodoPago('EFECTIVO')}
                className={`h-9 rounded-lg font-medium text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${metodoPago === 'EFECTIVO' ? 'bg-[#FFC107] text-black shadow-lg shadow-[#FFC107]/10' : 'text-zinc-500 hover:text-white'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Efectivo
              </button>
              <button
                onClick={() => setMetodoPago('TRANSFERENCIA')}
                className={`h-9 rounded-lg font-medium text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${metodoPago === 'TRANSFERENCIA' ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/10' : 'text-zinc-500 hover:text-white'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Transferencia
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
            
            {/* Contenido Dinámico según Método */}
            <div className="min-h-[140px] flex flex-col justify-end">
              {metodoPago === 'EFECTIVO' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="space-y-3">
                    <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] ml-1">Billetes Rápidos</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {BILLETES_COP.map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setEfectivoRecibido(prev => prev + v)}
                          className="h-7 bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 rounded-lg text-white font-medium text-[11px] tracking-tighter transition-all active:scale-95"
                        >
                          ${v/1000}k
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-zinc-700 text-[9px] font-bold uppercase tracking-widest ml-1">Efectivo Recibido</label>
                      <input
                        type="number"
                        value={efectivoRecibido || ''}
                        onChange={(e) => setEfectivoRecibido(Number(e.target.value))}
                        placeholder="$ 0.00"
                        className="w-full h-10 bg-zinc-900/30 border border-white/[0.05] rounded-xl px-4 text-[16px] font-black text-white focus:outline-none focus:bg-zinc-900 transition-all placeholder-zinc-800 italic"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-700 text-[9px] font-bold uppercase tracking-widest ml-1">Cambio a Entregar</label>
                      <div className="w-full h-10 bg-zinc-900/30 border border-white/[0.05] rounded-xl px-4 flex items-center text-lg font-black text-white italic tracking-tighter opacity-80">
                        <span className="text-xs mr-2 text-zinc-600">$</span>
                        {Math.max(0, cambio).toLocaleString('es-CO')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-28 flex flex-col justify-center items-center bg-zinc-900/20 border border-white/5 rounded-2xl p-6 animate-in zoom-in-95 duration-300">
                  <div className="w-10 h-10 rounded-full bg-[#3B82F6]/10 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Monto a Transferir</p>
                  <p className="text-white text-xl font-black italic tracking-tighter">{formatCOP(totalConPropina)}</p>
                </div>
              )}
            </div>

            {/* Derecha: Totales y Botón */}
            <div className="flex flex-col justify-end gap-5">
              <div className="space-y-2 pr-1">
                <div className="flex justify-between items-center text-zinc-600 font-bold">
                  <span className="text-[9px] uppercase tracking-widest leading-none">Subtotal</span>
                  <span className="text-sm tracking-tighter">{formatCOP(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600 font-bold">
                  <span className="text-[9px] uppercase tracking-widest leading-none">Propina</span>
                  <span className="text-sm tracking-tighter">{formatCOP(propina)}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[#FFC107] font-black text-sm uppercase italic tracking-tighter">TOTAL</span>
                  <span className="text-[#FFC107] text-[30px] font-black italic tracking-tighter leading-none">
                    {formatCOP(totalConPropina)}
                  </span>
                </div>
              </div>

              <div className="relative overflow-hidden min-h-[44px]">
                {!confirmarCancelacion && (
                  <div className="flex gap-2 animate-in slide-in-from-bottom-2 duration-300">
                    <button
                      type="button"
                      onClick={handleCobrar}
                      disabled={!canConfirm || updateEstadoMutation.isPending}
                      className={`flex-1 h-11 rounded-[10px] font-black uppercase text-[11px] tracking-[0.1em] shadow-xl transition-all active:scale-[0.98] flex items-center justify-between px-5 group ${
                        canConfirm && !updateEstadoMutation.isPending
                        ? (metodoPago === 'EFECTIVO' ? 'bg-[#FFC107] text-black hover:bg-[#FFD54F]' : 'bg-[#3B82F6] text-white hover:bg-[#2563EB]')
                        : 'bg-zinc-900 text-zinc-700 opacity-50 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      <span className="truncate">
                        {updateEstadoMutation.isPending ? 'PROCESANDO...' : 
                         metodoPago === 'EFECTIVO' ? 'PROCESAR PAGO' : 'CONFIRMAR PAGO'}
                      </span>
                      {!updateEstadoMutation.isPending && (
                        <svg className="w-4 h-4 transition-transform group-hover:rotate-90 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={updateEstadoMutation.isPending}
                      onClick={() => setConfirmarCancelacion(true)}
                      className="w-12 h-11 bg-zinc-900 hover:bg-red-500/20 border border-white/5 rounded-[10px] flex items-center justify-center text-red-500 transition-all active:scale-95 group shadow-lg"
                      title="Cancelar Pedido"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>

        <ConfirmDialog
          open={confirmarCancelacion}
          onClose={() => setConfirmarCancelacion(false)}
          onConfirm={() => {
            cancelarPedidoMutation.mutate();
            setConfirmarCancelacion(false);
          }}
          title="Cancelar Mesa"
          description="¿Estás seguro de cancelar este pedido? Se liberará la mesa y se registrará como anulado."
          confirmText="SÍ, CANCELAR Y LIBERAR"
          variant="danger"
          isLoading={cancelarPedidoMutation.isPending}
        />

      </div>
    </div>
  );
}
