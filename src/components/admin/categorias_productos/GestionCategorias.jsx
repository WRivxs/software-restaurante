// src/components/admin/categorias_productos/GestionCategorias.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Dialog } from '../../ui/Dialog';

export default function GestionCategorias() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ nombre: '', orden: 0, activa: true });
  const [editId, setEditId] = useState(null);

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias_admin'],
    queryFn: async () => {
      const { data } = await supabase.from('categorias').select('*').order('orden', { ascending: true });
      return data || [];
    }
  });

  const filtered = categorias.filter(c => 
    c.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const guardar = useMutation({
    mutationFn: async () => {
      if (!form.nombre.trim()) throw new Error('El nombre es obligatorio');
      
      const payload = { 
        nombre: form.nombre.toUpperCase(),
        orden: parseInt(form.orden) || 0,
        activa: form.activa 
      };

      const { error } = editId 
        ? await supabase.from('categorias').update(payload).eq('id', editId)
        : await supabase.from('categorias').insert([payload]);
      
      if (error) throw error;
    },
    onSuccess: () => { 
      qc.invalidateQueries(['categorias_admin']); 
      setModal(false); 
      setEditId(null); 
      setForm({ nombre: '', orden: 0, activa: true });
    },
    onError: (err) => {
      alert('Error: ' + err.message);
    }
  });

  const eliminar = useMutation({
    mutationFn: async (id) => {
      if (!confirm('¿Seguro que deseas eliminar esta categoría?')) return;
      const { error } = await supabase.from('categorias').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(['categorias_admin'])
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header Estilo Referencia - Ajustado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tighter uppercase">Gestión de Categorías</h1>
          <p className="text-zinc-500 text-xs font-medium mt-1">
            Administra las secciones de tu menú interactivo.
          </p>
        </div>
        <button 
          onClick={() => { setEditId(null); setForm({ nombre: '', orden: categorias.length + 1, activa: true }); setModal(true); }}
          className="bg-[#FFB100] hover:bg-[#E55800] text-black h-12 px-6 rounded-[7px] font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-950/20 transition-all flex items-center gap-3 active:scale-95"
        >
          <span className="text-xl">+</span> Nueva Categoría
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros - Ajustado a Referencia */}

      <div className="bg-[#111111] p-4 rounded-[7px] border border-white/[0.08] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full max-w-sm">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input 
            type="text" 
            placeholder="Buscar categoría..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#050505] border border-white/[0.05] rounded-[7px] h-10 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/10 transition-all font-medium"
          />
        </div>
        <div className="bg-[#18181B] border border-white/[0.05] h-10 px-4 rounded-[7px] flex items-center gap-2 shrink-0 ml-auto">
          <span className="text-sm opacity-60">⚖️</span>
          <p className="text-zinc-500 font-bold text-[10px] tracking-tight uppercase">
            Total: <span className="text-zinc-300 ml-1">{categorias.length} Categorías</span>
          </p>
        </div>
      </div>

      {/* Vista Híbrida: Tabla (Desktop) / Tarjetas (Mobile) */}
      <div className="bg-[#111111] rounded-[7px] border border-white/[0.08] overflow-hidden shadow-xl mt-4">
        
        {/* Tabla (Solo Desktop) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="px-6 py-4 text-zinc-500 font-bold uppercase text-[9px] tracking-widest w-20">Orden</th>
                <th className="px-6 py-4 text-zinc-500 font-bold uppercase text-[9px] tracking-widest">Nombre de Categoría</th>
                <th className="px-6 py-4 text-zinc-500 font-bold uppercase text-[9px] tracking-widest">Estado</th>
                <th className="px-6 py-4 text-zinc-500 font-bold uppercase text-[9px] tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08]">
              {filtered.map((c, index) => (
                <tr key={c.id} className="group hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-8 h-8 bg-[#18181B] rounded-md flex items-center justify-center text-zinc-300 font-bold text-xs border border-white/5">
                      {c.orden || index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-zinc-300 font-bold text-sm tracking-tight group-hover:text-[#FFD700] transition-colors cursor-default">
                      {c.nombre}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 py-1 px-3 rounded-full bg-[#18181B]/50 border border-white/5 w-fit">
                      <div className={`w-1.5 h-1.5 rounded-full ${c.activa ? 'bg-[#4ADE80] shadow-[0_0_8px_#4ADE80]' : 'bg-zinc-600'}`} />
                      <span className={`font-bold text-[10px] tracking-tight ${c.activa ? 'text-[#4ADE80]' : 'text-zinc-600'}`}>
                        {c.activa ? '• Activo' : '• Inactivo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-100 transition-all duration-300">
                      <button 
                        onClick={() => { setEditId(c.id); setForm({ nombre: c.nombre, orden: c.orden, activa: c.activa }); setModal(true); }}
                        className="w-9 h-9 rounded-[7px] bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-[#FFD700] hover:text-black hover:shadow-[0_0_10px_rgba(255,215,0,0.3)] transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button 
                        onClick={() => eliminar.mutate(c.id)}
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
          {filtered.map((c, index) => (
            <div key={c.id} className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#18181B] rounded-md flex items-center justify-center text-zinc-300 font-bold text-xs border border-white/5">
                    {c.orden || index + 1}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm uppercase">{c.nombre}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${c.activa ? 'bg-[#4ADE80]' : 'bg-zinc-600'}`} />
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${c.activa ? 'text-[#4ADE80]' : 'text-zinc-600'}`}>
                        {c.activa ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditId(c.id); setForm({ nombre: c.nombre, orden: c.orden, activa: c.activa }); setModal(true); }}
                    className="w-10 h-10 rounded-[7px] bg-white/5 flex items-center justify-center text-zinc-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button 
                    onClick={() => eliminar.mutate(c.id)}
                    className="w-10 h-10 rounded-[7px] bg-white/5 flex items-center justify-center text-red-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-zinc-600 text-xs font-bold uppercase tracking-widest italic">
            No se encontraron categorías
          </div>
        )}
      </div>

      {/* Footer Info Paginación - Fuera de la tabla */}
      <div className="flex justify-between items-center px-2">
        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-tight">
          Mostrando {filtered.length} de {categorias.length} categorías
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
        title={editId ? 'EDITAR CATEGORÍA' : 'NUEVA CATEGORÍA'}
      >
        <div className="space-y-6 pt-4">
          <Input 
            label="NOMBRE DE LA CATEGORÍA" 
            value={form.nombre} 
            onChange={e => setForm({ ...form, nombre: e.target.value })} 
            className="h-14 uppercase font-bold" 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="ORDEN VISUAL" 
              type="number"
              value={form.orden} 
              onChange={e => setForm({ ...form, orden: e.target.value })} 
              className="h-14" 
            />
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">ESTADO</label>
              <button 
                onClick={() => setForm({ ...form, activa: !form.activa })}
                className={`h-14 rounded-[7px] border font-black uppercase text-[10px] tracking-widest transition-all ${
                  form.activa ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-zinc-500/50 bg-zinc-500/10 text-zinc-400'
                }`}
              >
                {form.activa ? 'ACTIVO' : 'INACTIVO'}
              </button>
            </div>
          </div>
          <div className="flex gap-4 pt-6">
            <Button variant="ghost" onClick={() => setModal(false)} className="flex-1 h-14 font-black uppercase text-[10px]">Cancelar</Button>
            <button 
              onClick={() => guardar.mutate()} 
              disabled={guardar.isLoading}
              className="flex-1 h-14 bg-[#FFD700] text-black font-black uppercase text-[10px] tracking-widest rounded-[7px] shadow-lg disabled:opacity-50"
            >
              {guardar.isLoading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
