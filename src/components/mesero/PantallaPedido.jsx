// src/components/mesero/PantallaPedido.jsx
// Pantalla principal del mesero: selección de canal, mesa, menú y envío de comanda
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../hooks/useStore';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCOP, generarCodigo } from '../../lib/utils';

export default function PantallaPedido() {
  const { user, borradorPedido, setBorradorCampo, agregarItem, quitarItem, actualizarNotas, limpiarBorrador } = useAppStore();
  const toast = useToast();
  const [mesas, setMesas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [catActiva, setCatActiva] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [showResumen, setShowResumen] = useState(false);
  const [mesa, setMesa] = useState([]);

  const total = borradorPedido.items.reduce((s, i) => s + i.precio * i.cantidad, 0);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const [{ data: m }, { data: c }, { data: p }, { data: mesasOcupadas }] = await Promise.all([
      supabase.from('mesas').select('*').eq('activa', true).order('numero'),
      supabase.from('categorias').select('*').eq('activa', true).order('orden'),
      supabase.from('productos').select('*').eq('activo', true).order('nombre'),
      supabase.from('pedidos').select('mesa_id').in('estado', ['PENDIENTE', 'EN_PROCESO']),
    ]);
    const ocupadasIds = (mesasOcupadas || []).map((p) => p.mesa_id);
    setMesas((m || []).map((mesa) => ({ ...mesa, ocupada: ocupadasIds.includes(mesa.id) })));
    setCategorias(c || []);
    setProductos(p || []);
    if (c?.length) setCatActiva(c[0].id);
  }

  async function enviarComanda() {
    if (!borradorPedido.nombreCliente.trim()) {
      toast('El nombre del cliente es obligatorio', 'error');
      return;
    }
    if (!borradorPedido.canal) {
      toast('Selecciona MESA o DOMICILIO', 'error');
      return;
    }
    if (borradorPedido.canal === 'MESA' && !borradorPedido.mesaId) {
      toast('Selecciona una mesa', 'error');
      return;
    }
    if (!borradorPedido.items.length) {
      toast('Agrega al menos un producto', 'error');
      return;
    }
    setEnviando(true);
    try {
      const codigo = generarCodigo(borradorPedido.canal);
      const totalPedido = borradorPedido.items.reduce((s, i) => s + i.precio * i.cantidad, 0);

      const { data: pedido, error } = await supabase.from('pedidos').insert({
        codigo,
        canal: borradorPedido.canal,
        estado: 'PENDIENTE',
        metodo_pago: 'PENDIENTE',
        total: totalPedido,
        mesa_id: borradorPedido.canal === 'MESA' ? borradorPedido.mesaId : null,
        nombre_cliente: borradorPedido.nombreCliente,
        mesero_id: user?.id,
        notas: borradorPedido.notas, // ✅ Nota General
      }).select().single();

      if (error) throw error;

      const detalles = borradorPedido.items.map((i) => ({
        pedido_id: pedido.id,
        producto_id: i.productoId,
        cantidad: i.cantidad,
        precio_unitario: i.precio,
        subtotal: i.precio * i.cantidad,
        notas: i.notas || null,
      }));

      await supabase.from('detalle_pedido').insert(detalles);

      // ✅ Marcar la mesa como OCUPADA
      if (borradorPedido.canal === 'MESA' && borradorPedido.mesaId) {
        await supabase
          .from('mesas')
          .update({ estado: 'OCUPADA' })
          .eq('id', borradorPedido.mesaId);
      }

      toast(`¡Comanda enviada! ${borradorPedido.canal === 'MESA' ? `Mesa ${mesas.find(m => m.id === borradorPedido.mesaId)?.numero}` : 'Domicilio'} - ${borradorPedido.nombreCliente}`, 'success');
      limpiarBorrador();
      setShowResumen(false);
    } catch (err) {
      toast('Error al enviar la comanda. Intenta de nuevo.', 'error');
    } finally {
      setEnviando(false);
    }
  }

  const productosFiltrados = catActiva
    ? productos.filter((p) => p.categoria_id === catActiva)
    : productos;

  // Paso 1: Selección de canal
  if (!borradorPedido.canal) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-center">
          <p className="text-zinc-500 text-sm font-medium mb-2">Bienvenido, {user?.nombre}</p>
          <h1 className="text-2xl font-black text-white">Nueva Comanda</h1>
          <p className="text-zinc-500 text-sm mt-1">¿Cómo es el pedido?</p>
        </div>
        <div className="flex gap-4 w-full max-w-sm">
          <Button
            size="xl"
            className="flex-1 flex-col h-32 gap-2 text-3xl"
            onClick={() => setBorradorCampo('canal', 'MESA')}
          >
            <span>🪑</span>
            <span className="text-sm font-black">Mesa</span>
          </Button>
          <Button
            variant="secondary"
            size="xl"
            className="flex-1 flex-col h-32 gap-2 text-3xl"
            onClick={() => setBorradorCampo('canal', 'DOMICILIO')}
          >
            <span>🛵</span>
            <span className="text-sm font-black">Domicilio</span>
          </Button>
        </div>
      </div>
    );
  }

  // Paso 2: Menú + Resumen
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="bg-bg-surface border-b border-bg-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => limpiarBorrador()}
          className="text-zinc-500 text-sm hover:text-white flex items-center gap-1"
        >
          ← Cancelar
        </button>
        <div className="text-center">
          <p className="text-white font-black text-sm">
            {borradorPedido.canal === 'MESA' ? '🪑 Mesa' : '🛵 Domicilio'}
          </p>
          {borradorPedido.mesaId && (
            <p className="text-brand-yellow text-xs font-bold">
              Mesa {mesas.find((m) => m.id === borradorPedido.mesaId)?.numero}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowResumen(true)}
          className="bg-brand-yellow text-black rounded-xl px-4 py-2 text-xs font-black relative"
        >
          {borradorPedido.items.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-bg-primary text-brand-yellow rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black border border-brand-yellow">
              {borradorPedido.items.reduce((s, i) => s + i.cantidad, 0)}
            </span>
          )}
          Ver Pedido
        </button>
      </header>

      {/* Nombre del cliente y mesa */}
      <div className="px-4 py-3 bg-bg-elevated border-b border-bg-border space-y-3">
        <Input
          placeholder="★ Nombre del cliente (obligatorio)"
          value={borradorPedido.nombreCliente}
          onChange={(e) => setBorradorCampo('nombreCliente', e.target.value)}
          className="text-base"
        />
        {borradorPedido.canal === 'MESA' && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {mesas.map((m) => (
              <button
                key={m.id}
                onClick={() => !m.ocupada && setBorradorCampo('mesaId', m.id)}
                disabled={m.ocupada}
                className={`flex-shrink-0 w-12 h-12 rounded-xl text-xs font-black transition-all ${
                  borradorPedido.mesaId === m.id
                    ? 'bg-brand-yellow text-black'
                    : m.ocupada
                    ? 'bg-bg-elevated text-zinc-600 cursor-not-allowed line-through'
                    : 'bg-bg-elevated border border-bg-border text-white hover:border-brand-yellow/50'
                }`}
              >
                {m.numero}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs de categorías */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-bg-border bg-bg-surface">
        {categorias.map((c) => (
          <button
            key={c.id}
            onClick={() => setCatActiva(c.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              catActiva === c.id
                ? 'bg-brand-yellow text-black'
                : 'bg-bg-elevated text-zinc-400 hover:text-white'
            }`}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {/* Grid de productos */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {productosFiltrados.map((p) => {
          const enCarrito = borradorPedido.items.find((i) => i.productoId === p.id);
          return (
            <div
              key={p.id}
              className={`bg-bg-surface border rounded-2xl p-4 flex flex-col gap-2 transition-all ${
                enCarrito ? 'border-brand-yellow/50 shadow-glow' : 'border-bg-border hover:border-zinc-600'
              }`}
            >
              <p className="text-white font-bold text-sm leading-tight">{p.nombre}</p>
              {p.descripcion && <p className="text-zinc-500 text-xs line-clamp-2">{p.descripcion}</p>}
              <p className="text-brand-yellow font-black text-base mt-auto">{formatCOP(p.precio_venta)}</p>
              <div className="flex items-center gap-2 mt-1">
                {enCarrito ? (
                  <>
                    <button
                      onClick={() => quitarItem(p.id)}
                      className="w-8 h-8 bg-bg-elevated border border-bg-border rounded-lg text-white font-black text-base hover:border-brand-yellow/50 active:scale-95 transition-all"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-white font-black">{enCarrito.cantidad}</span>
                    <button
                      onClick={() => agregarItem(p)}
                      className="w-8 h-8 bg-brand-yellow text-black rounded-lg font-black text-base hover:bg-brand-hover active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => agregarItem(p)}
                    className="w-full py-1.5 bg-brand-yellow text-black rounded-lg text-xs font-black hover:bg-brand-hover active:scale-95 transition-all"
                  >
                    + Añadir
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom sheet resumen */}
      {showResumen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-bg-surface border-t border-bg-border w-full max-h-[85vh] flex flex-col rounded-t-3xl">
            <div className="flex items-center justify-between p-5 border-b border-bg-border">
              <h2 className="text-white font-black text-lg">Resumen del Pedido</h2>
              <button onClick={() => setShowResumen(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Nota General */}
              <div className="bg-bg-elevated rounded-xl p-4 border border-[#FFC107]/10">
                <p className="text-[#FFC107] text-[10px] font-black uppercase tracking-widest mb-2">Nota General del Pedido</p>
                <textarea
                   className="w-full h-20 bg-black/20 border border-white/5 rounded-lg p-3 text-xs text-white placeholder:text-zinc-800 focus:outline-none focus:border-[#FFC107]/20 transition-all resize-none font-medium italic"
                   placeholder="Escribe instrucciones para todo el pedido aquí..."
                   value={borradorPedido.notas}
                   onChange={(e) => setBorradorCampo('notas', e.target.value)}
                />
              </div>

              {borradorPedido.items.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">No hay productos en el pedido</p>
              ) : (
                borradorPedido.items.map((item) => (
                  <div key={item.productoId} className="bg-bg-elevated rounded-xl p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm">{item.nombre}</p>
                        <input
                          className="mt-1.5 w-full bg-black/20 border border-white/5 rounded px-2 py-1 text-[10px] text-[#FFC107] placeholder:text-zinc-800 focus:outline-none focus:border-[#FFC107]/20 transition-all font-medium italic"
                          placeholder="Instrucciones especiales..."
                          value={item.notas}
                          onChange={(e) => actualizarNotas(item.productoId, e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <button onClick={() => quitarItem(item.productoId)} className="w-7 h-7 bg-bg-border rounded-lg text-white font-black text-sm active:scale-95">-</button>
                        <span className="text-white font-black w-4 text-center">{item.cantidad}</span>
                        <button onClick={() => agregarItem({ id: item.productoId, nombre: item.nombre, precio_venta: item.precio })} className="w-7 h-7 bg-brand-yellow text-black rounded-lg font-black text-sm active:scale-95">+</button>
                      </div>
                    </div>
                    <p className="text-brand-yellow text-xs font-bold mt-1">{formatCOP(item.precio * item.cantidad)}</p>
                  </div>
                ))
              )}
            </div>
            <div className="p-5 border-t border-bg-border space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 font-bold">Total</span>
                <span className="text-brand-yellow font-black text-xl">{formatCOP(total)}</span>
              </div>
              <Button size="lg" className="w-full" onClick={enviarComanda} disabled={enviando}>
                {enviando ? 'Enviando...' : '✓ Enviar Comanda a Caja'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
