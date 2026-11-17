import { Input } from '../ui/Input';

export default function FormNombreCliente({ value, onChange, label = "Nombre del Cliente *" }) {
  return (
    <div className="space-y-2">
      <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{label}</label>
      <Input
        placeholder="Ej: Juan Pérez"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-lg py-6 font-bold"
      />
    </div>
  );
}
