// src/components/admin/GestionEgresos.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../ui/Toast';
import { Button } from '../../ui/Button';
import { Input, Textarea } from '../../ui/Input';
import { Dialog } from '../../ui/Dialog';
import { formatCOP } from '../../../lib/utils';

const CATEGORIAS_EGRESO = ['INSUMOS', 'SERVICIOS', 'NOMINA', 'EQUIPOS', 'ARRIENDO', 'OTRO'];

async function fetchEgresos() {
  const { data } = await supabase.from('egresos').select('*').order('fecha', { ascending: false }).limit(100);
  return data || [];
}

const emptyForm = () => ({ descripcion: '', categoria_egreso: 'INSUMOS', monto: '', fecha: new Date().toISOString().split('T')[0], nota: '' });

export default function GestionEgresos() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: egresos = [], isLoading } = useQuery({ queryKey: ['egresos'], queryFn: fetchEgresos });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState(null);
  const [catFiltro, setCatFiltro] = useState('');

  const total = egresos.filter((e) => catFiltro ? e.categoria_egreso === catFiltro : true).reduce((s, e) => s + e.monto, 0);

  const guardar = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = { 
        descripcion: form.descripcion, 
        categoria_egreso: form.categoria_egreso, 
        monto: Number(form.monto), 
        fecha: form.fecha, 
        nota: form.nota || null,
        registrado_por: user?.id // Conexión con el Administrador
      };
      const { error } = editId
        ? await supabase.from('egresos').update(payload).eq('id', editId)
        : await supabase.from('egresos').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['egresos'] }); toast('Egreso guardado', 'success'); setModal(false); },
    onError: (e) => toast(e.message, 'error'),
  });

  const eliminar = useMutation({
    mutationFn: (id) => supabase.from('egresos').delete().eq('id', id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['egresos'] }); toast('Egreso eliminado', 'error'); },
  });

  const filtrados = catFiltro ? egresos.filter((e) => e.categoria_egreso === catFiltro) : egresos;

  function abrir(egreso = null) {
    setEditId(egreso?.id || null);
    setForm(egreso ? { descripcion: egreso.descripcion, categoria_egreso: egreso.categoria_egreso, monto: egreso.monto, fecha: egreso.fecha, nota: egreso.nota || '' } : emptyForm());
    setModal(true);
  }

  const catColors = { INSUMOS: 'text-brand-yellow', SERVICIOS: 'text-state-info', NOMINA: 'text-brand-orange', EQUIPOS: 'text-zinc-300', ARRIENDO: 'text-state-error', OTRO: 'text-zinc-500' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Egresos / Inversión</h1>
          <p className="text-zinc-500 text-sm mt-1">Total filtrado: <span className="text-state-error font-bold">{formatCOP(total)}</span></p>
        </div>
        <Button onClick={() => abrir()}>+ Nuevo Egreso</Button>
      </div>

      {/* Filtro categoría */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button onClick={() => setCatFiltro('')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${!catFiltro ? 'bg-brand-yellow text-black border-brand-yellow' : 'bg-bg-elevated border-bg-border text-zinc-400'}`}>Todos</button>
        {CATEGORIAS_EGRESO.map((c) => (
          <button key={c} onClick={() => setCatFiltro(c)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${catFiltro === c ? 'bg-brand-yellow text-black border-brand-yellow' : 'bg-bg-elevated border-bg-border text-zinc-400'}`}>{c}</button>
        ))}
      </div>

      <div className="bg-bg-surface border border-bg-border rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-bg-border">
              {['Fecha', 'Descripción', 'Categoría', 'Monto', ''].map((h) => (
                <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-bg-border">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan={5} className="px-6 py-4"><div className="h-5 bg-bg-elevated rounded animate-pulse" /></td></tr>)
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-600">Sin egresos registrados.</td></tr>
            ) : filtrados.map((e) => (
              <tr key={e.id} className="hover:bg-bg-elevated/50 transition-colors group">
                <td className="px-6 py-4 text-zinc-400 text-sm font-mono">{new Date(e.fecha + 'T12:00').toLocaleDateString('es-CO')}</td>
                <td className="px-6 py-4">
                  <p className="text-white font-bold text-sm">{e.descripcion}</p>
                  {e.nota && <p className="text-zinc-500 text-xs">{e.nota}</p>}
                </td>
                <td className="px-6 py-4"><span className={`text-xs font-black uppercase ${catColors[e.categoria_egreso] || 'text-zinc-400'}`}>{e.categoria_egreso}</span></td>
                <td className="px-6 py-4 text-state-error font-black">{formatCOP(e.monto)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => abrir(e)} className="text-zinc-500 hover:text-brand-yellow text-xs font-bold">Editar</button>
                    <button onClick={() => { if (confirm('¿Eliminar egreso?')) eliminar.mutate(e.id); }} className="text-zinc-500 hover:text-state-error text-xs font-bold">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={modal} onClose={() => setModal(false)} title={editId ? 'Editar Egreso' : 'Nuevo Egreso'}>
        <div className="space-y-4">
          <Input label="Descripción *" placeholder='Ej: "Compra de carne - Frigorífico X"' value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <div className="flex gap-4">
            <Input label="Monto COP *" type="number" placeholder="0" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} className="flex-1" />
            <Input label="Fecha" type="date" max={new Date().toISOString().split('T')[0]} value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="flex-1" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Categoría</label>
            <select value={form.categoria_egreso} onChange={(e) => setForm({ ...form, categoria_egreso: e.target.value })}
              className="bg-bg-elevated border border-bg-border text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow">
              {CATEGORIAS_EGRESO.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Textarea label="Nota (opcional)" placeholder="Detalle adicional..." value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} rows={2} />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={() => guardar.mutate()} disabled={!form.descripcion || !form.monto || guardar.isPending}>Guardar</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
