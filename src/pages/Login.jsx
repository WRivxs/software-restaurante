// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import InstallPWA from '../components/InstallPWA';

export default function Login() {
  const { user, loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    console.log('🔑 Login: Intentando ingresar con:', email);
    try {
      await loginWithEmail(email, password);
      console.log('✅ Login: Éxito en autenticación. Navegando...');
      navigate('/');
    } catch (err) {
      console.error('❌ Login: Error capturado en componente:', err);
      setError(err.message || 'Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-black flex flex-col overflow-y-auto custom-scrollbar relative">
      <InstallPWA />
      {/* Franja Amarilla Superior — Ajustada para mobile */}
      <div className="absolute top-0 left-0 w-full h-[25vh] md:h-[calc(35vh-20px)] bg-[#FFB800] z-0 shadow-2xl border-b-[4px] md:border-b-[6px] border-[#412112]/20" />

      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-start pt-[6vh] md:pt-[8vh] px-4 pb-12">
        {/* Branding */}
        <div className="flex flex-col items-center mb-6 animate-fade-in-down scale-90 md:scale-100">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <h1 className="text-white font-black text-4xl md:text-6xl leading-[0.8] tracking-tighter italic drop-shadow-md outline-text">
                BUEN
              </h1>
              <h2 className="text-[#FF6B00] font-black text-3xl md:text-5xl leading-none tracking-tighter italic drop-shadow-md -mt-1 outline-text">
                PROVECHO
              </h2>
            </div>
            {/* Círculo con Arepa Real */}
            <div className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-full border-4 border-[#412112] flex items-center justify-center shadow-2xl relative overflow-hidden">
              <img
                src="/arepa.png"
                alt="Arepa"
                className="w-full h-full object-cover transform scale-110"
              />
              <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-[#412112] px-1.5 md:px-2 py-0.5 rounded-full text-[6px] md:text-[8px] font-black text-white rotate-12 z-10">
                RICO!
              </div>
            </div>
          </div>
          <p className="text-[#412112] font-black text-[8px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] mt-2 bg-white/40 px-3 py-1 rounded-full border border-[#412112]/10">
            AREPAS RELLENAS
          </p>
        </div>

        {/* Tarjeta de Login */}
        <div className="glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-7 shadow-2xl relative border border-white/5 w-full max-w-sm animate-fade-in-up mt-12 md:mt-6">
          <form onSubmit={handleLogin} className="space-y-4 md:space-y-5">
            <Input
              label="USUARIO ADMINISTRATIVO"
              type="email"
              placeholder="admin@buenprovecho.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-black/60 border-white/10 text-white h-11 md:h-12 text-sm focus:border-brand-orange"
            />
            <Input
              label="CONTRASEÑA DE ACCESO"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-black/60 border-white/10 text-white h-11 md:h-12 text-sm focus:border-brand-orange"
            />

            {error && (
              <div className="bg-state-error/10 border border-state-error/20 rounded-xl py-2 px-4 animate-shake">
                <p className="text-state-error text-[10px] font-black uppercase text-center tracking-tighter">
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 md:h-14 bg-brand-orange hover:bg-[#412112] hover:text-white text-white font-black text-xs md:text-sm uppercase tracking-widest shadow-xl shadow-brand-orange/20 transition-all active:scale-95 rounded-2xl"
              disabled={loading}
            >
              {loading ? 'INGRESANDO...' : 'ENTRAR AL SISTEMA'}
            </Button>
          </form>

          {/* Acceso Mesero */}
          <div className="mt-5 md:mt-6 pt-5 md:pt-6 border-t border-white/5 flex flex-col items-center">
            <a
              href="/mesero"
              className="text-white/40 hover:text-brand-orange font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              MODO OPERATIVO (PIN) <span className="text-brand-orange">→</span>
            </a>
          </div>
        </div>

        <p className="text-center mt-6 md:mt-8 text-[8px] md:text-[9px] text-white/20 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em]">
          Buen Provecho · Software de Gestión
        </p>
      </div>

      <style>
        {`
          .outline-text {
            -webkit-text-stroke: 4px #412112;
            paint-order: stroke fill;
          }
          @media (min-width: 768px) {
            .outline-text {
              -webkit-text-stroke: 6px #412112;
            }
          }
        `}
      </style>
    </div>
  );
}
