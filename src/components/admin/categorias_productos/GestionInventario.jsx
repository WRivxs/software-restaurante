import React, { useState } from 'react';
import GestionCategorias from './GestionCategorias';
import GestionProductos from './GestionProductos';

export default function GestionInventario() {
  const [activeView, setActiveView] = useState('categorias'); // 'categorias', 'productos'

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in">
      {/* Cabezal de Navegación Interna - Selector Compacto */}
      <div className="shrink-0 pt-2 px-6 flex justify-start items-center -mt-2">
        <div className="flex items-center bg-[#111111] p-1 rounded-xl border border-white/10 shadow-2xl">
          <button
            onClick={() => setActiveView('categorias')}
            className={`px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${activeView === 'categorias'
              ? 'bg-[#FFB100] text-black shadow-lg shadow-[#FFB100]/20'
              : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
          >
            Categorías
          </button>
          <button
            onClick={() => setActiveView('productos')}
            className={`px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${activeView === 'productos'
              ? 'bg-[#FFB100] text-black shadow-lg shadow-[#FFB100]/20'
              : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
          >
            Productos
          </button>
        </div>
      </div>

      <div className="mt-1 border-b border-white/[0.06] w-full" />

      {/* Contenido Dinámico */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {activeView === 'categorias' ? (
          <GestionCategorias />
        ) : (
          <GestionProductos />
        )}
      </div>
    </div>
  );
}
