// src/components/cajero/GenerarFactura.jsx
// Genera y muestra la factura en un modal para impresión o descarga PDF
import { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '../ui/Button';
import { formatCOP } from '../../lib/utils';

export default function GenerarFactura({ pedido, onClose }) {
  const facturaRef = useRef();

  async function descargarPDF() {
    const canvas = await html2canvas(facturaRef.current, { backgroundColor: '#ffffff', scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 200] });
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, w, h);
    pdf.save(`factura-${pedido.codigo}.pdf`);
  }

  function imprimir() {
    window.print();
  }

  const fecha = new Date(pedido.creado_en || Date.now());

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-bg-surface border border-bg-border rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh]">
        {/* Acciones */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border">
          <h2 className="text-white font-black">Vista Previa Factura</h2>
          <div className="flex gap-2">
            <Button variant="dark" size="sm" onClick={imprimir}>🖨️ Imprimir</Button>
            <Button size="sm" onClick={descargarPDF}>⬇ PDF</Button>
            <button onClick={onClose} className="text-zinc-500 hover:text-white ml-1">✕</button>
          </div>
        </div>

        {/* Factura para imprimir */}
        <div className="flex-1 overflow-y-auto p-4">
          <div
            ref={facturaRef}
            style={{ fontFamily: 'monospace', fontSize: '12px', color: '#000', background: '#fff', padding: '16px', lineHeight: 1.5 }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <p style={{ fontSize: '16px', fontWeight: 'bold' }}>🍔 RESTAURANTE</p>
              <p>Tel: (604) 000-0000</p>
              <p>Medellín, Colombia</p>
            </div>
            <hr style={{ borderColor: '#000', margin: '8px 0' }} />

            <p><strong>FACTURA DE VENTA</strong></p>
            <p>No: {pedido.codigo}</p>
            <p>Fecha: {fecha.toLocaleDateString('es-CO')}</p>
            <p>Hora: {fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
            <p>Cajero: {(pedido.cajero?.nombre || pedido.mesero?.nombre || pedido.usuarios?.nombre || 'SISTEMA').toUpperCase()}</p>
            {pedido.canal === 'MESA' && <p>Mesa: {pedido.mesa_id}</p>}
            {pedido.nombre_cliente && <p>Cliente: {pedido.nombre_cliente}</p>}
            <hr style={{ borderColor: '#000', margin: '8px 0' }} />

            {/* Ítems */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>CANT</th>
                  <th style={{ textAlign: 'left' }}>PRODUCTO</th>
                  <th style={{ textAlign: 'right' }}>SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                {(pedido.detalle_pedido || []).map((d, i) => (
                  <tr key={i}>
                    <td style={{ verticalAlign: 'top' }}>{d.cantidad}</td>
                    <td>
                      <div>{d.productos?.nombre}</div>
                      {d.notes && <div style={{ color: '#666', fontSize: '10px' }}>({d.notes})</div>}
                    </td>
                    <td style={{ textAlign: 'right', verticalAlign: 'top' }}>{formatCOP(d.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr style={{ borderColor: '#000', margin: '8px 0' }} />

            {pedido.costo_domicilio > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Domicilio:</span><span>{formatCOP(pedido.costo_domicilio)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
              <span>TOTAL:</span><span>{formatCOP(pedido.total)}</span>
            </div>
            <p>Forma de pago: {pedido.metodo_pago}</p>
            {pedido.metodo_pago === 'EFECTIVO' && (
              <>
                <p>Pagó: {formatCOP(pedido.pago_cliente)}</p>
                <p>Cambio: {formatCOP(pedido.cambio)}</p>
              </>
            )}
            <hr style={{ borderColor: '#000', margin: '8px 0' }} />
            <p style={{ textAlign: 'center' }}>¡Gracias por su visita!</p>
            <p style={{ textAlign: 'center', fontSize: '10px' }}>Conserve su factura para reclamaciones</p>
          </div>
        </div>
      </div>
    </div>
  );
}
