// src/components/cajero/ModalDomicilio.jsx
// Flujo de 3 pasos para registrar un domicilio desde caja
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCOP, generarCodigo } from '../../lib/utils';

const BILLETES = [10000, 20000, 50000, 100000];

export default function ModalDomicilio({ onClose }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [paso, setPaso] = useState(1);
  const [cliente, setCliente] = useState({ nombre: '', telefono: '', tipo: 'RECOGER', direccion: '' });
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [catActiva, setCatActiva] = useState(null);
  const [items, setItems] = useState([]);
  const [cargado, setCargado] = useState(false);
  const [costoDom, setCostoDom] = useState(0);
  const [metodo, setMetodo] = useState('EFECTIVO');
  const [pagado, setPagado] = useState(0);
  const [enviando, setEnviando] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const total = subtotal + Number(costoDom);
  const cambio = Math.max(0, pagado - total);

  async function cargarMenu() {
    if (cargado) return;
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('categorias').select('*').eq('activa', true).order('orden'),
      supabase.from('productos').select('*').eq('activo', true).order('nombre'),
    ]);
    setCategorias(c || []);
    setProductos(p || []);
    if (c?.length) setCatActiva(c[0].id);
    setCargado(true);
  }

  function agregar(prod) {
    setItems((prev) => {
      const ex = prev.find((i) => i.productoId === prod.id);
      return ex
        ? prev.map((i) => i.productoId === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i)
        : [...prev, { productoId: prod.id, nombre: prod.nombre, precio: prod.precio_venta, cantidad: 1, notas: '' }];
    });
  }

  function quitar(productoId) {
    setItems((prev) =>
      prev.map((i) => i.productoId === productoId ? { ...i, cantidad: i.cantidad - 1 } : i).filter((i) => i.cantidad > 0)
    );
  }

  async function confirmar() {
    setEnviando(true);
    try {
      const codigo = generarCodigo('DOMICILIO');
      const { data: pedido, error } = await supabase.from('pedidos').insert({
        codigo,
        canal: 'DOMICILIO',
        estado: 'PAGADO',
        metodo_pago: metodo,
        total,
        costo_domicilio: Number(costoDom),
        tipo_domicilio: cliente.tipo,
        nombre_cliente_dom: cliente.nombre,
        telefono_cliente: cliente.telefono,
        direccion_cliente: cliente.tipo === 'LLEVAR' ? cliente.direccion : null,
        pago_cliente: metodo === 'EFECTIVO' ? pagado : total,
        cambio: metodo === 'EFECTIVO' ? cambio : 0,
      }).select().single();
      if (error) throw error;
      await supabase.from('detalle_pedido').insert(
        items.map((i) => ({
          pedido_id: pedido.id,
          producto_id: i.productoId,
          cantidad: i.cantidad,
          precio_unitario: i.precio,
          subtotal: i.precio * i.cantidad,
          notas: i.notas || null,
        }))
      );
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast('¡Domicilio registrado y cobrado!', 'success');
      onClose();
    } catch {
      toast('Error al registrar el domicilio', 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-surface border border-bg-border rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-bg-border">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-black">Nuevo Domicilio</h2>
            <div className="flex gap-1">
              {[1,2,3].map((n) => (
                <div key={n} className={`w-2 h-2 rounded-full ${paso >= n ? 'bg-brand-yellow' : 'bg-bg-border'}`} />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* PASO 1: Datos del cliente */}
          {paso === 1 && (
            <div className="space-y-4 max-w-sm mx-auto">
              <h3 className="text-white font-black mb-4">Datos del Cliente</h3>
              <Input label="Nombre del cliente *" placeholder="Juan Pérez" value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
              <Input label="Teléfono *" placeholder="300-123-4567" value={cliente.telefono} onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })} />
              <div>
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3">Tipo de entrega</p>
                <div className="flex gap-3">
                  {['RECOGER', 'LLEVAR'].map((t) => (
                    <button key={t} onClick={() => setCliente({ ...cliente, tipo: t })}
                      className={`flex-1 py-3 rounded-xl text-sm font-black border transition-all ${cliente.tipo === t ? 'bg-brand-yellow text-black border-brand-yellow' : 'bg-bg-elevated border-bg-border text-zinc-400'}`}>
                      {t === 'RECOGER' ? '🏪 Recoger' : '🛵 Llevar'}
                    </button>
                  ))}
                </div>
              </div>
              {cliente.tipo === 'LLEVAR' && (
                <Input label="Dirección *" placeholder="Calle 45 #12-34, Barrio..." value={cliente.direccion} onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })} />
              )}
              <Button className="w-full mt-4" size="lg"
                onClick={() => { if (!cliente.nombre || !cliente.telefono || (cliente.tipo === 'LLEVAR' && !cliente.direccion)) { toast('Completa todos los campos obligatorios', 'error'); return; } cargarMenu(); setPaso(2); }}>
                Continuar →
              </Button>
            </div>
          )}

          {/* PASO 2: Productos */}
          {paso === 2 && (
            <div>
              <h3 className="text-white font-black mb-4">Productos — {cliente.nombre}</h3>
              <div className="flex gap-2 overflow-x-auto mb-4">
                {categorias.map((c) => (
                  <button key={c.id} onClick={() => setCatActiva(c.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all ${catActiva === c.id ? 'bg-brand-yellow text-black' : 'bg-bg-elevated text-zinc-400'}`}>
                    {c.nombre}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {productos.filter((p) => p.categoria_id === catActiva).map((p) => {
                  const en = items.find((i) => i.productoId === p.id);
                  return (
                    <div key={p.id} className={`bg-bg-elevated border rounded-xl p-3 ${en ? 'border-brand-yellow/50' : 'border-bg-border'}`}>
                      <p className="text-white font-bold text-sm">{p.nombre}</p>
                      <p className="text-brand-yellow font-black text-sm mt-1">{formatCOP(p.precio_venta)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {en ? (
                          <>
                            <button onClick={() => quitar(p.id)} className="w-7 h-7 bg-bg-border rounded-lg text-white font-black">-</button>
                            <span className="flex-1 text-center text-white font-black">{en.cantidad}</span>
                            <button onClick={() => agregar(p)} className="w-7 h-7 bg-brand-yellow text-black rounded-lg font-black">+</button>
                          </>
                        ) : (
                          <button onClick={() => agregar(p)} className="w-full py-1.5 bg-brand-yellow text-black rounded-lg text-xs font-black">+ Añadir</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-bg-elevated rounded-xl p-4 space-y-2">
                {items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-zinc-300">{i.nombre} × {i.cantidad}</span>
                    <span className="text-zinc-400">{formatCOP(i.precio * i.cantidad)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-black pt-2 border-t border-bg-border">
                  <span className="text-white">Total productos</span>
                  <span className="text-brand-yellow">{formatCOP(subtotal)}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setPaso(1)}>← Atrás</Button>
                <Button className="flex-1" onClick={() => { if (!items.length) { toast('Agrega al menos un producto', 'error'); return; } setPaso(3); }}>Cobrar →</Button>
              </div>
            </div>
          )}

          {/* PASO 3: Cobro */}
          {paso === 3 && (
            <div className="max-w-sm mx-auto space-y-4">
              <h3 className="text-white font-black">Cobro — {cliente.nombre} · {cliente.tipo}</h3>
              <div className="bg-bg-elevated rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Subtotal</span><span className="text-white">{formatCOP(subtotal)}</span></div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Costo domicilio</span>
                  <input type="number" value={costoDom || ''} onChange={(e) => setCostoDom(e.target.value)} className="w-24 bg-bg-primary border border-bg-border rounded-lg px-2 py-1 text-white text-right text-sm font-bold focus:outline-none focus:border-brand-yellow" />
                </div>
                <div className="flex justify-between font-black pt-2 border-t border-bg-border">
                  <span className="text-white">Total a cobrar</span>
                  <span className="text-brand-yellow text-lg">{formatCOP(total)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                {['EFECTIVO','TRANSFERENCIA'].map((m) => (
                  <button key={m} onClick={() => { setMetodo(m); setPagado(0); }}
                    className={`flex-1 py-3 rounded-xl text-xs font-black border transition-all ${metodo === m ? 'bg-brand-yellow text-black border-brand-yellow' : 'bg-bg-elevated border-bg-border text-zinc-400'}`}>
                    {m === 'EFECTIVO' ? '💵 Efectivo' : '📲 Transferencia'}
                  </button>
                ))}
              </div>
              {metodo === 'EFECTIVO' && (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {BILLETES.map((b) => (
                      <button key={b} onClick={() => setPagado(b)}
                        className={`py-2.5 rounded-xl text-xs font-black border transition-all ${pagado === b ? 'bg-brand-yellow text-black border-brand-yellow' : 'bg-bg-elevated border-bg-border text-zinc-300'}`}>
                        ${(b/1000).toFixed(0)}k
                      </button>
                    ))}
                  </div>
                  <input type="number" value={pagado || ''} onChange={(e) => setPagado(Number(e.target.value))} placeholder="Monto recibido..."
                    className="w-full bg-bg-elevated border border-bg-border text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-yellow" />
                  {pagado > 0 && (
                    <div className="flex justify-between px-4 py-3 bg-state-success/10 border border-state-success/30 rounded-xl">
                      <span className="text-zinc-400 font-bold">Cambio</span>
                      <span className="text-state-success font-black text-lg">{formatCOP(cambio)}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setPaso(2)}>← Atrás</Button>
                <Button className="flex-1" onClick={confirmar} disabled={enviando || (metodo === 'EFECTIVO' && pagado < total)}>
                  {enviando ? 'Guardando...' : '✓ Confirmar y Facturar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
