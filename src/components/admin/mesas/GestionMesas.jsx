// src/components/admin/mesas/GestionMesas.jsx
import { useState } from 'react';
import { useMesas } from '../../../hooks/useMesas';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Dialog } from '../../ui/Dialog';

const FORM_VACIO = { numero: '', nombre: '' };

export default function GestionMesas() {
  const { data: mesas = [], isLoading, guardarMesa, toggleActiva } = useMesas();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [editId, setEditId] = useState(null);

  const handleGuardar = async () => {
    if (!form.numero) return alert('El número de mesa es obligatorio');
    try {
      await guardarMesa.mutateAsync({
        id: editId,
        numero: parseInt(form.numero),
        nombre: form.nombre ? form.nombre.toUpperCase() : null,
        activa: true
      });
      setModal(false);
      setForm(FORM_VACIO);
      setEditId(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleToggle = async (id, estadoActual) => {
    try {
      await toggleActiva.mutateAsync({ id, activa: !estadoActual });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (isLoading) return <div className="text-zinc-500 text-center py-20 font-bold uppercase tracking-widest text-xs animate-pulse">Cargando Mesas Administrativas...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tighter uppercase">Gestión de Mesas</h1>
          <p className="text-zinc-500 text-xs font-medium mt-1">
            Administra la disposición y estado de las mesas del salón.
          </p>
        </div>
        <button 
          onClick={() => { setEditId(null); setForm(FORM_VACIO); setModal(true); }}
          className="bg-[#FFB100] hover:bg-[#E55800] text-black h-12 px-6 rounded-[7px] font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-950/20 transition-all flex items-center gap-3 active:scale-95"
        >
          <span className="text-xl">+</span> Nueva Mesa
        </button>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-white/[0.05] rounded-[7px] p-5 flex flex-col gap-1 shadow-xl">
          <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-[0.2em]">Total Mesas</p>
          <p className="text-white text-3xl font-black italic">{mesas.length}</p>
        </div>
        <div className="bg-[#111111] border border-green-500/10 rounded-[7px] p-5 flex flex-col gap-1 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500/40" />
          <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-[0.2em]">Mesas Activas</p>
          <p className="text-green-500 text-3xl font-black italic">{mesas.filter(m => m.activa).length}</p>
        </div>
        <div className="bg-[#111111] border border-red-500/10 rounded-[7px] p-5 flex flex-col gap-1 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500/40" />
          <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-[0.2em]">Mesas Inactivas</p>
          <p className="text-red-500 text-3xl font-black italic">{mesas.filter(m => !m.activa).length}</p>
        </div>
      </div>

      {/* Grid de Mesas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
        {mesas.map((mesa) => (
          <div 
            key={mesa.id}
            className={`group relative bg-[#111111] border rounded-[7px] p-5 transition-all duration-300 ${
              mesa.activa ? 'border-white/[0.08] hover:border-[#FFB100]/40' : 'border-red-900/20 opacity-60'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-[#18181B] w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 shadow-inner">
                <span className={`text-2xl font-black italic ${mesa.activa ? 'text-[#FFB100]' : 'text-zinc-600'}`}>
                  {mesa.numero}
                </span>
              </div>
              <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                mesa.activa ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {mesa.activa ? 'Activa' : 'Inactiva'}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-white font-black text-sm tracking-tight truncate uppercase">
                {mesa.nombre || `Mesa ${mesa.numero}`}
              </p>
            </div>

            {/* Acciones Hover */}
            <div className="flex gap-2 mt-5">
              <button 
                onClick={() => { setEditId(mesa.id); setForm(mesa); setModal(true); }}
                className="flex-1 h-9 bg-white/5 hover:bg-white/10 rounded-[7px] flex items-center justify-center text-zinc-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/5"
              >
                Editar
              </button>
              <button 
                onClick={() => handleToggle(mesa.id, mesa.activa)}
                className={`w-9 h-9 rounded-[7px] flex items-center justify-center transition-all border shadow-lg ${
                  mesa.activa 
                    ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' 
                    : 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {mesas.length === 0 && (
          <div className="col-span-full border border-dashed border-white/10 rounded-[7px] py-20 flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-4 opacity-20">🪑</div>
            <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">No hay mesas configuradas</p>
            <p className="text-zinc-700 text-[10px] mt-2 max-w-[200px]">Comienza agregando las mesas de tu salón para que los meseros puedan tomar pedidos.</p>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      <Dialog 
        open={modal} 
        onClose={() => setModal(false)} 
        title={editId ? 'ACTUALIZAR MESA' : 'REGISTRAR NUEVA MESA'}
      >
        <div className="space-y-6 pt-4">
          <Input 
            label="NÚMERO DE MESA" 
            type="number"
            value={form.numero} 
            onChange={e => setForm({ ...form, numero: e.target.value })} 
            className="h-14 font-black italic text-xl text-[#FFB100]" 
            placeholder="00"
          />
          
          <Input 
            label="NOMBRE O ÁREA (OPCIONAL)" 
            value={form.nombre} 
            onChange={e => setForm({ ...form, nombre: e.target.value })} 
            className="h-14 uppercase font-bold tracking-tight" 
            placeholder="EJ: TERRAZA VISTA, VIP, BARRA"
          />

          <div className="flex gap-4 pt-6">
            <Button variant="ghost" onClick={() => setModal(false)} className="flex-1 h-14 font-black uppercase text-[10px] tracking-widest">Cancelar</Button>
            <button 
              onClick={handleGuardar} 
              className="flex-1 h-14 bg-[#FFB100] text-black font-black uppercase text-[10px] tracking-widest rounded-[7px] shadow-lg shadow-orange-900/20 active:scale-95 transition-all"
            >
              {editId ? 'GUARDAR CAMBIOS' : 'CREAR MESA'}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
