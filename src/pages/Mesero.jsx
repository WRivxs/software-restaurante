// src/pages/Mesero.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../hooks/useStore';
import { usePedidos } from '../hooks/usePedidos';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import CuadriculaMesas from '../components/mesero/CuadriculaMesas';
import MenuVisual from '../components/mesero/MenuVisual';
import ComandaActiva from '../components/mesero/ComandaActiva';
import MisPedidos from '../components/mesero/MisPedidos';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/Sheet';
import { cn, formatCOP, generarCodigo } from '../lib/utils';
import InstallPWA from '../components/InstallPWA';
import { toast } from 'sonner';

export default function Mesero() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(() => {
    const sesionGuardada = localStorage.getItem('mesero_sesion');
    return sesionGuardada ? 'APP' : 'AUTH';
  });
  const [seccion, setSeccion] = useState('NUEVO'); // NUEVO, HISTORIAL
  const [pin, setPin] = useState('');
  const [mesero, setMesero] = useState(() => {
    const sesionGuardada = localStorage.getItem('mesero_sesion');
    return sesionGuardada ? JSON.parse(sesionGuardada) : null;
  });
  const [enviando, setEnviando] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const { borradorPedido, setBorradorCampo, agregarItem, limpiarBorrador } = useAppStore();
  const { guardarPedido } = usePedidos();

  useEffect(() => {
    if (!mesero && paso !== 'AUTH') setPaso('AUTH');
  }, [mesero, paso]);

  const handleAuth = async (num) => {
    // ... (logic remains same)
    if (pin.length >= 4) return;
    const newPin = pin + num;
    setPin(newPin);
    
    if (newPin.length === 4) {
      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('pin', newPin)
        .eq('rol', 'MESERO')
        .eq('activo', true)
        .single();
      
      if (data) {
        const { error: authError } = await supabase.auth.signInAnonymously();
        if (authError) {
          setPin('');
          toast.error('Error de autenticación: ' + authError.message);
          return;
        }
        localStorage.setItem('mesero_sesion', JSON.stringify(data));
        setMesero(data);
        limpiarBorrador();
        setPaso('APP');
      } else {
        setPin('');
        toast.error('PIN Incorrecto');
      }
    }
  };

  const handleEnviarPedido = async () => {
    if (!borradorPedido.nombreCliente.trim()) {
      toast.warning('El nombre del cliente es obligatorio');
      return;
    }
    if (!borradorPedido.mesaId) {
      toast.warning('Debes seleccionar una mesa');
      return;
    }
    if (borradorPedido.items.length === 0) {
      toast.warning('La comanda está vacía');
      return;
    }

    setEnviando(true);
    try {
      const codigo = generarCodigo('MESA');
      await guardarPedido.mutateAsync({
        codigo,
        canal: 'MESA',
        estado: 'PENDIENTE',
        mesa_id: borradorPedido.mesaId,
        nombre_cliente: borradorPedido.nombreCliente.toUpperCase(),
        total: borradorPedido.items.reduce((s, i) => s + i.precio * i.cantidad, 0),
        mesero_id: mesero.id,
        notas: borradorPedido.notas,
        items: borradorPedido.items
      });
      setIsCartOpen(false);
      limpiarBorrador();
      toast.success('¡Comanda enviada a caja! ✅');
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (paso === 'AUTH') {
    return (
      <div className="h-screen bg-bg-primary flex flex-col items-center justify-center p-4 bg-glow-aurora overflow-hidden relative landscape:overflow-y-auto landscape:justify-start landscape:pt-10 custom-scrollbar">
        <div className="text-center mb-8 md:mb-10 z-10 shrink-0">
          <p className="text-brand-orange text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] mb-1.5 animate-fade-in">BUEN PROVECHO</p>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">
            ACCESO <span className="text-brand-yellow">MESERO</span>
          </h1>
          <p className="text-zinc-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] mt-1">PIN DE 4 DÍGITOS</p>
        </div>

        <div className="w-full max-w-[260px] md:max-w-[280px] space-y-6 md:space-y-8 z-10 pb-8">
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border-2 transition-all duration-300 ${
                  pin.length > i 
                    ? 'bg-brand-yellow border-brand-yellow shadow-[0_0_15px_rgba(255,200,0,0.4)] scale-110' 
                    : 'border-zinc-800 bg-transparent'
                }`} 
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2.5 md:gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '←'].map((n) => (
              <button
                key={n}
                className="h-14 md:h-16 text-lg md:text-xl font-black rounded-xl md:rounded-2xl bg-bg-surface border border-bg-border text-white hover:bg-brand-yellow hover:text-black transition-all active:scale-90 flex items-center justify-center shadow-lg"
                onClick={() => {
                  if (n === 'C') setPin('');
                  else if (n === '←') setPin(pin.slice(0, -1));
                  else handleAuth(n.toString());
                }}
              >
                {n}
              </button>
            ))}
          </div>

          <button 
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 text-zinc-600 hover:text-brand-orange font-black text-[9px] uppercase tracking-[0.2em] transition-all pt-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> VOLVER AL INICIO
          </button>
        </div>
      </div>
    );
  }

  const totalItems = borradorPedido.items.reduce((acc, item) => acc + item.cantidad, 0);
  const totalMonto = borradorPedido.items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  // Guarda global para evitar crashes si el estado de mesero no se ha propagado
  if (!mesero) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#FFC107]/20 border-t-[#FFC107] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.3em]">Iniciando Sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#050505] flex flex-col text-white overflow-hidden relative">
      <InstallPWA />
      <header className="h-16 lg:h-20 bg-black border-b border-white/10 px-4 md:px-6 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-4 md:gap-10">
          <div className="flex flex-col">
            <h1 className="font-black text-base md:text-lg tracking-tighter uppercase italic leading-none">
              <span className="text-white text-lg md:text-2xl">Buen</span> <span className="text-[#FFC107]">Provecho</span>
            </h1>
            <span className="text-[#FF5722] text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mt-1">POS MESERO</span>
          </div>
          
          <nav className="flex items-center gap-3 md:gap-6">
            <button 
              onClick={() => setSeccion('NUEVO')}
              className={`flex items-center gap-1.5 md:gap-2 font-medium text-[9px] md:text-[11px] uppercase tracking-widest transition-colors ${
                seccion === 'NUEVO' ? 'text-[#FFC107]' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <span className="text-base md:text-lg">⊕</span> <span className="hidden sm:inline">NUEVO</span> PEDIDO
            </button>
            <button 
              onClick={() => setSeccion('HISTORIAL')}
              className={`flex items-center gap-1.5 md:gap-2 font-medium text-[9px] md:text-[11px] uppercase tracking-widest transition-colors ${
                seccion === 'HISTORIAL' ? 'text-[#FFC107]' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <span className="text-base md:text-lg">↺</span> <span className="hidden sm:inline">MIS</span> PEDIDOS
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-white font-black text-xs uppercase leading-none">{mesero?.nombre}</p>
            <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mt-1">ID: {mesero?.id?.slice(0,4)}</p>
          </div>
          <button 
            onClick={async () => { 
              localStorage.removeItem('mesero_sesion'); 
              await supabase.auth.signOut(); 
              setMesero(null); 
              setPaso('AUTH'); 
            }}
            className="w-9 h-9 md:w-10 md:h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 text-zinc-400 hover:text-red-500 transition-all group"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {seccion === 'NUEVO' ? (
          <>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 bg-[#0A0A0A] p-4 md:p-6 rounded-[10px] border border-white/5 shadow-2xl">
                <div className="hidden md:block md:col-span-3 space-y-3">
                  <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest block">Canal</label>
                  <div className="h-10 bg-black border border-[#FFC107]/30 rounded-lg flex items-center gap-3 px-4 shadow-[0_0_12px_rgba(255,193,7,0.05)]">
                    <span className="text-[#FFC107] font-black text-[10px] uppercase tracking-[0.2em]">Mesa</span>
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FFC107] animate-pulse" />
                  </div>
                </div>

                <div className="md:col-span-9 space-y-3">
                  <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest block">Nombre del Cliente</label>
                  <div className="relative group">
                    <Input 
                      placeholder="EJ. CLIENTE MESA..."
                      value={borradorPedido.nombreCliente}
                      onChange={(e) => setBorradorCampo('nombreCliente', e.target.value.toUpperCase())}
                      className="h-10 bg-black border-white/10 group-hover:border-white/20 font-black text-xs uppercase tracking-tight placeholder:text-zinc-800 transition-all pl-10"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-hover:text-[#FFC107] transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end px-2">
                  <h3 className="text-white font-medium text-xs uppercase tracking-[0.2em] italic">Mesa</h3>
                  <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">Piso 1</span>
                </div>
                <CuadriculaMesas 
                  onSelect={(m) => { setBorradorCampo('mesaId', m.id); setBorradorCampo('mesaNumero', m.numero); }} 
                  seleccionada={borradorPedido.mesaId} 
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <MenuVisual onAdd={agregarItem} />
              </div>
            </main>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:w-[375px] bg-[#0A0A0A] border-l border-white/10 flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.5)] z-40">
              <ComandaActiva onEnviar={handleEnviarPedido} enviando={enviando} />
            </aside>

            {/* Mobile Shopping Cart (Sheet) */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <div className={cn(
                  "fixed bottom-6 left-6 right-6 lg:hidden z-50 transition-all transform",
                  (totalItems > 0 || isCartOpen) ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
                )}>
                  <Button className="w-full h-14 bg-[#FFC107] hover:bg-[#FFD54F] text-black font-black flex items-center justify-between px-6 rounded-2xl shadow-[0_10px_30px_rgba(255,193,7,0.3)] border-b-4 border-[#C79100] active:translate-y-1 active:border-b-0 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center text-xs">
                        {totalItems}
                      </div>
                      <span className="uppercase tracking-[0.1em] text-xs">Ver Comanda</span>
                    </div>
                    <span className="text-sm font-black">{formatCOP(totalMonto)}</span>
                  </Button>
                </div>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 border-l border-white/10 w-full sm:max-w-[400px]">
                <ComandaActiva 
                  onEnviar={() => {
                    handleEnviarPedido();
                  }} 
                  enviando={enviando}
                  onClose={() => setIsCartOpen(false)}
                />
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <div className="flex-1 bg-black">
            {mesero ? <MisPedidos meseroId={mesero.id} /> : (
              <div className="flex-1 flex items-center justify-center opacity-10">
                <p className="font-black text-[10px] uppercase tracking-[0.3em]">Cargando sesión...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
