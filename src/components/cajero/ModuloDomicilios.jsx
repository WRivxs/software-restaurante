// src/components/cajero/ModuloDomicilios.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/Sheet';
import { formatCOP } from '../../lib/utils';
import MenuVisual from '../mesero/MenuVisual';
import { generarCodigo } from '../../utils/generarCodigo';

export default function ModuloDomicilios() {
  const qc = useQueryClient();
  const [paso, setPaso] = useState(1); // 1: Datos, 2: Productos, 3: Cobro
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({
    nombre_cliente: '',
    telefono: '',
    tipo: 'LLEVAR', // RECOGER, LLEVAR
    direccion: '',
    items: [],
    costo_domicilio: 5000,
    pago: 0
  });

  const subtotal = form.items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const total = subtotal + (form.tipo === 'LLEVAR' ? Number(form.costo_domicilio) : 0);

  const agregarItem = (producto) => {
    const existing = form.items.find(i => i.id === producto.id);
    if (existing) {
      setForm({
        ...form,
        items: form.items.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      });
    } else {
      setForm({
        ...form,
        items: [...form.items, { ...producto, cantidad: 1, precio: producto.precio_venta }]
      });
    }
  };

  const guardarPedido = useMutation({
    mutationFn: async () => {
      const codigo = generarCodigo('D');
      // 1. Crear el pedido
      const { data: pedido, error: pError } = await supabase.from('pedidos').insert({
        codigo,
        canal: 'DOMICILIO',
        estado: 'PAGADO',
        nombre_cliente_dom: form.nombre_cliente,
        telefono_cliente: form.telefono,
        direccion_cliente: form.tipo === 'LLEVAR' ? form.direccion : 'Recoge en local',
        tipo_domicilio: form.tipo,
        costo_domicilio: form.tipo === 'LLEVAR' ? Number(form.costo_domicilio) : 0,
        total: total,
        metodo_pago: 'EFECTIVO'
      }).select().single();

      if (pError) throw pError;

      // 2. Insertar detalles
      const detalles = form.items.map(i => ({
        pedido_id: pedido.id,
        producto_id: i.id,
        cantidad: i.cantidad,
        precio_unitario: i.precio,
        subtotal: i.precio * i.cantidad
      }));

      const { error: dError } = await supabase.from('detalle_pedido').insert(detalles);
      if (dError) throw dError;
    },
    onSuccess: () => {
      qc.invalidateQueries(['pedidos']);
      setOpen(false);
      setPaso(1);
      setForm({
        nombre_cliente: '',
        telefono: '',
        tipo: 'LLEVAR',
        direccion: '',
        items: [],
        costo_domicilio: 5000,
        pago: 0
      });
      alert('¡Domicilio registrado con éxito!');
    },
    onError: (err) => {
      alert('Error GUARDADO: ' + err.message);
    }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-white font-black text-xl uppercase tracking-tighter italic">Gestión de Domicilios</h2>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="shadow-glow-orange bg-brand-orange hover:bg-orange-600 font-black uppercase text-[10px] tracking-widest px-8">
              + Nuevo Domicilio
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-bg-primary border-white/5 w-full sm:max-w-xl p-0">
            <SheetHeader className="p-8 border-b border-white/5">
              <SheetTitle className="text-white font-black uppercase tracking-tighter">Registro de Domicilio — Paso {paso}/3</SheetTitle>
            </SheetHeader>

            <div className="p-8 h-[calc(100vh-180px)] overflow-y-auto">
              {paso === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <Input label="NOMBRE DEL CLIENTE *" value={form.nombre_cliente} onChange={e => setForm({...form, nombre_cliente: e.target.value})} />
                  <Input label="TELÉFONO *" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} />
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tipo de Entrega</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setForm({...form, tipo: 'LLEVAR'})}
                        className={`p-4 rounded-2xl border font-black uppercase text-[10px] tracking-widest transition-all ${form.tipo === 'LLEVAR' ? 'bg-brand-orange border-brand-orange text-white' : 'bg-bg-surface border-white/5 text-zinc-500'}`}
                      >
                        🛵 A Domicilio
                      </button>
                      <button 
                        onClick={() => setForm({...form, tipo: 'RECOGER'})}
                        className={`p-4 rounded-2xl border font-black uppercase text-[10px] tracking-widest transition-all ${form.tipo === 'RECOGER' ? 'bg-brand-orange border-brand-orange text-white' : 'bg-bg-surface border-white/5 text-zinc-500'}`}
                      >
                        🏪 Recoge Local
                      </button>
                    </div>
                  </div>

                  {form.tipo === 'LLEVAR' && (
                    <Input label="DIRECCIÓN DE ENTREGA *" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} />
                  )}

                  <Button 
                    className="w-full h-14 font-black uppercase tracking-widest" 
                    disabled={!form.nombre_cliente || !form.telefono || (form.tipo === 'LLEVAR' && !form.direccion)}
                    onClick={() => setPaso(2)}
                  >
                    Continuar al Menú →
                  </Button>
                </div>
              )}

              {paso === 2 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="bg-bg-surface border border-white/5 rounded-[2rem] p-6">
                    <h3 className="text-white font-black text-xs uppercase tracking-widest mb-4">Resumen del Pedido</h3>
                    <div className="space-y-3">
                      {form.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <span className="text-zinc-400 font-bold uppercase">{item.cantidad}× {item.nombre}</span>
                          <span className="text-white font-black">{formatCOP(item.precio * item.cantidad)}</span>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-white/5 flex justify-between items-center text-brand-orange font-black text-lg">
                        <span>SUBTOTAL</span>
                        <span>{formatCOP(subtotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-white font-black text-xs uppercase tracking-widest">Seleccionar Productos</h3>
                    <MenuVisual onAdd={agregarItem} />
                  </div>

                  <div className="flex gap-4 sticky bottom-0 pt-4 bg-bg-primary">
                    <Button variant="ghost" onClick={() => setPaso(1)} className="flex-1 font-black uppercase text-[10px]">Atrás</Button>
                    <Button className="flex-1 font-black uppercase text-[10px]" disabled={form.items.length === 0} onClick={() => setPaso(3)}>Confirmar Cobro →</Button>
                  </div>
                </div>
              )}

              {paso === 3 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="glass p-8 rounded-[2.5rem] space-y-6">
                    <div className="text-center">
                       <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total a Cobrar</p>
                       <h2 className="text-5xl font-black text-white tracking-tighter">{formatCOP(total)}</h2>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                        <span>Costo Productos</span>
                        <span className="text-white">{formatCOP(subtotal)}</span>
                      </div>
                      {form.tipo === 'LLEVAR' && (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Servicio Domicilio</span>
                          <input 
                            type="number" 
                            className="w-24 bg-bg-surface border border-white/5 rounded-lg px-2 py-1 text-right text-brand-orange font-black"
                            value={form.costo_domicilio}
                            onChange={e => setForm({...form, costo_domicilio: e.target.value})}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[10000, 20000, 50000, 100000].map(m => (
                      <button key={m} onClick={() => setForm({...form, pago: m})} className="bg-bg-surface border border-white/5 p-4 rounded-2xl font-black text-white hover:bg-brand-orange hover:text-black transition-all">
                        {formatCOP(m)}
                      </button>
                    ))}
                  </div>

                  <div className="bg-white/5 p-6 rounded-2xl flex justify-between items-center">
                    <div>
                       <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Cambio a Entregar</p>
                       <p className="text-2xl font-black text-state-success">{formatCOP(Math.max(0, form.pago - total))}</p>
                    </div>
                    <Button 
                      className="px-10 h-14 font-black uppercase tracking-widest shadow-glow" 
                      onClick={() => guardarPedido.mutate()}
                      disabled={guardarPedido.isPending || (form.pago < total && form.pago > 0)}
                    >
                      {guardarPedido.isPending ? 'PROCESANDO...' : 'CONFIRMAR PAGO ✅'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Aquí iría la lista de domicilios activos (vía query) */}
        <div className="opacity-30 p-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] col-span-full">
           <span className="text-4xl">📭</span>
           <p className="mt-4 font-black uppercase text-[10px] tracking-[0.3em] text-zinc-500">No hay domicilios activos en este momento</p>
        </div>
      </div>
    </div>
  );
}
