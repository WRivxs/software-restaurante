// src/components/mesero/MeseroLayout.jsx
// Pantalla del mesero: selección con PIN y sistema de comandas
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../hooks/useStore';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getInitials } from '../../lib/utils';
import PantallaPedido from './PantallaPedido';

export default function MeseroLayout() {
  const { user: meseroActual, setUser } = useAppStore();
  const [meseros, setMeseros] = useState([]);
  const [meseroSeleccionado, setMeseroSeleccionado] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarMeseros();
  }, []);

  async function cargarMeseros() {
    const { data } = await supabase
      .from('usuarios')
      .select('id, nombre, rol')
      .eq('rol', 'MESERO')
      .eq('activo', true)
      .order('nombre');
    setMeseros(data || []);
    setLoading(false);
  }

  function presionarDigito(d) {
    if (pin.length < 4) setPin((p) => p + d);
  }

  function borrar() {
    setPin((p) => p.slice(0, -1));
    setError('');
  }

  async function validarPin() {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', meseroSeleccionado.id)
      .eq('pin', pin)
      .single();
    if (data) {
      setUser(data);
      setError('');
    } else {
      setError('PIN incorrecto');
      setPin('');
    }
  }

  // Una vez el mesero está autenticado, mostramos la pantalla de pedido
  if (meseroActual?.rol === 'MESERO') {
    return <PantallaPedido />;
  }

  // Selección de mesero
  if (!meseroSeleccionado) {
    return (
      <div className="min-h-screen bg-bg-primary p-6 flex flex-col">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-yellow rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">🍔</div>
          <h1 className="text-2xl font-black text-white">¿Quién eres?</h1>
          <p className="text-zinc-500 text-sm mt-1">Selecciona tu nombre para comenzar</p>
        </div>
        {loading ? (
          <div className="flex justify-center"><div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" /></div>
        ) : meseros.length === 0 ? (
          <p className="text-zinc-500 text-center">No hay meseros registrados. Contacta al administrador.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-xl mx-auto w-full">
            {meseros.map((m) => (
              <button
                key={m.id}
                onClick={() => { setMeseroSeleccionado(m); setPin(''); setError(''); }}
                className="bg-bg-surface border border-bg-border rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-brand-yellow/50 hover:shadow-glow transition-all active:scale-95"
              >
                <div className="w-14 h-14 bg-bg-elevated rounded-full flex items-center justify-center text-brand-yellow font-black text-xl">
                  {getInitials(m.nombre)}
                </div>
                <span className="text-white font-bold text-sm text-center leading-tight">{m.nombre}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // PIN Pad
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-xs">
        <button
          onClick={() => { setMeseroSeleccionado(null); setPin(''); setError(''); }}
          className="text-zinc-500 hover:text-white text-sm mb-6 flex items-center gap-1 transition-colors"
        >
          ← Volver
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center text-brand-yellow font-black text-2xl mx-auto mb-3">
            {getInitials(meseroSeleccionado.nombre)}
          </div>
          <h2 className="text-white font-black text-lg">{meseroSeleccionado.nombre}</h2>
          <p className="text-zinc-500 text-sm mt-1">Ingresa tu PIN de 4 dígitos</p>
        </div>

        {/* Puntos del PIN */}
        <div className="flex justify-center gap-3 mb-6">
          {[0,1,2,3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                i < pin.length ? 'bg-brand-yellow border-brand-yellow' : 'border-bg-border'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-state-error text-center text-sm font-bold mb-4">{error}</p>}

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1,2,3,4,5,6,7,8,9].map((d) => (
            <button
              key={d}
              onClick={() => presionarDigito(String(d))}
              className="bg-bg-elevated border border-bg-border rounded-2xl py-5 text-white font-black text-xl hover:border-brand-yellow/50 active:scale-95 transition-all"
            >
              {d}
            </button>
          ))}
          <button
            onClick={borrar}
            className="bg-bg-elevated border border-bg-border rounded-2xl py-5 text-zinc-400 hover:text-white active:scale-95 transition-all flex items-center justify-center"
          >
            ⌫
          </button>
          <button
            onClick={() => presionarDigito('0')}
            className="bg-bg-elevated border border-bg-border rounded-2xl py-5 text-white font-black text-xl hover:border-brand-yellow/50 active:scale-95 transition-all"
          >
            0
          </button>
          <button
            onClick={validarPin}
            disabled={pin.length < 4}
            className="bg-brand-yellow text-black rounded-2xl py-5 font-black text-xl hover:bg-brand-hover active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ✓
          </button>
        </div>
      </div>
    </div>
  );
}
