'use client';

import { useState, useEffect } from 'react';
import { ModalContainer } from '@/components/ui/ModalContainer';
import { ReciboGastoImprimible, DatosEmpresaRecibo } from './ReciboGastoImprimible';
import { Printer, X, Loader2 } from 'lucide-react';

interface ImprimirReciboModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasto: any; 
}

export const ImprimirReciboModal = ({ isOpen, onClose, gasto }: ImprimirReciboModalProps) => {
  const [empresaConfig, setEmpresaConfig] = useState<DatosEmpresaRecibo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const fetchConfig = async () => {
        try {
          // CORRECCIÓN: Usamos 'sessionToken' igual que en tu NuevaVentaForm
          const token = localStorage.getItem('sessionToken'); 
          
          if (!token) {
             console.error("No se encontró sessionToken");
             setLoading(false);
             return;
          }

          const res = await fetch('/api/configuracion/aserradero', {
             headers: { 'Authorization': `Bearer ${token}` }
          });

          if (res.ok) {
            const data = await res.json();
            setEmpresaConfig(data);
          } else {
            console.error("Error al cargar config aserradero");
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };

      fetchConfig();
    }
  }, [isOpen]);

  if (!isOpen || !gasto) return null;

  // Formatear datos para el componente de impresión
  const datosFormateados = {
    folio_recibo: gasto.folio_recibo, 
    fecha_emision: gasto.fecha_emision,
    beneficiario: gasto.beneficiario?.nombre_completo || "Desconocido",
    monto: Number(gasto.monto),
    // monto_letra: se calcula dentro del componente
    concepto_general: gasto.concepto_general,
    concepto_detalle: gasto.concepto_detalle,
    responsable: gasto.responsable_entrega?.nombre_completo || "Administración",
  };

  return (
    <ModalContainer title="Vista Previa del Recibo" onClose={onClose}>
      <div className="space-y-6">
        <div className="border rounded bg-gray-100 p-4 overflow-auto max-h-[60vh] flex justify-center items-center min-h-[300px]">
           
           {/* Loading State */}
           {loading && <Loader2 className="animate-spin text-blue-600 w-10 h-10" />}

           {/* Componente Imprimible con datos de BD */}
           {!loading && empresaConfig && (
             <div className="bg-white shadow-sm mx-auto" style={{ width: '800px', maxWidth: '100%' }}> 
               <ReciboGastoImprimible datos={datosFormateados} empresa={empresaConfig} />
             </div>
           )}

           {/* Error State */}
           {!loading && !empresaConfig && (
             <p className="text-red-500 font-bold">Error: No se pudo cargar la configuración del aserradero.</p>
           )}
        </div>

        <div className="flex justify-center gap-4 pt-2 border-t">
          <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-300">
            <X size={18} /> Cerrar
          </button>
          <button 
            onClick={() => window.print()} 
            disabled={loading || !empresaConfig}
            className="bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-blue-700 shadow-md disabled:opacity-50"
          >
            <Printer size={20} /> Imprimir
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};