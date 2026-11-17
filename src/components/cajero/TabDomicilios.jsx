// src/components/cajero/TabDomicilios.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { formatCOP } from '../../lib/utils';
import { toast } from 'sonner';
import { useProductos } from '../../hooks/useProductos';
import { useCategorias } from '../../hooks/useCategorias';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import FacturaModal from '../factura/FacturaModal';
import { ComandaCocinaPDF } from '../cocina/ComandaCocinaPDF';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef } from 'react';
import ConfirmDialog from '../ui/ConfirmDialog';

export default function TabDomicilios({ cajeroId }) {
  const qc = useQueryClient();
  
  // --- ESTADOS ---
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    tipo: 'LLEVAR', 
    direccion: '',
    productos: [], 
    costo_domicilio: 0,
    metodo_pago: 'EFECTIVO', 
    pago_cliente: 0
  });

  // --- CÁLCULOS DERIVADOS ---
  const totalProductos = form.productos.reduce((s, p) => s + (p.precio * p.cantidad), 0);
  const costoEnvioCalculado = form.tipo === 'LLEVAR' ? (Number(form.costo_domicilio) || 0) : 0;
  const totalPedidoCalculado = totalProductos + costoEnvioCalculado;
  const pagoClienteCalculado = Number(form.pago_cliente) || 0;
  const cambioCalculado = Math.max(0, pagoClienteCalculado - totalPedidoCalculado);

  const [showFactura, setShowFactura] = useState(false);
  const [pedidoFacturar, setPedidoFacturar] = useState(null);
  const [pedidoImprimiendo, setPedidoImprimiendo] = useState(null);
  const [imprimiendo, setImprimiendo] = useState(false);
  const comandaRef = useRef();

  // Estados para diálogos premium
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [idParaCancelar, setIdParaCancelar] = useState(null);

  // --- DATOS ---
  const { data: categorias = [] } = useCategorias();
  const { data: productos = [] } = useProductos();
  const [catActiva, setCatActiva] = useState(null);

  const { data: domicilios = [], isLoading } = useQuery({
    queryKey: ['domicilios-activos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, detalle_pedido(*, productos(nombre))')
        .eq('canal', 'DOMICILIO')
        .in('estado', ['PENDIENTE', 'EN_PROCESO', 'PAGADO'])
        .order('actualizado_en', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000
  });

  // --- MUTACIONES ---
  const guardarDomicilioMutation = useMutation({
    mutationFn: async (payload) => {
      const costoEnvio = payload.tipo === 'LLEVAR' ? (Number(payload.costo_domicilio) || 0) : 0;
      const pagoCliente = Number(payload.pago_cliente) || 0;
      const subtotalProductos = payload.productos.reduce((acc, curr) => acc + (curr.precio * curr.cantidad), 0);
      const totalPedido = subtotalProductos + costoEnvio;

      // 1. Crear Pedido
      const { data: pedido, error: pErr } = await supabase
        .from('pedidos')
        .insert({
          canal: 'DOMICILIO',
          estado: 'PAGADO',
          nombre_cliente_dom: payload.nombre || 'Cliente Domicilio',
          telefono_cliente: payload.telefono || null,
          tipo_domicilio: payload.tipo,
          direccion_cliente: payload.tipo === 'LLEVAR' ? (payload.direccion || '').trim() : 'Recoge en Local',
          costo_domicilio: costoEnvio,
          metodo_pago: payload.metodo_pago || 'EFECTIVO',
          pago_cliente: pagoCliente,
          total: totalPedido,
          mesero_id: cajeroId || null,
          codigo: `D-${Date.now().toString().slice(-4)}`
        })
        .select()
        .single();
      
      if (pErr) throw pErr;

      // 2. Crear Detalle
      const detalles = payload.productos.map(p => ({
        pedido_id: pedido.id,
        producto_id: p.id,
        cantidad: p.cantidad,
        precio_unitario: p.precio,
        subtotal: p.precio * p.cantidad,
        notas: p.notas
      }));

      const { error: dErr } = await supabase.from('detalle_pedido').insert(detalles);
      if (dErr) throw dErr;

      return { 
        ...pedido, 
        detalle_pedido: detalles.map(d => ({ 
          ...d, 
          subtotal: d.subtotal, // Asegurarnos de que el subtotal pase
          productos: { nombre: payload.productos.find(x => x.id === d.producto_id)?.nombre } 
        })) 
      };
    },
    onSuccess: (pedidoCompleto) => {
      toast.success('¡Domicilio registrado y pagado!');
      qc.invalidateQueries({ queryKey: ['domicilios-activos'] });
      resetForm();
      
      setPedidoFacturar(pedidoCompleto);
      setShowFactura(true);
    },
    onError: (err) => toast.error('Error: ' + err.message)
  });

  const finalizarDomicilioMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: 'ENTREGADO', actualizado_en: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Domicilio entregado');
      qc.invalidateQueries({ queryKey: ['domicilios-activos'] });
    }
  });

  const cancelarDomicilioMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('pedidos')
        .update({ 
          estado: 'CANCELADO', 
          motivo_cancelacion: 'Cancelado por cajero',
          actualizado_en: new Date().toISOString() 
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.error('Domicilio cancelado');
      qc.invalidateQueries({ queryKey: ['domicilios-activos'] });
    }
  });

  const handleImprimirComanda = async (pedido) => {
    setImprimiendo(true);
    setPedidoImprimiendo(pedido);
    
    // Pequeño delay para asegurar el renderizado del componente oculto
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      if (!comandaRef.current) throw new Error("No se pudo encontrar la referencia de la comanda");
      
      const canvas = await html2canvas(comandaRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [80, 150]
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`comanda-dom-${pedido.nombre_cliente_dom || 'cliente'}.pdf`);
      toast.success('Comanda generada');
    } catch (error) {
      console.error('Error comanda:', error);
      toast.error('Error al generar comanda');
    } finally {
      setImprimiendo(false);
      setPedidoImprimiendo(null);
    }
  };

  // --- HELPERS ---
  const resetForm = () => {
    setStep(1);
    setForm({
      nombre: '',
      telefono: '',
      tipo: 'LLEVAR',
      direccion: '',
      productos: [],
      costo_domicilio: 0,
      metodo_pago: 'EFECTIVO',
      pago_cliente: 0
    });
  };

  const handleAddProduct = (p) => {
    setForm(prev => {
      const exists = prev.productos.find(item => item.id === p.id);
      if (exists) {
        return {
          ...prev,
          productos: prev.productos.map(item => 
            item.id === p.id ? { ...item, cantidad: item.cantidad + 1 } : item
          )
        };
      }
      return {
        ...prev,
        productos: [...prev.productos, { id: p.id, nombre: p.nombre, precio: p.precio_venta, cantidad: 1, notas: '' }]
      };
    });
  };

  const handleRemoveOne = (pId) => {
    setForm(prev => {
      const p = prev.productos.find(x => x.id === pId);
      if (p.cantidad > 1) {
        return {
          ...prev,
          productos: prev.productos.map(x => x.id === pId ? { ...x, cantidad: x.cantidad - 1 } : x)
        };
      }
      return {
        ...prev,
        productos: prev.productos.filter(x => x.id !== pId)
      };
    });
  };

  return (
    <div className="flex h-full bg-black overflow-hidden font-sans">
      
      {/* ── COLUMNA IZQUIERDA: LISTA DE DOMICILIOS ── */}
      <aside className="w-3/5 flex flex-col border-r border-white/5 p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
           <div className="space-y-1">
             <h2 className="text-white font-black text-2xl tracking-tighter uppercase">Domicilios Activos</h2>
             <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">{domicilios.length} Pedidos en curso</p>
           </div>
           <button 
             onClick={resetForm}
             className="h-10 px-6 bg-[#FFC107] text-black font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-[#FFC107]/5 flex items-center gap-2 hover:bg-[#FFD54F] transition-all"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
             </svg>
             Nuevo Domicilio
           </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 h-full">
           {isLoading ? (
             <div className="grid grid-cols-2 gap-4">
               {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white/5 animate-pulse rounded-2xl" />)}
             </div>
           ) : (
             <div className="grid grid-cols-2 gap-4 pb-10">
                {domicilios.map(d => {
                  const tiempo = formatDistanceToNow(new Date(d.creado_en), { addSuffix: false, locale: es });
                  const isPagado = d.estado === 'PAGADO';
                  
                  return (
                    <div key={d.id} className={`bg-[#111111] border rounded-2xl p-5 flex flex-col justify-between hover:border-white/10 transition-all relative overflow-hidden group ${isPagado ? 'border-[#22C55E]/20 bg-[#22C55E]/[0.02]' : 'border-white/5'}`}>
                       <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-white font-black text-[13px] uppercase truncate pr-2 leading-none">{d.nombre_cliente_dom}</h3>
                            <p className="text-zinc-600 text-[9px] font-bold truncate pr-3 mt-1 opacity-70">{d.direccion_cliente || 'Recoge en Local'}</p>
                            <p className="text-zinc-700 text-[9px] font-black uppercase tracking-widest mt-2 whitespace-nowrap opacity-60">
                              Hace {tiempo}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                              isPagado ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20' : 'bg-[#FFC107]/10 text-[#FFC107] border-[#FFC107]/20'
                            }`}>
                              {d.estado}
                            </span>
                            <span className="text-[#FFC107] font-black text-[16px] italic tracking-tighter leading-none mt-0.5">
                              {formatCOP(d.total)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 pt-1 border-t border-white/[0.03]">
                            <button 
                              onClick={() => {
                                setIdParaCancelar(d.id);
                                setShowConfirmCancel(true);
                              }}
                              className="w-10 h-10 rounded-xl bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/20 text-[#EF4444] flex items-center justify-center transition-all group/btn"
                              title="Cancelar Domicilio"
                            >
                              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                            
                            {isPagado && (
                              <>
                                <button 
                                  onClick={() => handleImprimirComanda(d)}
                                  disabled={imprimiendo}
                                  className="w-10 h-10 rounded-xl bg-[#FFB100]/10 hover:bg-[#FFB100]/20 border border-[#FFB100]/20 text-[#FFB100] flex items-center justify-center transition-all disabled:opacity-50"
                                  title="Imprimir Comanda Cocina"
                                >
                                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                </button>
                                <button 
                                  onClick={() => {
                                    setPedidoFacturar(d);
                                    setShowFactura(true);
                                  }}
                                  className="w-10 h-10 rounded-xl bg-[#22C55E]/10 hover:bg-[#22C55E]/20 border border-[#22C55E]/20 text-[#22C55E] flex items-center justify-center transition-all"
                                  title="Ver Factura"
                                >
                                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </button>
                              </>
                            )}
                            
                            <button 
                              onClick={() => finalizarDomicilioMutation.mutate(d.id)}
                              className={`h-10 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest flex-1 ${
                                isPagado 
                                  ? 'bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/20' 
                                  : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:text-white'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Entregar</span>
                            </button>
                        </div>
                    </div>
                  );
                })}
             </div>
           )}

           {!isLoading && domicilios.length === 0 && (
             <div className="h-64 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">Sin Domicilios</p>
             </div>
            )}
         </div>
      </aside>

      {/* ── COLUMNA DERECHA: REGISTRO DE PEDIDO ── */}
      <section className="w-2/5 flex flex-col bg-[#0A0A0A] relative border-l border-white/5">
        <div className="p-6 pb-2">
           <div className="flex justify-between items-center mb-3">
              <h2 className="text-white font-black text-xl tracking-tight">Registro de Pedido</h2>
              {step > 1 && (
                <button 
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-[#FFC107] transition-all group"
                >
                  <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  <span className="text-[9px] font-black uppercase tracking-widest">Volver</span>
                </button>
              )}
           </div>
           
           {/* Stepper matching screenshot */}
           <div className="flex gap-1.5 mb-2">
              <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-[#FFC107]' : 'bg-zinc-800'}`} />
              <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-[#FFC107]' : 'bg-zinc-800'}`} />
              <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-[#FFC107]' : 'bg-zinc-800'}`} />
           </div>
           <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest italic">
             {step === 1 && 'PASO 1: DATOS DEL CLIENTE'}
             {step === 2 && 'PASO 2: SELECCIÓN DE MENÚ'}
             {step === 3 && 'PASO 3: RESUMEN Y PAGO'}
           </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-28 custom-scrollbar">
           {/* PASO 1: DATOS CLIENTE */}
           {step === 1 && (
             <div className="space-y-4 mt-3">
                <div className="space-y-1.5">
                   <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Teléfono</label>
                   <input 
                     type="text" 
                     value={form.telefono}
                     onChange={e => setForm({...form, telefono: e.target.value})}
                     placeholder="310 000 0000"
                     className="w-full h-9 bg-zinc-900/60 border border-white/5 rounded-lg px-4 text-sm text-white placeholder-zinc-800 focus:outline-none focus:border-[#FFC107]/30 transition-all font-medium"
                   />
                </div>

                <div className="space-y-1.5">
                   <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Nombre</label>
                   <input 
                     type="text" 
                     value={form.nombre}
                     onChange={e => setForm({...form, nombre: e.target.value})}
                     placeholder="Nombre del cliente"
                     className="w-full h-9 bg-zinc-900/60 border border-white/5 rounded-lg px-4 text-sm text-white placeholder-zinc-800 focus:outline-none focus:border-[#FFC107]/30 transition-all font-medium"
                   />
                </div>

                <div className="space-y-1.5">
                   <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Tipo de Entrega</label>
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setForm({...form, tipo: 'LLEVAR'})}
                        className={`h-8 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all border ${form.tipo === 'LLEVAR' ? 'border-[#FFC107] text-[#FFC107] bg-[#FFC107]/5' : 'bg-zinc-900/40 border-white/5 text-zinc-600'}`}
                      >
                        Llevar
                      </button>
                      <button 
                        onClick={() => setForm({...form, tipo: 'RECOGER'})}
                        className={`h-8 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all border ${form.tipo === 'RECOGER' ? 'border-[#FFC107] text-[#FFC107] bg-[#FFC107]/5' : 'bg-zinc-900/40 border-white/5 text-zinc-600'}`}
                      >
                        Recoger
                      </button>
                   </div>
                </div>

                {form.tipo === 'LLEVAR' && (
                  <div className="space-y-1.5">
                     <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Dirección</label>
                     <textarea 
                       rows="2"
                       value={form.direccion}
                       onChange={e => setForm({...form, direccion: e.target.value})}
                       placeholder="Carrera... # ..."
                       className="w-full bg-zinc-900/60 border border-white/5 rounded-lg p-3 text-sm text-white placeholder-zinc-800 focus:outline-none focus:border-[#FFC107]/30 transition-all font-medium resize-none"
                     />
                  </div>
                )}
             </div>
           )}

           {/* PASO 2: PRODUCTOS */}
           {step === 2 && (
             <div className="flex flex-col h-full gap-4 mt-2">
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                   {categorias.map(c => (
                     <button 
                       key={c.id}
                       onClick={() => setCatActiva(c.id)}
                       className={`shrink-0 px-4 py-1 rounded-[2px] text-[9px] font-black uppercase tracking-widest transition-all ${catActiva === c.id ? 'bg-[#FFC107] text-black shadow-lg shadow-[#FFC107]/10' : 'bg-zinc-800/50 text-zinc-500 hover:text-white'}`}
                     >
                       {c.nombre}
                     </button>
                   ))}
                </div>

                <div className="grid grid-cols-2 gap-2 content-start overflow-y-auto flex-1 pr-1 custom-scrollbar">
                   {(catActiva ? productos.filter(p => p.categoria_id === catActiva) : productos).map(p => (
                     <button 
                       key={p.id}
                       onClick={() => handleAddProduct(p)}
                       className="h-9 bg-zinc-900/60 border border-white/5 rounded-lg px-3 flex flex-col justify-center hover:border-[#FFC107]/40 transition-all text-left group"
                     >
                        <span className="text-white font-bold text-[9px] uppercase leading-none truncate group-hover:text-[#FFC107] transition-colors">{p.nombre}</span>
                        <span className="text-[#FFC107] font-black text-[8px] italic mt-0.5">{formatCOP(p.precio_venta)}</span>
                     </button>
                   ))}
                </div>

                {/* Pedido Actual Summary (FULL WIDTH LIST) */}
                <div className="flex-[1.4] flex flex-col mt-4 min-h-0">
                   <h4 className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-3 italic">Resumen del Pedido</h4>
                   <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {form.productos.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-zinc-900/40 border border-white/[0.02] rounded-lg px-3 py-1.5 transition-all hover:bg-zinc-900/60 group">
                           <div className="flex items-center gap-2">
                             <span className="text-[#FFC107] font-black text-[11px]">{item.cantidad}x</span>
                             <span className="text-[#E0E0E0] font-bold text-[10px] uppercase tracking-tighter line-clamp-1">{item.nombre}</span>
                           </div>
                           <div className="flex items-center gap-3">
                             <span className="text-white font-black text-[10px] tabular-nums">{formatCOP(item.precio * item.cantidad)}</span>
                             <button onClick={() => handleRemoveOne(item.id)} className="text-zinc-700 hover:text-red-500 transition-colors">
                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                               </svg>
                             </button>
                           </div>
                        </div>
                      ))}
                      {form.productos.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 border border-dashed border-white/5 rounded-xl p-8">
                           <p className="text-[9px] font-black uppercase tracking-widest">Sin items</p>
                        </div>
                      )}
                   </div>
                </div>
             </div>
           )}

           {/* PASO 3: COBRO FINAL */}
           {step === 3 && (
             <div className="space-y-2 mt-2">
                {/* Total box like screenshot */}
                <div className="bg-zinc-900/60 border border-white/5 rounded-xl py-1.5 px-4 flex justify-between items-center">
                   <span className="text-white font-black text-[11px] uppercase">Total del Pedido</span>
                   <span className="text-[#FFC107] font-black text-base italic">
                     {formatCOP(totalPedidoCalculado)}
                   </span>
                </div>

                {/* Costo Domicilio Field */}
                {form.tipo === 'LLEVAR' && (
                  <div className="space-y-1">
                     <label className="text-zinc-600 text-[9px] font-black uppercase tracking-widest ml-1">Costo Envío</label>
                     <input 
                       type="number" 
                       value={form.costo_domicilio}
                       onFocus={(e) => e.target.select()}
                       onChange={e => {
                          const val = e.target.value;
                          setForm({...form, costo_domicilio: val === '' ? '' : Number(val)});
                       }}
                       className="w-full h-8 bg-zinc-900/60 border border-[#FFC107]/20 rounded-lg px-4 text-sm font-black text-[#FFC107] focus:outline-none"
                       placeholder="0"
                     />
                  </div>
                )}

                {/* Método de Pago Selector */}
                <div className="space-y-1">
                   <label className="text-zinc-600 text-[9px] font-black uppercase tracking-widest ml-1">Pago</label>
                   <div className="grid grid-cols-2 bg-zinc-900/40 p-1 rounded-lg border border-white/5">
                      <button 
                        onClick={() => setForm({...form, metodo_pago: 'EFECTIVO'})}
                        className={`h-7 rounded-[4px] font-black text-[9px] uppercase tracking-widest transition-all ${form.metodo_pago === 'EFECTIVO' ? 'bg-zinc-800 text-[#FFC107] border border-white/5 shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
                      >
                        Efectivo
                      </button>
                      <button 
                        onClick={() => setForm({...form, metodo_pago: 'TRANSFERENCIA'})}
                        className={`h-7 rounded-[4px] font-black text-[9px] uppercase tracking-widest transition-all ${form.metodo_pago === 'TRANSFERENCIA' ? 'bg-zinc-800 text-[#FFC107] border border-white/5 shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
                      >
                        Transferencia
                      </button>
                   </div>
                </div>

                {form.metodo_pago === 'EFECTIVO' ? (
                  <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     {/* Billetes */}
                     <div className="space-y-1">
                        <label className="text-zinc-600 text-[9px] font-black uppercase tracking-widest ml-1">Billetes Rápidos</label>
                        <div className="grid grid-cols-4 gap-1">
                           {[10000, 20000, 50000, 100000].map(monto => (
                             <button 
                               key={monto}
                               onClick={() => setForm({...form, pago_cliente: monto})}
                               className="h-7 bg-zinc-900/40 border border-white/5 rounded-lg font-black text-white hover:bg-[#FFC107]/10 hover:border-[#FFC107]/30 transition-all text-[9px]"
                             >
                               ${monto/1000}k
                             </button>
                           ))}
                        </div>
                     </div>

                     {/* Calculadora */}
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                           <label className="text-zinc-600 text-[9px] font-black uppercase tracking-widest ml-1">Recibido</label>
                           <input 
                             type="number" 
                             value={form.pago_cliente}
                             onFocus={(e) => e.target.select()}
                             onChange={e => {
                                const val = e.target.value;
                                setForm({...form, pago_cliente: val === '' ? '' : Number(val)});
                             }}
                             className="w-full h-8 bg-zinc-900/60 border border-white/5 rounded-lg px-3 text-sm font-black text-white focus:outline-none"
                           />
                        </div>

                        <div className="space-y-1">
                           <label className="text-zinc-600 text-[9px] font-black uppercase tracking-widest ml-1">Cambio</label>
                           <div className="w-full h-8 bg-zinc-900/60 border border-white/5 rounded-lg px-3 flex items-center overflow-hidden">
                              <span className="text-sm font-black text-[#FFC107] truncate">
                                {formatCOP(cambioCalculado)}
                              </span>
                           </div>
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 bg-[#FFC107]/[0.02] border border-[#FFC107]/5 rounded-2xl animate-in fade-in zoom-in-95 duration-500">
                     <div className="w-10 h-10 bg-[#FFC107]/10 rounded-full flex items-center justify-center mb-2">
                        <svg className="w-5 h-5 text-[#FFC107]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                     </div>
                     <span className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em]">Transferir:</span>
                     <span className="text-3xl font-black italic text-[#FFC107] tracking-tighter">
                       {formatCOP(totalPedidoCalculado)}
                     </span>
                  </div>
                )}
             </div>
           )}
        </div>

        {/* FOOTER ACCIÓN (STICKY BOTTOM) */}
        <div className="absolute bottom-6 left-8 right-8">
           <button 
             disabled={
               (step === 1 && (!form.nombre || !form.telefono || (form.tipo === 'LLEVAR' && !form.direccion))) ||
               (step === 2 && form.productos.length === 0) ||
               guardarDomicilioMutation.isPending
             }
             onClick={() => {
               if (step < 3) setStep(step + 1);
               else guardarDomicilioMutation.mutate(form);
             }}
             className="w-full h-11 bg-[#FFC107] text-black font-black uppercase text-[12px] tracking-[0.2em] rounded-xl flex items-center justify-center gap-3 shadow-2xl shadow-[#FFC107]/10 transition-all hover:bg-[#FFD54F] active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed group"
           >
             {step < 3 ? (
               <>
                 CONTINUAR AL {step === 1 ? 'MENÚ' : 'COBRO'}
                 <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                 </svg>
               </>
             ) : (
               <>
                 {guardarDomicilioMutation.isPending ? 'PROCESANDO...' : (
                   form.metodo_pago === 'TRANSFERENCIA' ? 'CONFIRMAR TRANSFERENCIA Y FACTURAR' : 'CONFIRMAR Y FACTURAR'
                 )}
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
               </>
             )}
           </button>
        </div>
      </section>

      {showFactura && pedidoFacturar && (
        <FacturaModal 
          open={showFactura}
          pedido={pedidoFacturar} 
          onClose={() => {
            setShowFactura(false);
            setPedidoFacturar(null);
          }} 
        />
      )}

      {/* ── DIÁLOGO DE CONFIRMACIÓN PREMIUM ── */}
      <ConfirmDialog
        open={showConfirmCancel}
        onClose={() => {
          setShowConfirmCancel(false);
          setIdParaCancelar(null);
        }}
        onConfirm={() => {
          if (idParaCancelar) {
            cancelarDomicilioMutation.mutate(idParaCancelar);
            setShowConfirmCancel(false);
            setIdParaCancelar(null);
          }
        }}
        title="Cancelar Domicilio"
        description="¿Estás seguro de cancelar este pedido? Se registrará como anulado en el historial."
        confirmText="SÍ, CANCELAR PEDIDO"
        variant="danger"
        isLoading={cancelarDomicilioMutation.isPending}
      />

      {/* ── COMANDA OCULTA PARA CAPTURA ── */}
      {pedidoImprimiendo && (
        <div 
          ref={comandaRef}
          style={{ 
            position: 'absolute', 
            left: '-9999px', 
            top: '0', 
            background: 'white',
            visibility: 'visible'
          }}
        >
          <ComandaCocinaPDF pedido={pedidoImprimiendo} />
        </div>
      )}
    </div>
  );
}
