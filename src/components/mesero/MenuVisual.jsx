// src/components/mesero/MenuVisual.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { formatCOP } from '../../lib/utils';

export default function MenuVisual({ onAdd }) {
  const [categoriaActiva, setCategoriaActiva] = useState('Populares');

  const { data: productos = [], isLoading } = useQuery({
    queryKey: ['menu_visual'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('*, categorias(nombre)')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-full bg-[#111111] animate-pulse rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((p) => (
            <div key={p} className="h-48 bg-[#111111] rounded-xl animate-pulse border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  const categorias = ['Populares', ...new Set(productos.map(p => p.categorias?.nombre || 'General'))];
  const productosFiltrados = productos.filter(p => 
    categoriaActiva === 'Populares' ? true : (p.categorias?.nombre || 'General') === categoriaActiva
  );

  return (
    <div className="space-y-6">
      {/* Categorías - Estilo Pestañas Foto */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 custom-scrollbar border-b border-white/5">
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoriaActiva(cat)}
            className={`px-5 py-3 text-[11px] font-medium uppercase tracking-widest whitespace-nowrap transition-all relative ${
              categoriaActiva === cat ? 'text-[#FFC107]' : 'text-zinc-500 hover:text-white'
            }`}
          >
            {cat}
            {categoriaActiva === cat && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFC107] shadow-[0_0_10px_rgba(255,193,7,0.5)]" />
            )}
          </button>
        ))}
      </div>

      {/* Grid de Productos - Estilo Ultra-Compacto Foto */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-3">
        {productosFiltrados.map(p => (
          <button
            key={p.id}
            onClick={() => onAdd(p)}
            className="group bg-[#0A0A0A] border border-white/5 rounded-lg overflow-hidden text-left hover:border-white/20 transition-all active:scale-95 flex flex-col h-[162px]"
          >
            {/* Imagen del Producto */}
            <div className="h-[110px] bg-[#151515] relative overflow-hidden">
               <img 
                 src={p.imagen_url || `https://source.unsplash.com/400x300/?${p.nombre.split(' ')[0]},food`} 
                 alt={p.nombre}
                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40" />
               
               {/* Badge de Precio */}
               <div className="absolute top-0 right-0 p-1">
                 <div className="px-2 py-0.5 bg-[#FFC107] text-black font-black text-[11px] rounded-[3px] shadow-lg">
                   {formatCOP(p.precio_venta)}
                 </div>
               </div>
            </div>

            {/* Info del Producto - Bloque Negro con un poquito más de altura */}
            <div className="flex-1 flex flex-col justify-center px-2 py-2 bg-black/50 border-t border-white/5">
              <h4 className="text-white font-black text-[9px] uppercase tracking-tight leading-none group-hover:text-[#FFC107] transition-colors truncate">
                {p.nombre}
              </h4>
              <p className="text-zinc-500 text-[7px] leading-tight line-clamp-2 mt-1 opacity-80 italic">
                {p.descripcion || 'Especialidad de la casa preparada al momento.'}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
