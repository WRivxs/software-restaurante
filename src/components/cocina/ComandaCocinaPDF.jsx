import React from 'react';

export const ComandaCocinaPDF = React.forwardRef(({ pedido }, ref) => {
  if (!pedido) return null;

  const fecha = new Date(pedido.creado_en || Date.now());

  return (
    <div 
      ref={ref} 
      className="bg-white text-black p-4 w-[300px] mx-auto font-mono text-[12px] leading-tight border border-black/5"
      style={{ fontFamily: "'Courier New', Courier, monospace" }}
    >
      {/* ── ENCABEZADO DE COCINA ── */}
      <div className="text-center border-b-2 border-black pb-3 mb-3">
        <h2 className="text-xl font-black uppercase tracking-tighter">COMANDA COCINA</h2>
        <p className="text-[14px] font-black mt-1">
          {pedido.mesa_id ? `MESA: ${String(pedido.mesa_id).padStart(2, '0')}` : '--- DOMICILIO ---'}
        </p>
      </div>

      {/* ── INFO PEDIDO ── */}
      <div className="space-y-1 mb-3 text-[11px]">
        <div className="flex justify-between">
          <span className="font-bold">ORDEN:</span> 
          <span>#{pedido.numero_pedido || pedido.id.split('-')[0]}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">CLIENTE:</span> 
          <span className="uppercase">{pedido.nombre_cliente || pedido.nombre_cliente_dom || 'S/N'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">HORA:</span> 
          <span>{fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* ── DETALLE PRODUCTOS (Lo más importante para cocina) ── */}
      <table className="w-full mb-3 border-y-2 border-black/10">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-2 w-8 text-[14px]">CANT</th>
            <th className="py-2 text-[14px]">PRODUCTO / DETALLES</th>
          </tr>
        </thead>
        <tbody>
          {pedido.detalle_pedido?.map((d, i) => (
            <tr key={i} className="border-b border-black/5 align-top">
              <td className="py-3 text-[18px] font-black">{d.cantidad}</td>
              <td className="py-3">
                <div className="font-black uppercase text-[15px] leading-none mb-1">{d.productos?.nombre}</div>
                {(d.notas || d.nota) && (
                  <div className="bg-black/5 p-1 rounded-sm">
                    <p className="text-[12px] font-black italic">! {d.notas || d.nota}</p>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── NOTA GENERAL ── */}
      {(pedido.notas || pedido.nota) && (
        <div className="border-2 border-black p-2 mb-3 bg-zinc-50">
          <p className="text-[10px] font-black uppercase mb-1">Nota General del Pedido:</p>
          <p className="text-[13px] font-black italic uppercase leading-tight">
            {pedido.notas || pedido.nota}
          </p>
        </div>
      )}

      {/* ── PIE DE PÁGINA ── */}
      <div className="text-center pt-2 border-t border-dashed border-black/20">
        <p className="text-[9px] font-bold uppercase italic op-50">Buen Provecho - Gestión de Cocina</p>
      </div>
    </div>
  );
});
