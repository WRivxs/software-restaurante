import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { formatCOP } from '../../../lib/utils';
import { toast } from 'sonner';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Dialog } from '../../ui/Dialog';

const CARGOS = ['COCINERO', 'DOMICILIARIO', 'MESERO', 'PERSONAL DE LIMPIEZA', 'ADMINISTRATIVO', 'OTRO'];

export default function GestionTrabajadores() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'liquidacion'
  const [modalTrabajador, setModalTrabajador] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formTrabajador, setFormTrabajador] = useState({ nombre: '', telefono: '', cargo: 'COCINERO', activo: true });

  // Liquidación State
  const [formPago, setFormPago] = useState({ trabajador_id: '', monto: '', nota: '' });
  const [isPagando, setIsPagando] = useState(false);

  // Queries
  const { data: trabajadores = [], isLoading: loadingTrabajadores } = useQuery({
    queryKey: ['trabajadores'],
    queryFn: async () => {
      const { data } = await supabase.from('trabajadores').select('*').order('nombre');
      return data || [];
    }
  });

  const { data: ingresosHoy = 0 } = useQuery({
    queryKey: ['ingresos_hoy'],
    queryFn: async () => {
      const hoy = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('pedidos')
        .select('total')
        .eq('estado', 'PAGADO')
        .gte('creado_en', hoy);
      return (data || []).reduce((s, p) => s + (p.total || 0), 0);
    }
  });

  const { data: historialPagos = [] } = useQuery({
    queryKey: ['pagos_nomina'],
    queryFn: async () => {
      const { data } = await supabase
        .from('egresos')
        .select('*, trabajadores(nombre)')
        .eq('categoria_egreso', 'NOMINA')
        .order('fecha', { ascending: false })
        .limit(20);
      return data || [];
    }
  });

  // Mutations
  const guardarTrabajador = useMutation({
    mutationFn: async () => {
      if (!formTrabajador.nombre.trim()) throw new Error('El nombre es obligatorio');
      const payload = { ...formTrabajador, nombre: formTrabajador.nombre.toUpperCase() };
      const { error } = editId
        ? await supabase.from('trabajadores').update(payload).eq('id', editId)
        : await supabase.from('trabajadores').insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries(['trabajadores']);
      setModalTrabajador(false);
      setEditId(null);
      setFormTrabajador({ nombre: '', telefono: '', cargo: 'COCINERO', activo: true });
      toast.success('Trabajador guardado correctamente');
    },
    onError: (err) => toast.error(err.message)
  });

  const procesarPago = async () => {
    if (!formPago.trabajador_id || !formPago.monto) {
      toast.error('Selecciona un trabajador e ingresa el monto');
      return;
    }
    setIsPagando(true);
    try {
      const trabajador = trabajadores.find(t => t.id === formPago.trabajador_id);
      const { error } = await supabase.from('egresos').insert([{
        descripcion: `Pago Nómina: ${trabajador.nombre}`,
        monto: Number(formPago.monto),
        categoria_egreso: 'NOMINA',
        trabajador_id: formPago.trabajador_id,
        fecha: new Date().toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).slice(0, 10),
        nota: formPago.nota || 'Liquidación de jornada'
      }]);

      if (error) throw error;

      toast.success('Pago registrado y descontado de caja');
      setFormPago({ trabajador_id: '', monto: '', nota: '' });
      qc.invalidateQueries(['pagos_nomina']);
      qc.invalidateQueries(['egresos']); // Para el cierre de caja
    } catch (err) {
      toast.error('Error al registrar pago: ' + err.message);
    } finally {
      setIsPagando(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in overflow-hidden">
      
      {/* Header Tabs */}
      <div className="shrink-0 p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-black text-2xl tracking-tighter uppercase italic">
              Gestión de <span className="text-[#FFB100]">Trabajadores</span>
            </h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Nómina y Liquidación de Personal</p>
          </div>
          <div className="flex bg-[#111111] p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setActiveTab('personal')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'personal' ? 'bg-[#FFB100] text-black shadow-lg shadow-[#FFB100]/20' : 'text-zinc-500 hover:text-white'}`}
            >
              Personal
            </button>
            <button 
              onClick={() => setActiveTab('liquidacion')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'liquidacion' ? 'bg-[#FFB100] text-black shadow-lg shadow-[#FFB100]/20' : 'text-zinc-500 hover:text-white'}`}
            >
              Liquidación
            </button>
          </div>
        </div>
        <div className="border-b border-white/[0.06] w-full" />
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-6">
        
        {activeTab === 'personal' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#111111] p-4 rounded-xl border border-white/5">
               <p className="text-zinc-400 text-xs font-bold uppercase">Total Personal: <span className="text-white ml-2">{trabajadores.length}</span></p>
               <button 
                onClick={() => { setEditId(null); setFormTrabajador({ nombre: '', telefono: '', cargo: 'COCINERO', activo: true }); setModalTrabajador(true); }}
                className="h-10 px-6 bg-[#FFB100] text-black font-black text-[10px] uppercase tracking-widest rounded-lg transition-transform active:scale-95"
               >
                 + Nuevo Trabajador
               </button>
            </div>

            <div className="bg-[#111111] border border-white/5 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-zinc-500 font-black text-[9px] uppercase tracking-[0.2em]">Nombre</th>
                    <th className="px-6 py-4 text-zinc-500 font-black text-[9px] uppercase tracking-[0.2em]">Cargo</th>
                    <th className="px-6 py-4 text-zinc-500 font-black text-[9px] uppercase tracking-[0.2em]">Teléfono</th>
                    <th className="px-6 py-4 text-zinc-500 font-black text-[9px] uppercase tracking-[0.2em]">Estado</th>
                    <th className="px-6 py-4 text-zinc-500 font-black text-[9px] uppercase tracking-[0.2em] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {trabajadores.map(t => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 text-white font-bold text-sm uppercase tracking-tight">{t.nombre}</td>
                      <td className="px-6 py-4">
                        <span className="bg-[#18181B] px-3 py-1 rounded-full text-zinc-400 font-black text-[9px] uppercase tracking-widest border border-white/5">
                          {t.cargo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-xs font-mono">{t.telefono || '—'}</td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 ${t.activo ? 'text-green-400' : 'text-zinc-600'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${t.activo ? 'bg-green-400 shadow-[0_0_8px_#4ADE80]' : 'bg-zinc-600'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{t.activo ? 'Activo' : 'Inactivo'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => { setEditId(t.id); setFormTrabajador({ ...t }); setModalTrabajador(true); }}
                          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 hover:text-[#FFB100] transition-colors ml-auto"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {trabajadores.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-600 font-black text-[10px] uppercase tracking-[0.2em] italic">No hay trabajadores registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Formulario de Pago */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 bg-[#111111] p-8 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                  <svg className="w-24 h-24 text-[#FFB100]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.39 2.1-1.39 1.47 0 2.01.59 2.1 1.58h1.84c-.05-1.53-1.11-2.61-2.59-2.94V5h-2v1.72c-1.73.35-3.13 1.46-3.13 3.19 0 1.96 1.62 2.97 4 3.59 2.22.56 2.62 1.34 2.62 2.2 0 1.21-1.04 1.83-2.53 1.83-1.55 0-2.28-.62-2.43-1.89h-1.92c.16 1.94 1.51 3.01 3.27 3.39V20h2v-1.72c1.8-.31 3.2-1.35 3.2-3.21 0-2.34-1.91-3.26-4.69-3.92z"/></svg>
                </div>
                
                <h3 className="text-white font-black text-lg uppercase tracking-tight mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFB100]" />
                  Nueva Liquidación
                </h3>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest pl-1">Trabajador</label>
                       <select 
                        value={formPago.trabajador_id}
                        onChange={e => setFormPago({...formPago, trabajador_id: e.target.value})}
                        className="w-full h-14 bg-black border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:border-[#FFB100]/40 outline-none transition-all appearance-none cursor-pointer"
                       >
                         <option value="">Seleccionar trabajador...</option>
                         {trabajadores.filter(t => t.activo).map(t => (
                           <option key={t.id} value={t.id}>{t.nombre} ({t.cargo})</option>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest pl-1">Monto a Liquidar (Caja)</label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFB100] font-black">$</span>
                          <input 
                            type="number"
                            value={formPago.monto}
                            onChange={e => setFormPago({...formPago, monto: e.target.value})}
                            placeholder="0.00"
                            className="w-full h-14 bg-black border border-white/5 rounded-xl pl-10 pr-4 text-white text-lg font-black italic focus:border-[#FFB100]/40 outline-none transition-all placeholder:text-zinc-800"
                          />
                       </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest pl-1">Concepto / Nota</label>
                     <textarea 
                        value={formPago.nota}
                        onChange={e => setFormPago({...formPago, nota: e.target.value})}
                        placeholder="Ej: Liquidación diaria, Bono, Adelanto..."
                        className="w-full h-20 bg-black border border-white/5 rounded-xl p-4 text-white text-xs font-medium focus:border-[#FFB100]/40 outline-none transition-all placeholder:text-zinc-800"
                     />
                  </div>

                  <button 
                    onClick={procesarPago}
                    disabled={isPagando}
                    className="w-full h-14 bg-[#FFB100] text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-xl shadow-[#FFB100]/10 hover:bg-[#FFD54F] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isPagando ? 'Procesando...' : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                        Confirmar Pago de Nómina
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="bg-[#111111] p-6 rounded-2xl border border-[#FFB100]/20 shadow-xl flex flex-col justify-center gap-1 min-h-[140px]">
                    <span className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">Ingreso Total Hoy</span>
                    <p className="text-3xl font-black text-[#FFB100] italic tracking-tighter">{formatCOP(ingresosHoy)}</p>
                    <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest mt-1">Suma de pedidos cerrados</p>
                 </div>
                 <div className="bg-[#111111] p-6 rounded-2xl border border-red-500/10 shadow-xl flex flex-col justify-center gap-2">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                       <span className="text-red-500/70 text-[9px] font-black uppercase tracking-[0.2em]">Importante</span>
                    </div>
                    <p className="text-white/60 text-[9px] font-bold leading-relaxed uppercase tracking-wide">
                      Esta liquidación se descontará directamente del resumen de gastos del cierre de caja al final del turno.
                    </p>
                 </div>
              </div>

            </div>

            {/* Historial de Pagos */}
            <div className="space-y-4">
               <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-3 pl-1">
                 Historial Reciente
                 <span className="h-0.5 flex-1 bg-white/[0.03]" />
               </h3>
               
               <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="border-b border-white/5">
                        <th className="px-6 py-4 text-zinc-500 font-black text-[8px] uppercase tracking-widest">Fecha</th>
                        <th className="px-6 py-4 text-zinc-500 font-black text-[8px] uppercase tracking-widest">Trabajador</th>
                        <th className="px-6 py-4 text-zinc-500 font-black text-[8px] uppercase tracking-widest">Nota</th>
                        <th className="px-6 py-4 text-zinc-500 font-black text-[8px] uppercase tracking-widest text-right">Monto</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5 text-[11px]">
                     {historialPagos.map(p => (
                       <tr key={p.id} className="hover:bg-white/[0.01]">
                         <td className="px-6 py-4 text-zinc-500 font-mono italic">{p.fecha}</td>
                         <td className="px-6 py-4 text-white font-bold uppercase tracking-tight">{p.trabajadores?.nombre || '—'}</td>
                         <td className="px-6 py-4 text-zinc-600 font-medium uppercase text-[10px] whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">{p.nota}</td>
                         <td className="px-6 py-4 text-right">
                           <span className="text-[#FFB100] font-black italic">{formatCOP(p.monto)}</span>
                         </td>
                       </tr>
                     ))}
                     {historialPagos.length === 0 && (
                       <tr><td colSpan={4} className="px-6 py-10 text-center text-zinc-700 italic">No hay historial de pagos registrados</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>

          </div>
        )}

      </div>

      {/* Modal Trabajador */}
      <Dialog 
        open={modalTrabajador} 
        onClose={() => setModalTrabajador(false)} 
        title={editId ? 'EDITAR TRABAJADOR' : 'REGISTRAR TRABAJADOR'}
      >
        <div className="space-y-5 pt-4">
          <Input 
            label="Nombre Completo *" 
            value={formTrabajador.nombre} 
            onChange={e => setFormTrabajador({...formTrabajador, nombre: e.target.value})} 
            className="h-12 uppercase font-bold text-sm tracking-tight"
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 flex-1">
               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Cargo</label>
               <select 
                value={formTrabajador.cargo}
                onChange={e => setFormTrabajador({...formTrabajador, cargo: e.target.value})}
                className="w-full h-12 bg-[#050505] border border-white/5 rounded-xl px-4 text-white text-[11px] font-black uppercase tracking-widest focus:border-[#FFB100]/40 outline-none transition-all"
               >
                 {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>
            <Input 
              label="Teléfono" 
              value={formTrabajador.telefono} 
              onChange={e => setFormTrabajador({...formTrabajador, telefono: e.target.value})} 
              className="h-12 font-mono text-zinc-400"
            />
          </div>
          
          <div className="flex items-center gap-3 bg-[#050505] p-3 rounded-xl border border-white/5">
             <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex-1">Estado de Empleado</label>
             <button 
              onClick={() => setFormTrabajador({...formTrabajador, activo: !formTrabajador.activo})}
              className={`h-10 px-6 rounded-lg font-black text-[9px] uppercase tracking-widest border transition-all ${formTrabajador.activo ? 'border-[#4ADE80]/30 bg-[#4ADE80]/5 text-[#4ADE80]' : 'border-zinc-500/20 text-zinc-600' }`}
             >
               {formTrabajador.activo ? 'Activo' : 'Inactivo'}
             </button>
          </div>

          <div className="flex gap-4 pt-6">
            <Button variant="ghost" className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest" onClick={() => setModalTrabajador(false)}>Cancelar</Button>
            <button 
              onClick={() => guardarTrabajador.mutate()}
              disabled={guardarTrabajador.isPending}
              className="flex-1 h-12 bg-[#FFB100] text-black font-black uppercase text-[10px] tracking-widest rounded-xl shadow-xl transition-transform active:scale-95 disabled:opacity-50"
            >
              {guardarTrabajador.isPending ? 'Guardando...' : 'Confirmar Datos'}
            </button>
          </div>
        </div>
      </Dialog>

    </div>
  );
}
