import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { FacturaPDF } from './FacturaPDF';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function FacturaModal({ open, onClose, pedido }) {
  const facturaRef = useRef();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showWSPanel, setShowWSPanel] = useState(false);
  const [wsNumber, setWsNumber] = useState(pedido?.telefono_cliente || '');

  const { data: config } = useQuery({
    queryKey: ['configuracion_global'],
    queryFn: async () => {
      const { data } = await supabase.from('configuracion').select('*');
      return data || [];
    }
  });

  if (!pedido) return null;

  // 1. DESCARGAR PDF (80mm)
  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(facturaRef.current, {
        scale: 2, // Mayor calidad
        logging: false,
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [80, 160] // Formato común de ticket
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Factura-${pedido.codigo || pedido.id.slice(-4)}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. IMPRIMIR (Nativo del Navegador con CSS @media print)
  const handlePrint = () => {
    window.print();
  };

  // 3. WHATSAPP (Imagen + Chat)
  const handleWhatsApp = async () => {
    if (!wsNumber) return;
    setIsGenerating(true);
    try {
      // Descargar imagen para que el cajero la adjunte
      const canvas = await html2canvas(facturaRef.current, { scale: 2 });
      const link = document.createElement('a');
      link.download = `Factura-${pedido.codigo || pedido.id.slice(-4)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Abrir WhatsApp Web
      const message = encodeURIComponent(`Hola, adjuntamos la factura de tu pedido #${pedido.codigo || pedido.id.slice(-4)}. ¡Gracias por tu compra!`);
      window.open(`https://wa.me/57${wsNumber.replace(/\s/g, '')}?text=${message}`, '_blank');
      setShowWSPanel(false);
    } catch (error) {
      console.error('Error WhatsApp:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[400px] bg-[#0A0A0A] border-white/5 p-0 overflow-hidden rounded-[10px]">
        
        {/* Estilos para impresión */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * { visibility: hidden; background: white !important; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 80mm !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print { display: none !important; }
          }
        `}} />

        <DialogHeader className="p-4 border-b border-white/5 bg-zinc-900/30 no-print">
          <DialogTitle className="text-white font-black text-lg tracking-tight uppercase italic flex items-center gap-3">
             <div className="w-7 h-7 bg-[#FFC107]/10 rounded-lg flex items-center justify-center text-[#FFC107]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
             </div>
             Factura de Venta
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 no-print">
          {/* Vista previa con fondo claro para simular papel */}
          <div className="bg-white rounded-xl p-3 max-h-[280px] overflow-y-auto custom-scrollbar shadow-inner mb-4 print-area scrollbar-hide">
             <FacturaPDF ref={facturaRef} pedido={pedido} config={config} />
          </div>

          {!showWSPanel ? (
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handlePrint}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold h-10 rounded-[8px] flex items-center gap-2 border border-white/5 text-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Imprimir
              </Button>
              <Button 
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold h-10 rounded-[8px] flex items-center gap-2 border border-white/5 text-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {isGenerating ? '...' : 'PDF'}
              </Button>
              <Button 
                onClick={() => setShowWSPanel(true)}
                className="col-span-2 bg-[#22C55E] hover:bg-[#16a34a] text-white font-black uppercase text-[10px] tracking-widest h-11 rounded-[8px] flex items-center justify-center gap-2 shadow-lg shadow-[#22C55E]/10 mt-1"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </Button>
            </div>
          ) : (
            <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
               <div className="space-y-1">
                  <label className="text-zinc-500 text-[9px] font-black uppercase tracking-widest ml-1">Número de WhatsApp</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={wsNumber}
                    onChange={e => setWsNumber(e.target.value)}
                    placeholder="300 000 0000"
                    className="w-full h-10 bg-zinc-900 border border-white/5 rounded-lg px-4 text-sm text-white placeholder-zinc-800 focus:outline-none focus:border-[#22C55E]/40 transition-all font-medium"
                  />
               </div>
               <div className="flex gap-2">
                  <Button onClick={() => setShowWSPanel(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 h-9 text-[9px] font-black uppercase tracking-widest">Cancelar</Button>
                  <Button onClick={handleWhatsApp} disabled={!wsNumber || isGenerating} className="flex-1 bg-[#22C55E] hover:bg-[#16a34a] h-9 text-[9px] font-black uppercase tracking-widest">Enviar</Button>
               </div>
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
