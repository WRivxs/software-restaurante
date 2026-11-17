import { useState, useEffect } from 'react';
import { Button } from './ui/Button';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar si es iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Capturar el evento de instalación (Android/PC)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Solo mostrar si no se ha cerrado antes en esta sesión
      if (!sessionStorage.getItem('pwa_prompt_dismissed')) {
        setVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detectar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setVisible(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ PWA Instalada con éxito');
    }
    
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] animate-fade-in-down">
      <div className="glass bg-black/80 backdrop-blur-xl border border-[#FFC107]/20 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-lg mx-auto overflow-hidden relative">
        {/* Glow de fondo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FFC107]/10 blur-3xl rounded-full" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-black border border-white/10 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
            <img src="/pwa-512x512.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-black text-[11px] uppercase tracking-widest leading-none">Buen Provecho App</h3>
            <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-tight mt-1 truncate">
              {isIOS ? 'Agrégala a tu pantalla de inicio' : '¡Instala para acceso rápido!'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleDismiss}
              className="px-3 py-2 text-zinc-600 hover:text-white font-black text-[9px] uppercase tracking-widest transition-colors"
            >
              Luego
            </button>
            <Button 
              onClick={isIOS ? null : handleInstall}
              size="sm"
              className="bg-[#FFC107] hover:bg-[#FFD54F] text-black font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-lg shadow-[0_4px_15px_rgba(255,193,7,0.2)]"
            >
              {isIOS ? '¿Cómo?' : 'INSTALAR'}
            </Button>
          </div>
        </div>

        {/* Mini tutorial para iOS si el usuario hace clic en "¿Cómo?" (opcional, por ahora solo mostramos el banner) */}
        {isIOS && (
          <p className="text-[8px] text-[#FFC107] font-black uppercase tracking-tighter mt-3 text-center border-t border-white/5 pt-2">
            Toca "Compartir" y luego "Agregar a inicio" 📲
          </p>
        )}
      </div>
    </div>
  );
}
