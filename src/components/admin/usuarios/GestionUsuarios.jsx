// src/components/admin/usuarios/GestionUsuarios.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Dialog } from '../../ui/Dialog';

export default function GestionUsuarios() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'MESERO', pin: '', activo: true });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios_admin'],
    queryFn: async () => {
      const { data } = await supabase.from('usuarios').select('*').order('nombre');
      return data || [];
    }
  });

  const filtered = usuarios.filter(u => {
    const matchesSearch = u.nombre.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.rol === roleFilter;
    return matchesSearch && matchesRole;
  });

  const guardar = useMutation({
    mutationFn: async () => {
      if (!form.nombre.trim()) throw new Error('El nombre es obligatorio');
      
      let userId = editId;

      // REGISTRO EN AUTH PARA ADMIN/CAJERO (Solo si es nuevo)
      if (!editId && (form.rol === 'ADMIN' || form.rol === 'CAJERO')) {
        const cleanEmail = form.email.trim().toLowerCase();
        if (!cleanEmail || !form.password) throw new Error('Email y Contraseña son obligatorios');
        if (form.password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: form.password,
          options: {
            data: { nombre: form.nombre, rol: form.rol }
          }
        });

        if (authError) throw authError;
        userId = authData.user.id;
      }

      // Generar ID manual para MESERO si es nuevo (uuid)
      if (!editId && form.rol === 'MESERO') {
        userId = crypto.randomUUID();
      }

      if (form.rol === 'MESERO' && !form.pin) throw new Error('El PIN es obligatorio para meseros');
      
      const payload = {
        nombre: form.nombre.toUpperCase(),
        rol: form.rol,
        email: (form.rol === 'ADMIN' || form.rol === 'CAJERO') ? form.email.trim().toLowerCase() : null,
        pin: form.rol === 'MESERO' ? form.pin : null,
        activo: form.activo
      };

      // Guardar en tabla usuarios vinculando el id (ya sea el de Auth o el autogenerado)
      const { error } = editId 
        ? await supabase.from('usuarios').update(payload).eq('id', editId)
        : await supabase.from('usuarios').insert([{ id: userId, ...payload }]);
      
      if (error) throw error;
    },
    onSuccess: () => { 
      qc.invalidateQueries(['usuarios_admin']); 
      setModal(false); 
      setEditId(null);
      setForm({ nombre: '', email: '', password: '', rol: 'MESERO', pin: '', activo: true });
    },
    onError: (err) => alert('Error: ' + err.message)
  });

  const eliminar = useMutation({
    mutationFn: async (id) => {
      if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;
      const { error } = await supabase.from('usuarios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(['usuarios_admin'])
  });

  const getRoleBadge = (rol) => {
    switch (rol) {
      case 'ADMIN': return 'bg-zinc-800 text-zinc-300 border-zinc-700';
      case 'CAJERO': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'MESERO': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tighter uppercase">Gestión de Usuarios</h1>
          <p className="text-zinc-500 text-xs font-medium mt-1">
            Administra el personal, asigna roles y configura accesos por PIN.
          </p>
        </div>
        <button 
          onClick={() => { setEditId(null); setForm({ nombre: '', email: '', rol: 'MESERO', pin: '', activo: true }); setModal(true); }}
          className="bg-[#FFB100] hover:bg-[#E55800] text-black h-12 px-6 rounded-[7px] font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-950/20 transition-all flex items-center gap-3 active:scale-95"
        >
          <span className="text-xl">+</span> Nuevo Usuario
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
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#050505] border border-white/[0.05] rounded-[7px] h-10 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/10 transition-all font-medium"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto ml-auto">
          <select 
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-[#18181B] border border-white/[0.05] h-10 px-4 rounded-[7px] text-sm text-zinc-400 focus:outline-none focus:border-white/10 transition-all cursor-pointer font-bold uppercase text-[10px] tracking-widest"
          >
            <option value="all">TODOS LOS ROLES</option>
            <option value="ADMIN">ADMINISTRADORES</option>
            <option value="CAJERO">CAJEROS</option>
            <option value="MESERO">MESEROS</option>
          </select>
          
          <div className="bg-[#18181B] border border-white/[0.05] h-10 px-4 rounded-[7px] flex items-center gap-2 shrink-0">
            <p className="text-zinc-500 font-bold text-[10px] tracking-tight uppercase">
              Total: <span className="text-zinc-300 ml-1">{usuarios.length} Usuarios</span>
            </p>
          </div>
        </div>
      </div>

      {/* Vista Híbrida: Tabla (Desktop) / Tarjetas (Mobile) */}
      <div className="bg-[#111111] rounded-[7px] border border-white/[0.08] overflow-hidden shadow-xl mt-4">
        
        {/* Tabla (Solo Desktop) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="px-6 py-2.5 text-zinc-500 font-bold uppercase text-[9px] tracking-widest">Nombre</th>
                <th className="px-6 py-2.5 text-zinc-500 font-bold uppercase text-[9px] tracking-widest">Email</th>
                <th className="px-6 py-2.5 text-zinc-500 font-bold uppercase text-[9px] tracking-widest">Rol</th>
                <th className="px-6 py-2.5 text-zinc-500 font-bold uppercase text-[9px] tracking-widest">Acceso / PIN</th>
                <th className="px-6 py-2.5 text-zinc-500 font-bold uppercase text-[9px] tracking-widest">Estado</th>
                <th className="px-6 py-2.5 text-zinc-500 font-bold uppercase text-[9px] tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08]">
              {filtered.map((u) => (
                <tr key={u.id} className="group hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-2.5">
                    <span className="text-zinc-300 font-bold text-sm tracking-tight group-hover:text-[#FFD700] transition-colors">
                      {u.nombre}
                    </span>
                  </td>
                  <td className="px-6 py-2.5">
                    <span className="text-zinc-500 font-medium text-xs tracking-tight italic">
                      {u.email || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-2.5">
                    <span className={`px-3 py-1 rounded-full border text-[9px] font-black tracking-widest ${getRoleBadge(u.rol)}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-6 py-2.5 text-zinc-500 text-[11px] font-medium tracking-tight">
                    {u.rol === 'MESERO' ? (
                      <div className="flex items-center gap-2">
                        {u.pin ? (
                          <span className="text-[#4ADE80]">✅ PIN Asignado (****)</span>
                        ) : (
                          <span className="text-zinc-600">Sin PIN</span>
                        )}
                      </div>
                    ) : (
                      <span>Email / Pass</span>
                    )}
                  </td>
                  <td className="px-6 py-2.5">
                    <div className="flex items-center gap-2 py-1 px-3 rounded-full bg-[#18181B]/50 border border-white/5 w-fit">
                      <div className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-[#4ADE80] shadow-[0_0_8px_#4ADE80]' : 'bg-zinc-600'}`} />
                      <span className={`font-bold text-[10px] tracking-tight ${u.activo ? 'text-[#4ADE80]' : 'text-zinc-600'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-2.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setEditId(u.id); setForm(u); setModal(true); }}
                        className="w-9 h-9 rounded-[7px] bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-[#FFD700] hover:text-black transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
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
          {filtered.map((u) => (
            <div key={u.id} className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-white font-bold text-sm uppercase truncate">{u.nombre}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black tracking-widest ${getRoleBadge(u.rol)}`}>
                      {u.rol}
                    </span>
                    <div className={`px-2 py-0.5 rounded-full border text-[8px] font-black tracking-widest ${
                      u.activo ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </div>
                  </div>
                  <p className="text-zinc-500 text-[10px] font-medium italic mt-1 truncate">
                    {u.rol === 'MESERO' ? (u.pin ? 'PIN Configurado' : 'Sin PIN') : u.email}
                  </p>
                </div>
                <button 
                  onClick={() => { setEditId(u.id); setForm(u); setModal(true); }}
                  className="w-10 h-10 rounded-[7px] bg-white/5 flex items-center justify-center text-zinc-300 border border-white/10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-zinc-600 text-xs font-bold uppercase tracking-widest italic">
            No se encontraron usuarios
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center px-2">
        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-tight">
          Mostrando {filtered.length} de {usuarios.length} usuarios
        </p>
        <div className="flex gap-2">
           <button className="w-8 h-8 rounded-[7px] bg-[#111111] border border-white/5 flex items-center justify-center text-zinc-600 hover:text-white transition-colors">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
           </button>
           <button className="w-8 h-8 rounded-lg bg-[#111111] border border-white/5 flex items-center justify-center text-zinc-600 hover:text-white transition-colors">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
           </button>
        </div>
      </div>

      {/* Modal */}
      <Dialog 
        open={modal} 
        onClose={() => setModal(false)} 
        title={editId ? 'EDITAR USUARIO' : 'NUEVA CUENTA DE USUARIO'}
      >
        <div className="space-y-6 pt-4">
          <Input 
            label="NOMBRE COMPLETO" 
            value={form.nombre} 
            onChange={e => setForm({ ...form, nombre: e.target.value })} 
            className="h-14 uppercase font-black tracking-tight" 
            placeholder="EJ: JUAN PÉREZ"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">ROL ASIGNADO</label>
              <select 
                value={form.rol} 
                onChange={e => setForm({ ...form, rol: e.target.value, pin: e.target.value === 'MESERO' ? form.pin : '', email: '' })}
                className="h-14 bg-[#18181B] border border-white/5 rounded-[7px] px-4 text-white text-xs font-bold focus:border-[#FFD700] outline-none transition-all uppercase tracking-tight"
              >
                <option value="ADMIN">ADMINISTRADOR</option>
                <option value="CAJERO">CAJERO EN CAJA</option>
                <option value="MESERO">MESERO / ATENCIÓN</option>
              </select>
            </div>

            {form.rol === 'MESERO' ? (
              <Input 
                label="PIN DE ACCESO (4 DÍGITOS)" 
                type="text"
                autoComplete="off"
                maxLength={4}
                value={form.pin || ''} 
                onChange={e => setForm({ ...form, pin: e.target.value.replace(/[^0-9]/g, '') })} 
                className="h-14 tracking-[0.5em] text-center text-brand-yellow font-black text-lg" 
              />
            ) : (
              <div className="flex flex-col gap-2 opacity-50 cursor-not-allowed">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">ACCESO POR SISTEMA</label>
                <div className="h-14 bg-[#18181B]/30 border border-white/5 rounded-[7px] flex items-center px-4 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                  Requiere Registro en Auth
                </div>
              </div>
            )}
          </div>

          {/* Campos condicionales para Admin/Cajero */}
          {(form.rol === 'ADMIN' || form.rol === 'CAJERO') && !editId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
              <Input 
                label="CORREO ELECTRÓNICO" 
                type="email"
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
                className="h-14" 
                placeholder="usuario@dominio.com"
              />
              <Input 
                label="CONTRASEÑA (MÍN. 6 CARACT.)" 
                type="password"
                value={form.password} 
                onChange={e => setForm({ ...form, password: e.target.value })} 
                className="h-14" 
                placeholder="••••••"
              />
            </div>
          )}

          {(form.rol === 'ADMIN' || form.rol === 'CAJERO') && editId && (
            <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-[7px] flex gap-3">
              <span className="text-blue-400">ℹ️</span>
              <p className="text-[10px] text-blue-300 font-medium uppercase tracking-tight leading-relaxed">
                El correo y contraseña se gestionan desde la configuración de cuenta de Supabase Auth.
              </p>
            </div>
          )}
          <div className="flex gap-4 pt-6">
            <Button variant="ghost" onClick={() => setModal(false)} className="flex-1 h-14 font-black uppercase text-[10px]">Cancelar</Button>
            <button 
              onClick={() => guardar.mutate()} 
              className="flex-1 h-14 bg-[#FFD700] text-black font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg"
            >
              GUARDAR USUARIO
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
