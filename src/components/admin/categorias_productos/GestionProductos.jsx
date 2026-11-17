// src/components/admin/categorias_productos/GestionProductos.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/Button';
import { Input, Textarea } from '../../ui/Input';
import { Dialog } from '../../ui/Dialog';
import { formatCOP } from '../../../lib/utils';

export default function GestionProductos() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ 
    nombre: '', 
    precio_venta: '', 
    categoria_id: '', 
    descripcion: '', 
    imagen_url: '', 
    activo: true 
  });

  const { data: productos = [] } = useQuery({
    queryKey: ['productos_admin'],
    queryFn: async () => {
      const { data } = await supabase.from('productos').select('*, categorias(nombre)').order('nombre');
      return data || [];
    }
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias_admin'],
    queryFn: async () => {
      const { data } = await supabase.from('categorias').select('*').order('nombre');
      return data || [];
    }
  });

  const filtered = productos.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
    const matchesCat = catFilter === 'ALL' || String(p.categoria_id) === catFilter;
    return matchesSearch && matchesCat;
  });

  const guardar = useMutation({
    mutationFn: async () => {
      if (!form.nombre.trim()) throw new Error('El nombre es obligatorio');
      const payload = { 
        ...form, 
        precio_venta: Number(form.precio_venta),
        categoria_id: form.categoria_id || null
      };
      
      const { error } = editId 
        ? await supabase.from('productos').update(payload).eq('id', editId)
        : await supabase.from('productos').insert([payload]);
      
      if (error) throw error;
    },
    onSuccess: () => { 
      qc.invalidateQueries(['productos_admin']); 
      setModal(false); 
      setEditId(null); 
    }
  });

  const eliminar = useMutation({
    mutationFn: async (id) => {
      if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(['productos_admin'])
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header Estilo Referencia */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tighter uppercase">Gestión de Productos</h1>
          <p className="text-zinc-500 text-xs font-medium mt-1">
            Administra el inventario y precios del menú.
          </p>
        </div>
        <button 
          onClick={() => { 
            setEditId(null); 
            setForm({ nombre: '', precio_venta: '', categoria_id: '', descripcion: '', imagen_url: '', activo: true }); 
            setModal(true); 
          }}
          className="bg-[#FFB100] hover:bg-[#E55800] text-black h-12 px-6 rounded-[7px] font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-950/20 transition-all flex items-center gap-3 active:scale-95"
        >
          <span className="text-xl">+</span> Nuevo Producto
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros */}

      <div className="bg-[#111111] p-4 rounded-[7px] border border-white/[0.08] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full max-w-sm">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input 
            type="text" 
            placeholder="Buscar producto por nombre o descripción..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#050505] border border-white/[0.05] rounded-[7px] h-10 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/10 transition-all font-medium"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto ml-auto">
          <select 
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="bg-[#18181B] border border-white/[0.05] h-10 px-4 rounded-[7px] text-xs font-bold text-zinc-400 focus:outline-none focus:border-white/10 flex-1 md:flex-none appearance-none cursor-pointer"
          >
            <option value="ALL">Todas las Categorías</option>
            {categorias.map(c => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
          </select>
          <button className="bg-[#18181B] border border-white/[0.05] h-10 w-10 rounded-[7px] flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4.5h18m-18 5h18m-18 5h18m-18 5h18" /></svg>
          </button>
        </div>
      </div>

      {/* Vista Híbrida: Tabla (Desktop) / Tarjetas (Mobile) */}
      <div className="bg-[#111111] rounded-[7px] border border-white/[0.08] overflow-hidden shadow-xl mt-4">
        
        {/* Tabla (Solo Desktop) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="px-6 py-2.5 text-zinc-500 font-bold uppercase text-[9px] tracking-widest">Producto</th>
                <th className="px-6 py-2.5 text-zinc-500 font-bold uppercase text-[9px] tracking-widest">Categoría</th>
                <th className="px-6 py-2.5 text-zinc-500 font-bold uppercase text-[9px] tracking-widest">Precio de Venta</th>
                <th className="px-6 py-2.5 text-zinc-500 font-bold uppercase text-[9px] tracking-widest">Estado</th>
                <th className="px-6 py-2.5 text-zinc-500 font-bold uppercase text-[9px] tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08]">
              {filtered.map((p) => (
                <tr key={p.id} className="group hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-2.5">
                    <div className="flex items-center gap-3">
                      {p.imagen_url ? (
                        <div className="w-10 h-10 rounded-[7px] overflow-hidden border border-white/5 bg-[#18181B] shrink-0">
                          <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-[7px] bg-[#18181B] border border-white/5 flex items-center justify-center shrink-0">
                          <span className="text-[10px] text-zinc-600">NO IMG</span>
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-zinc-200 font-bold text-sm tracking-tight truncate group-hover:text-[#FFD700] transition-colors uppercase">
                          {p.nombre}
                        </span>
                        {p.descripcion && (
                          <span className="text-[10px] text-zinc-500 font-medium truncate leading-tight mt-0.5">
                            {p.descripcion}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-2.5">
                    <span className="text-zinc-500 font-medium text-xs tracking-tight">
                      {p.categorias?.nombre || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-2.5 font-bold text-zinc-300 text-sm italic">
                    {formatCOP(p.precio_venta)}
                  </td>
                  <td className="px-6 py-2.5">
                    <div className="flex items-center gap-2 py-1 px-3 rounded-full bg-[#18181B]/50 border border-white/5 w-fit">
                      <div className={`w-1.5 h-1.5 rounded-full ${p.activo ? 'bg-[#4ADE80] shadow-[0_0_8px_#4ADE80]' : 'bg-zinc-600'}`} />
                      <span className={`font-bold text-[10px] tracking-tight ${p.activo ? 'text-[#4ADE80]' : 'text-zinc-600'}`}>
                        {p.activo ? '• Activo' : '• Inactivo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-2.5 text-right">
                    <div className="flex justify-end gap-2 opacity-100 transition-all duration-300">
                      <button 
                        onClick={() => { setEditId(p.id); setForm({ ...p, categorias: undefined }); setModal(true); }}
                        className="w-9 h-9 rounded-[7px] bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-[#FFD700] hover:text-black hover:shadow-[0_0_10px_rgba(255,215,0,0.3)] transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button 
                        onClick={() => eliminar.mutate(p.id)}
                        className="w-9 h-9 rounded-[7px] bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-red-500 hover:text-white hover:shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tarjetas (Solo Mobile) */}
        <div className="md:hidden divide-y divide-white/[0.08]">
          {filtered.map((p) => (
            <div key={p.id} className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-3 min-w-0">
                  {p.imagen_url ? (
                    <div className="w-12 h-12 rounded-[7px] overflow-hidden border border-white/5 bg-[#18181B] shrink-0">
                      <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-[7px] bg-[#18181B] border border-white/5 flex items-center justify-center shrink-0">
                      <span className="text-[10px] text-zinc-600">NO IMG</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm uppercase truncate">{p.nombre}</p>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{p.categorias?.nombre || 'General'}</p>
                    <p className="text-[#FFD700] text-xs font-black italic mt-0.5">{formatCOP(p.precio_venta)}</p>
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${
                  p.activo ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-zinc-500/10 text-zinc-500 border-white/5'
                }`}>
                  {p.activo ? 'Activo' : 'Agotado'}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setEditId(p.id); setForm({ ...p, categorias: undefined }); setModal(true); }}
                  className="flex-1 h-10 rounded-[7px] bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 font-bold text-[10px] uppercase tracking-widest"
                >
                  Editar
                </button>
                <button 
                  onClick={() => eliminar.mutate(p.id)}
                  className="w-10 h-10 rounded-[7px] bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-zinc-600 text-xs font-bold uppercase tracking-widest italic">
            No se encontraron productos
          </div>
        )}
      </div>

      {/* Footer Info Paginación - Fuera de la tabla */}
      <div className="flex justify-between items-center px-2">
        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-tight">
          Mostrando {filtered.length} de {productos.length} productos
        </p>
        <div className="flex gap-2">
           <button className="w-8 h-8 rounded-[7px] bg-[#111111] border border-white/5 flex items-center justify-center text-zinc-600 hover:text-white transition-colors">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
           </button>
           <button className="w-8 h-8 rounded-[7px] bg-[#111111] border border-white/5 flex items-center justify-center text-zinc-600 hover:text-white transition-colors">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
           </button>
        </div>
      </div>

      {/* Modal Estilizado */}
      <Dialog 
        open={modal} 
        onClose={() => setModal(false)} 
        title={editId ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
      >
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="NOMBRE DEL PRODUCTO" 
              value={form.nombre} 
              onChange={e => setForm({...form, nombre: e.target.value})} 
              className="h-10 uppercase font-black text-xs" 
            />
            <div className="flex flex-col gap-1.5">
               <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Categoría</label>
               <select 
                 value={form.categoria_id} 
                 onChange={e => setForm({...form, categoria_id: e.target.value})} 
                 className="h-10 bg-[#18181B] border border-white/10 rounded-[7px] px-3 text-white text-[11px] font-bold focus:border-[#FFD700] transition-all uppercase outline-none cursor-pointer"
               >
                 <option value="">Seleccionar...</option>
                 {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
               </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="PRECIO DE VENTA (COP)" 
              type="number" 
              value={form.precio_venta} 
              onChange={e => setForm({...form, precio_venta: e.target.value})} 
              className="h-10 text-xs font-bold font-mono" 
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Estado</label>
              <button 
                onClick={() => setForm({ ...form, activo: !form.activo })}
                className={`h-10 rounded-[7px] border font-black uppercase text-[9px] tracking-widest transition-all ${
                  form.activo ? 'border-green-500/30 bg-[#050505] text-green-400' : 'border-zinc-500/30 bg-[#050505] text-zinc-400'
                }`}
              >
                {form.activo ? 'ACTIVO' : 'AGOTADO'}
              </button>
            </div>
          </div>

          <Textarea 
            label="DESCRIPCIÓN DEL PRODUCTO" 
            value={form.descripcion} 
            onChange={e => setForm({...form, descripcion: e.target.value})} 
            placeholder="Ingredientes o detalles..."
            className="h-16 text-xs" 
          />

          <Input 
            label="URL IMAGEN" 
            value={form.imagen_url} 
            onChange={e => setForm({...form, imagen_url: e.target.value})} 
            placeholder="https://..."
            className="h-10 text-[10px]" 
          />

          <div className="flex gap-3 pt-3">
            <Button variant="ghost" onClick={() => setModal(false)} className="flex-1 h-10 font-bold uppercase text-[9px] tracking-widest">Cancelar</Button>
            <button 
              onClick={() => guardar.mutate()} 
              disabled={guardar.isLoading}
              className="flex-1 h-10 bg-[#FFB100] text-white font-black uppercase text-[9px] tracking-widest rounded-[7px] shadow-lg shadow-orange-950/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {guardar.isLoading ? 'GUARDANDO...' : 'GUARDAR PRODUCTO'}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
