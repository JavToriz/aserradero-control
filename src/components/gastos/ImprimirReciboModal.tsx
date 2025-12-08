// components/gastos/ImprimirReciboModal.tsx
'use client';

import { ModalContainer } from '@/components/ui/ModalContainer';
import { ReciboGastoImprimible } from './ReciboGastoImprimible';
import { Printer, X } from 'lucide-react';

interface ImprimirReciboModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasto: any; 
}

export const ImprimirReciboModal = ({ isOpen, onClose, gasto }: ImprimirReciboModalProps) => {
  if (!isOpen || !gasto) return null;

  // Formatear datos para el componente de impresión
  const datosFormateados = {
    folio_recibo: gasto.folio_recibo, // Si lo tienes en BD
    fecha_emision: gasto.fecha_emision,
    beneficiario: gasto.beneficiario?.nombre_completo || "Desconocido",
    monto: Number(gasto.monto),
    monto_letra: gasto.monto_letra,
    concepto_general: gasto.concepto_general,
    concepto_detalle: gasto.concepto_detalle,
    responsable: gasto.responsable_entrega?.nombre_completo || "Administración",
  };

  return (
    <ModalContainer title="Vista Previa del Recibo" onClose={onClose}>
      <div className="space-y-6">
        <div className="border rounded bg-gray-100 p-4 overflow-auto max-h-[60vh] flex justify-center">
           <div className="bg-white shadow-sm mx-auto" style={{ width: '800px', maxWidth: '100%' }}> 
             <ReciboGastoImprimible datos={datosFormateados} />
           </div>
        </div>

        <div className="flex justify-center gap-4 pt-2 border-t">
          <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-300">
            <X size={18} /> Cerrar
          </button>
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-blue-700 shadow-md">
            <Printer size={20} /> Imprimir
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};