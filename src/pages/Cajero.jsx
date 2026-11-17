// src/pages/Cajero.jsx — Diseño Refinado según Referencia Visual
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useRealtimePedidos } from '../hooks/useRealtimePedidos';
import ColaPedidos from '../components/cajero/ColaPedidos';
import PanelDetalleCajero from '../components/cajero/PanelDetalleCajero';
import TabDomicilios from '../components/cajero/TabDomicilios';
import HistorialPedidos from '../components/cajero/HistorialPedidos';
import SidebarCajero from '../components/cajero/SidebarCajero';
import { useMesas } from '../hooks/useMesas';
import { useCaja } from '../hooks/useCaja';
import ModalApertura from '../components/cajero/ModalApertura';

export default function Cajero() {
  const [tab, setTab] = useState('mesas');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: mesas = [], isLoading: isLoadingMesas } = useMesas();
  const { caja, isLoading: cargandoCaja, isSinAbrir, isCerrada, refetch: recargarCaja } = useCaja();

  // Pedidos pendientes para la campana de notificaciones
  useRealtimePedidos();
  const { data: pedidosPendientes = [] } = useQuery({
    queryKey: ['pedidos', 'PENDIENTE_NOTIF'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pedidos')
        .select('id')
        .in('estado', ['PENDIENTE', 'EN_PROCESO']);
      return data || [];
    },
    refetchInterval: 15000,
  });
  const totalPendientes = pedidosPendientes.length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (cargandoCaja) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#FFC107] font-black uppercase tracking-[0.3em] text-xs animate-pulse">Verificando estado de caja...</div>;

  return (
    <div className="h-screen bg-[#050505] flex flex-col overflow-hidden text-zinc-300 antialiased font-sans relative">

      {/* ── MODAL APERTURA (Bloqueante) ── */}
      {isSinAbrir && <ModalApertura onAperturaExitosa={recargarCaja} />}

      {/* ── PANTALLA CAJA CERRADA ── */}
      {isCerrada && (
        <div className="absolute inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-center">
          <div className="max-w-sm space-y-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto border border-red-500/20">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div>
              <h2 className="text-white font-black text-3xl tracking-tighter uppercase italic">Caja Cerrada</h2>
              <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">El turno de hoy ha finalizado</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 grid grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Base Apertura</p>
                <p className="text-white font-black text-xl italic">${(caja?.monto_apertura || 0).toLocaleString('es-CO')}</p>
              </div>
              <div className="border-l border-white/5 pl-4">
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Ventas Efectivo</p>
                <p className="text-[#FFC107] font-black text-xl italic">${(caja?.ventas_efectivo || 0).toLocaleString('es-CO')}</p>
              </div>
            </div>
            <p className="text-zinc-600 text-[10px] font-medium leading-relaxed uppercase">No se permiten cobros hasta el próximo turno</p>
            <button onClick={handleSignOut} className="w-full h-12 bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white/10 transition-all">
              Salir del Sistema
            </button>
          </div>
        </div>
      )}

      {/* ── NAVBAR REDISEÑADO (Full Width Top) ── */}
      <header className="h-16 bg-[#0A0A0A] border-b border-white/[0.05] px-6 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-12">
          {/* Branding Izquierdo */}
          <div className="flex flex-col gap-1">
            <h1 className="font-black tracking-tighter uppercase italic leading-none">
              <span className="text-white text-2xl md:text-3xl">Buen</span><span className="text-[#FFC107] text-base md:text-lg"> Provecho</span>
            </h1>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-90 leading-none mt-0.5" style={{color: '#FF5722'}}>Sesión de Cajero</p>
          </div>
        </div>

        {/* Icons + Profile (Derecha) */}
        <div className="flex items-center gap-6">
          <div className="relative cursor-pointer hover:bg-white/5 p-2 rounded-full transition-colors" onClick={() => setTab('mesas')}>
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {totalPendientes > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-600 border-2 border-[#0A0A0A] rounded-full text-[9px] font-black text-white flex items-center justify-center px-1 shadow-lg animate-pulse">
                {totalPendientes > 99 ? '99+' : totalPendientes}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 pl-6 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <p className="text-white font-bold text-xs leading-none">{user?.nombre || 'Admin'}</p>
              <p className="text-[#FFC107] text-[10px] font-black uppercase tracking-widest mt-1 opacity-70 italic">En Línea</p>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-[#FFC107] to-[#FF5722] rounded-full flex items-center justify-center text-black font-black text-xs border-2 border-[#0A0A0A] shadow-lg">
              {user?.nombre?.charAt(0) || 'A'}
            </div>
            <button
              onClick={handleSignOut}
              className="ml-2 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-all"
              title="Salir"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── SECCIÓN CENTRAL (Sidebar + Contenido) ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Lateral */}
        <SidebarCajero activeTab={tab} onTabChange={setTab} />

        {/* Contenido Dinámico */}
        <div className="flex-1 overflow-hidden bg-black flex flex-col">
          {tab === 'mesas' && (
            <div className="flex h-full">
              {/* Pedidos Activos (Lista) */}
              <aside className="w-[410px] shrink-0 border-r border-white/[0.05] bg-[#050505] flex flex-col">
                <div className="px-6 py-5 flex items-center justify-between">
                  <h2 className="text-white font-black text-xl tracking-tight">Pedidos Activos</h2>
                  <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg min-w-[70px] flex items-center justify-center">
                    {isLoadingMesas ? (
                      <div className="w-8 h-2 bg-white/10 animate-pulse rounded" />
                    ) : (
                      <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{mesas.length} Mesas</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                  <ColaPedidos
                    seleccionado={pedidoSeleccionado?.id}
                    onSelect={setPedidoSeleccionado}
                  />
                </div>
              </aside>

              {/* Detalle del Pedido */}
              <main className="flex-1 bg-black overflow-hidden">
                <PanelDetalleCajero
                  pedido={pedidoSeleccionado}
                  onCobrado={() => setPedidoSeleccionado(null)}
                />
              </main>
            </div>
          )}

          {tab === 'domicilios' && (
            <TabDomicilios cajeroId={user?.id} />
          )}

          {tab === 'historial' && (
            <HistorialPedidos cajeroId={user?.id} />
          )}
        </div>
      </div>

    </div>
  );
}
