// components/ventas/ImprimirNotaModal.tsx
'use client';

import { ModalContainer } from '@/components/ui/ModalContainer';
import { NotaVentaImprimible } from './NotaVentaImprimible';
import { Printer, X } from 'lucide-react';

interface ImprimirNotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  venta: any; 
}

export const ImprimirNotaModal = ({ isOpen, onClose, venta }: ImprimirNotaModalProps) => {
  if (!isOpen || !venta) return null;

  const datosFormateados = {
    folio_nota: venta.folio_nota,
    fecha_salida: venta.fecha_salida,
    cliente: venta.cliente,
    vehiculo: venta.vehiculo,
    total_venta: Number(venta.total_venta),
    quien_expide: venta.quien_expide || venta.usuario?.nombre_completo || "Administración", 
    detalles: venta.detalles.map((d: any) => ({
      cantidad: d.cantidad_piezas,
      precio_unitario: Number(d.precio_unitario_venta),
      importe: Number(d.importe_linea),
      producto: d.producto,
      genero: d.producto.atributos_madera?.genero || d.producto.atributos_triplay?.genero || '',
      medidas: d.producto.descripcion 
    }))
  };

  return (
    <ModalContainer title={`Nota de Venta: ${venta.folio_nota}`} onClose={onClose}>
      <div className="space-y-6">
        
        {/* Contenedor visual */}
        <div className="border rounded bg-gray-100 p-4 overflow-auto max-h-[60vh] flex justify-center">
           <div className="bg-white shadow-sm mx-auto" style={{ width: '800px', maxWidth: '100%' }}> 
             <NotaVentaImprimible datos={datosFormateados} />
           </div>
        </div>

        <div className="flex justify-center gap-4 pt-2 border-t">
          <button 
            onClick={onClose} 
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-300 transition-colors"
          >
            <X size={18} /> Cerrar
          </button>

          <button 
            onClick={() => window.print()} 
            className="bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-blue-700 shadow-md transition-colors"
          >
            <Printer size={20} /> Imprimir / Guardar como PDF
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};