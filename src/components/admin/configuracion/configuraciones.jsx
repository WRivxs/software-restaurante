import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

export default function Configuraciones() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    factura_nombre: '',
    factura_nit: '',
    factura_direccion: '',
    factura_telefono: ''
  });

  const { data: config = [], isLoading } = useQuery({
    queryKey: ['configuracion_global'],
    queryFn: async () => {
      const { data, error } = await supabase.from('configuracion').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  useEffect(() => {
    if (config.length > 0) {
      const newForm = { ...form };
      config.forEach(item => {
        if (newForm.hasOwnProperty(item.clave)) {
          newForm[item.clave] = item.valor;
        }
      });
      setForm(newForm);
    }
  }, [config]);

  const guardar = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(form).map(([clave, valor]) => ({
        clave,
        valor
      }));

      const { error } = await supabase.from('configuracion').upsert(updates);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries(['configuracion_global']);
      toast.success('Configuración guardada correctamente');
    },
    onError: (err) => toast.error('Error al guardar: ' + err.message)
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-8">
        <div className="h-8 bg-white/5 rounded-lg w-64" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-[#111] rounded-xl border border-white/5" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in p-1">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-white font-black text-xl tracking-tighter uppercase italic">
            Configuración <span className="text-[#FFB100]">General</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
            Personalización de Factura
          </p>
        </div>
        
        <button 
          onClick={() => guardar.mutate()}
          disabled={guardar.isPending}
          className="h-10 px-6 bg-[#FFB100] text-black font-black text-[9px] uppercase tracking-[0.2em] rounded-[10px] shadow-xl shadow-[#FFB100]/10 hover:bg-[#FFD54F] transition-all active:scale-95 disabled:opacity-50"
        >
          {guardar.isPending ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Formulario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Datos de Facturación */}
        <div className="md:col-span-2 bg-[#111111] p-5 rounded-[10px] border border-white/5 shadow-2xl space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
            <svg className="w-20 h-20 text-[#FFB100]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
          </div>

          <h3 className="text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[#FFB100]" />
            Encabezado de Factura
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-550 uppercase tracking-[0.2em] ml-1">Nombre del Establecimiento</label>
              <input 
                type="text" 
                value={form.factura_nombre}
                onChange={e => setForm({...form, factura_nombre: e.target.value.toUpperCase()})}
                className="w-full h-11 bg-black border border-white/5 rounded-[10px] px-4 text-white text-xs font-bold focus:border-[#FFB100]/40 outline-none transition-all placeholder:text-zinc-800 uppercase"
                placeholder="Ej: BUEN PROVECHO"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-550 uppercase tracking-[0.2em] ml-1">NIT / Identificación</label>
              <input 
                type="text" 
                value={form.factura_nit}
                onChange={e => setForm({...form, factura_nit: e.target.value.toUpperCase()})}
                className="w-full h-11 bg-black border border-white/5 rounded-[10px] px-4 text-white text-xs font-mono focus:border-[#FFB100]/40 outline-none transition-all placeholder:text-zinc-800"
                placeholder="900.000.000-0"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[9px] font-black text-zinc-550 uppercase tracking-[0.2em] ml-1">Dirección Física</label>
              <input 
                type="text" 
                value={form.factura_direccion}
                onChange={e => setForm({...form, factura_direccion: e.target.value.toUpperCase()})}
                className="w-full h-11 bg-black border border-white/5 rounded-[10px] px-4 text-white text-xs font-medium focus:border-[#FFB100]/40 outline-none transition-all placeholder:text-zinc-800 uppercase"
                placeholder="Calle 00 # 00 - 00 Barrio"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-550 uppercase tracking-[0.2em] ml-1">Teléfono de contacto</label>
              <input 
                type="text" 
                value={form.factura_telefono}
                onChange={e => setForm({...form, factura_telefono: e.target.value})}
                className="w-full h-11 bg-black border border-white/5 rounded-[10px] px-4 text-white text-xs font-mono focus:border-[#FFB100]/40 outline-none transition-all placeholder:text-zinc-800"
                placeholder="300 000 0000"
              />
            </div>
          </div>
        </div>

        {/* Preview Visual */}
        <div className="md:col-span-2 bg-black/40 border border-white/[0.03] rounded-[10px] p-5 flex flex-col items-center justify-center space-y-3">
           <span className="text-zinc-600 text-[8px] font-black uppercase tracking-[0.3em] mb-1">Vista Previa en Factura</span>
           <div className="w-full max-w-[260px] bg-white text-black p-5 shadow-2xl font-mono text-center space-y-0.5 rounded-sm">
              <p className="font-extrabold text-base leading-tight mb-0.5">{form.factura_nombre || 'NOMBRE DEL NEGOCIO'}</p>
              <p className="text-[9px] font-bold">NIT: {form.factura_nit || '000.000.000-0'}</p>
              <p className="text-[9px] leading-snug">{form.factura_direccion || 'DIRECCIÓN DEL LOCAL'}</p>
              <p className="text-[9px]">TEL: {form.factura_telefono || '000 000 0000'}</p>
              <div className="border-t border-black border-dashed my-2 w-full" />
              <p className="text-[8px] italic opacity-50">... resto de la factura ...</p>
           </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="bg-[#FFB100]/5 border border-[#FFB100]/10 rounded-[10px] p-4 flex gap-3 items-start">
         <div className="w-8 h-8 bg-[#FFB100]/10 rounded-lg flex items-center justify-center text-[#FFB100] shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
         </div>
         <div className="space-y-0.5">
            <p className="text-white font-bold text-[10px] uppercase tracking-tight">Sobre esta configuración</p>
            <p className="text-zinc-500 text-[9px] leading-relaxed font-medium uppercase tracking-wide">
              Los cambios se aplicarán de inmediato a todas las facturas impresas.
            </p>
         </div>
      </div>

    </div>
  );
}
