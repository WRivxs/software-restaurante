import React from 'react';
import { formatCOP } from '../../lib/utils';

export const FacturaPDF = React.forwardRef(({ pedido, config = [] }, ref) => {
  if (!pedido) return null;

  // Normalizar configuración con guardas de seguridad
  const safeConfig = Array.isArray(config) ? config : [];
  
  const cfg = {
    nombre: safeConfig.find(c => c.clave === 'factura_nombre')?.valor || 'BUEN PROVECHO',
    nit: safeConfig.find(c => c.clave === 'factura_nit')?.valor || '900.123.456-7',
    direccion: safeConfig.find(c => c.clave === 'factura_direccion')?.valor || 'KRA 27 #12-16 BARRIO EL BOSQUE',
    telefono: safeConfig.find(c => c.clave === 'factura_telefono')?.valor || '300 122 3317'
  };

  return (
    <div 
      ref={ref} 
      className="bg-white text-black p-6 w-[300px] mx-auto font-mono text-[11px] leading-tight shadow-sm border border-black/5"
      style={{ fontFamily: "'Courier New', Courier, monospace" }}
    >
      {/* ── LOGO / ENCABEZADO ── */}
      <div className="text-center border-b border-dashed border-black pb-4 mb-4">
        <h2 className="text-lg font-black uppercase tracking-tighter mb-1">{cfg.nombre}</h2>
        <p className="text-[10px] font-bold">NIT: {cfg.nit}</p>
        <p className="text-[9px] uppercase">{cfg.direccion}</p>
        <p className="text-[9px]">TEL: {cfg.telefono}</p>
        <p className="text-[8px] mt-1 italic">RÉGIMEN SIMPLIFICADO</p>
      </div>

      {/* ── DATOS TRANSACCIÓN ── */}
      <div className="space-y-1 mb-4">
        <div className="flex justify-between">
          <span>FACTURA:</span> 
          <span className="font-bold">#{pedido.codigo || (pedido.seq_id?.toString() || '0').padStart(3, '0')}</span>
        </div>
        <div className="flex justify-between">
          <span>FECHA:</span> 
          <span>{new Date(pedido.creado_en).toLocaleDateString()} {new Date(pedido.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex justify-between">
          <span>CAJERO:</span> 
          <span className="uppercase">{pedido.cajero?.nombre || pedido.mesero?.nombre || pedido.usuarios?.nombre || 'SISTEMA'}</span>
        </div>
        <div className="flex justify-between py-1 border-y border-black/10 mt-1">
          <span className="font-bold uppercase italic">{pedido.canal === 'DOMICILIO' ? 'DOMICILIO' : `MESA ${pedido.mesa_id || ''}`}</span>
          <span className="font-bold">{pedido.nombre_cliente_dom || pedido.nombre_cliente || 'SALÓN'}</span>
        </div>
        {(pedido.notas || pedido.nota) && (
          <div className="py-2 border-b border-black/10">
            <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-600 mb-0.5">Observaciones:</p>
            <p className="text-[10px] italic leading-tight">{pedido.notas || pedido.nota}</p>
          </div>
        )}
      </div>

      {/* ── DETALLE PRODUCTOS ── */}
      <table className="w-full mb-4">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-1 w-8">CANT</th>
            <th className="py-1">DESCRIPCIÓN</th>
            <th className="py-1 text-right">SUBT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {pedido.detalle_pedido?.map((d, i) => (
            <tr key={i} className="align-top">
              <td className="py-1.5">{d.cantidad}</td>
              <td className="py-1.5">
                <div className="font-bold uppercase text-[10px]">{d.productos?.nombre}</div>
                {(d.notas || d.nota) && <p className="text-[8px] italic text-zinc-600">-- {d.notas || d.nota}</p>}
              </td>
              <td className="py-1.5 text-right">{formatCOP(d.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── TOTALES ── */}
      <div className="border-t border-black pt-3 space-y-1 mb-4">
        <div className="flex justify-between text-[13px] font-black italic">
          <span>TOTAL A PAGAR:</span> 
          <span>{formatCOP(pedido.total)}</span>
        </div>
        
        <div className="pt-2 text-[9px] space-y-0.5 opacity-80">
          <div className="flex justify-between">
            <span>FORMA DE PAGO:</span> 
            <span className="uppercase">{pedido.metodo_pago || 'EFECTIVO'}</span>
          </div>
          <div className="flex justify-between">
            <span>RECIBIDO:</span> 
            <span>{formatCOP(pedido.pago_cliente || pedido.total)}</span>
          </div>
          <div className="flex justify-between border-t border-black/5 pt-1">
            <span>CAMBIO:</span> 
            <span>{formatCOP(Math.max(0, (pedido.pago_cliente || 0) - (pedido.total || 0)))}</span>
          </div>
        </div>
      </div>

      {/* ── PIE DE PÁGINA ── */}
      <div className="text-center space-y-1">
         <p className="text-[9px] font-bold">¡GRACIAS POR SU PREFERENCIA!</p>
         <div className="flex justify-center items-center gap-2 py-1">
            <span className="h-[1px] bg-black/10 flex-1"></span>
            <span className="text-[7px] text-zinc-400 uppercase tracking-widest">Antigravity POS</span>
            <span className="h-[1px] bg-black/10 flex-1"></span>
         </div>
      </div>
    </div>
  );
});
