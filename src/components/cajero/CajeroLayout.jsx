// src/components/cajero/CajeroLayout.jsx
// Pantalla del cajero: cola de pedidos + domicilios + historial
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useRealtimePedidos } from '../../hooks/useRealtimePedidos';
import { useToast } from '../ui/Toast';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCOP } from '../../lib/utils';
import ModalCobro from './ModalCobro';
import ModalDomicilio from './ModalDomicilio';
import ModalApertura from './ModalApertura';
import { useCaja } from '../../hooks/useCaja';

const TABS = ['Pedidos de Mesa', 'Domicilios', 'Historial'];

async function fetchPedidos(canal = 'MESA', estados = ['PENDIENTE', 'EN_PROCESO']) {
  let query = supabase
    .from('pedidos')
    .select('*, mesero:usuarios!pedidos_mesero_id_fkey(nombre), cajero:usuarios!pedidos_cajero_id_fkey(nombre), detalle_pedido(*, productos(nombre))')
    .eq('canal', canal)
    .in('estado', estados)
    .order('creado_en', { ascending: true });
  const { data } = await query;
  return data || [];
}

async function fetchHistorial() {
  const hoy = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('pedidos')
    .select('*, mesero:usuarios!pedidos_mesero_id_fkey(nombre), cajero:usuarios!pedidos_cajero_id_fkey(nombre), detalle_pedido(*, productos(nombre))')
    .gte('creado_en', hoy)
    .in('estado', ['PAGADO', 'ENTREGADO', 'CANCELADO'])
    .order('creado_en', { ascending: false });
  return data || [];
}

export default function CajeroLayout() {
  useRealtimePedidos(); // ← activa el tiempo real
  const toast = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [modalDomicilio, setModalDomicilio] = useState(false);
  const { caja, isLoading: cargandoCaja, isSinAbrir, isCerrada, refetch: recargarCaja } = useCaja();

  const { data: mesaPedidos = [] } = useQuery({
    queryKey: ['pedidos', 'MESA'],
    queryFn: () => fetchPedidos('MESA', ['PENDIENTE', 'EN_PROCESO']),
    refetchInterval: 15000,
  });

  const { data: domicilios = [] } = useQuery({
    queryKey: ['pedidos', 'DOMICILIO'],
    queryFn: () => fetchPedidos('DOMICILIO', ['PENDIENTE', 'EN_PROCESO']),
    refetchInterval: 15000,
  });

  const { data: historial = [] } = useQuery({
    queryKey: ['pedidos', 'historial'],
    queryFn: fetchHistorial,
    enabled: tab === 2,
  });

  const cambiarEstado = useMutation({
    mutationFn: async ({ id, estado }) => {
      const { error } = await supabase.from('pedidos').update({ estado }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast('Estado actualizado', 'success');
    },
    onError: () => toast('Error al actualizar el estado', 'error'),
  });

  const pedidosActivos = tab === 0 ? mesaPedidos : tab === 1 ? domicilios : historial;

  function BadgeEstado({ estado }) {
    return <Badge estado={estado}>{estado.replace('_', ' ')}</Badge>;
  }

  if (cargandoCaja) return <div className="min-h-screen bg-bg-primary flex items-center justify-center text-white italic font-black uppercase tracking-widest animate-pulse">Cargando estado de caja...</div>;

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col relative">
      {/* Overlay de Apertura */}
      {isSinAbrir && <ModalApertura onAperturaExitosa={recargarCaja} />}

      {/* Pantalla de Cierre Final (Solo si ya se cerró hoy) */}
      {isCerrada && (
        <div className="absolute inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto border border-red-500/20">
               <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-white font-black text-3xl tracking-tighter uppercase italic">Caja Cerrada</h2>
              <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">El turno de hoy ha finalizado correctamente</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 grid grid-cols-2 gap-4">
               <div className="text-left">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Base Apertura</p>
                  <p className="text-white font-black text-xl italic">{formatCOP(caja?.monto_apertura || 0)}</p>
               </div>
               <div className="text-left border-l border-white/5 pl-4">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Ventas Efectivo</p>
                  <p className="text-[#FFC107] font-black text-xl italic">{formatCOP(caja?.ventas_efectivo || 0)}</p>
               </div>
            </div>
            <p className="text-zinc-600 text-[10px] font-medium uppercase tracking-tight leading-relaxed">
              No se permiten realizar más cobros u órdenes hasta el próximo día de operación según las políticas de seguridad.
            </p>
            <Button variant="ghost" onClick={() => window.location.href = '/'} className="w-full h-12 text-[10px] font-black tracking-widest uppercase">
              Volver al Inicio
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-bg-surface border-b border-bg-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="font-black text-base md:text-lg tracking-tighter uppercase italic leading-none">
              <span className="text-white text-lg md:text-2xl">Buen</span> <span className="text-[#FFC107]">Provecho</span>
            </h1>
            <span className="text-[#FF5722] text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mt-0.5">POS CAJERO</span>
          </div>
          <p className="text-zinc-600 text-[10px] font-bold hidden sm:block">{mesaPedidos.length + domicilios.length} pedido(s) activo(s)</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setModalDomicilio(true)}>
          + Nuevo Domicilio
        </Button>
      </header>

      {/* Tabs */}
      <div className="flex bg-bg-surface border-b border-bg-border">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-1 py-3.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
              tab === i
                ? 'text-brand-yellow border-brand-yellow'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            {t}
            {i === 0 && mesaPedidos.length > 0 && (
              <span className="ml-1.5 bg-brand-orange text-white rounded-full px-1.5 py-0.5 text-[9px]">
                {mesaPedidos.length}
              </span>
            )}
            {i === 1 && domicilios.length > 0 && (
              <span className="ml-1.5 bg-brand-orange text-white rounded-full px-1.5 py-0.5 text-[9px]">
                {domicilios.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista de pedidos */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {pedidosActivos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <span className="text-4xl opacity-30">{tab === 0 ? '🪑' : tab === 1 ? '🛵' : '📋'}</span>
            <p className="text-zinc-600 font-bold">
              {tab === 2 ? 'Sin registros hoy' : 'Sin pedidos activos'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pedidosActivos.map((p) => {
              const hace = Math.round((Date.now() - new Date(p.creado_en).getTime()) / 60000);
              return (
                <div
                  key={p.id}
                  className={`bg-bg-surface border rounded-2xl p-5 cursor-pointer hover:shadow-glow transition-all ${
                    p.estado === 'PENDIENTE' ? 'border-brand-orange/50' : 'border-bg-border'
                  }`}
                  onClick={() => setPedidoSeleccionado(p)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <BadgeEstado estado={p.estado} />
                        <span className="text-zinc-500 text-[10px]">· {hace}min</span>
                      </div>
                      <p className="text-white font-black text-sm">
                        {p.canal === 'MESA' ? `🪑 Mesa ${p.mesas?.numero || ''}` : `🛵 ${p.tipo_domicilio || 'Domicilio'}`}
                      </p>
                    </div>
                    <p className="text-brand-yellow font-black text-base">{formatCOP(p.total)}</p>
                  </div>
                  {p.nombre_cliente && (
                    <p className="text-zinc-400 text-xs font-medium mb-2">👤 {p.nombre_cliente}</p>
                  )}
                  <div className="space-y-1">
                    {(p.detalle_pedido || []).map((d, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-zinc-300">{d.productos?.nombre} × {d.cantidad}</span>
                        <span className="text-zinc-500">{formatCOP(d.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  {/* Acciones rápidas */}
                  {tab !== 2 && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-bg-border" onClick={(e) => e.stopPropagation()}>
                      {p.estado === 'PENDIENTE' && (
                        <Button variant="dark" size="sm" className="flex-1" onClick={() => cambiarEstado.mutate({ id: p.id, estado: 'EN_PROCESO' })}>
                          En Proceso
                        </Button>
                      )}
                      <Button size="sm" className="flex-1" onClick={() => setPedidoSeleccionado(p)}>
                        Cobrar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal de cobro */}
      {pedidoSeleccionado && (
        <ModalCobro
          pedido={pedidoSeleccionado}
          onClose={() => setPedidoSeleccionado(null)}
        />
      )}

      {/* Modal de nuevo domicilio */}
      {modalDomicilio && (
        <ModalDomicilio onClose={() => setModalDomicilio(false)} />
      )}
    </div>
  );
}
