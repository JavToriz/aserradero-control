'use client';

import { useState, useEffect } from 'react';
import { ModalContainer } from '@/components/ui/ModalContainer';
import { NotaVentaImprimible, DatosEmpresaNota } from './NotaVentaImprimible';
import { Printer, X, Loader2 } from 'lucide-react';

interface ImprimirNotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  venta: any; 
}

export const ImprimirNotaModal = ({ isOpen, onClose, venta }: ImprimirNotaModalProps) => {
  const [empresaConfig, setEmpresaConfig] = useState<DatosEmpresaNota | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const fetchConfig = async () => {
        try {
          // CORRECCIÓN: 'sessionToken'
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
        
        <div className="border rounded bg-gray-100 p-4 overflow-auto max-h-[60vh] flex justify-center items-center min-h-[300px]">
           
           {loading && <Loader2 className="animate-spin text-blue-600 w-10 h-10" />}

           {!loading && empresaConfig && (
             <div className="bg-white shadow-sm mx-auto" style={{ width: '800px', maxWidth: '100%' }}> 
               <NotaVentaImprimible datos={datosFormateados} empresa={empresaConfig} />
             </div>
           )}

           {!loading && !empresaConfig && (
              <p className="text-red-500 font-bold">Error: No se pudo cargar la configuración del aserradero.</p>
           )}
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
            disabled={loading || !empresaConfig}
            className="bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50"
          >
            <Printer size={20} /> Imprimir / Guardar como PDF
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};