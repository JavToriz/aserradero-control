'use client';

import { useState, useEffect } from 'react';
import { ModalContainer } from '@/components/ui/ModalContainer';
import { SuccessActionModal } from '@/components/ui/SuccessActionModal'; 
import { Save, Ban, Ruler } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  remision: { id_remision: number; folio_progresivo: string; volumen_total_m3: number; m3_recibidos_aserradero?: number } | null;
  onSuccess: () => void;
}

export function ModalMedidaReal({ isOpen, onClose, remision, onSuccess }: ModalProps) {
  const [medidaReal, setMedidaReal] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && remision) {
      const valorInicial = (remision.m3_recibidos_aserradero && remision.m3_recibidos_aserradero > 0)
        ? remision.m3_recibidos_aserradero
        : remision.volumen_total_m3;
      
      setMedidaReal(String(Number(valorInicial)));
      setShowSuccess(false); // Reiniciar estado al abrir
    }
  }, [isOpen, remision]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('sessionToken');

    if (!remision) return;

    try {
      const res = await fetch(`/api/remisiones/${remision.id_remision}/medida`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ m3_recibidos_aserradero: medidaReal })
      });

      if (!res.ok) throw new Error('Error al guardar');
      
      setShowSuccess(true); 

    } catch (error) {
      alert("No se pudo guardar la medición.");
    } finally {
      setIsSaving(false);
    }
  };

  // Función que se ejecuta al dar click en "Aceptar" en el modal de éxito
  const handleSuccessClose = () => {
    setShowSuccess(false);
    onSuccess(); // Recargar la tabla
    onClose();   // Cerrar el modal principal
  };

  // Helper para formato visual
  const formatVisual = (num: number) => {
    return Number(num).toLocaleString('es-MX', { maximumFractionDigits: 3 });
  };

  if (!remision) return null;

  return (
    <>
      {/* Modal Principal (Formulario) */}
      {/* CORRECCIÓN: Renderizado condicional con llaves en lugar de pasar prop 'isOpen' */}
      {(isOpen && !showSuccess) && (
        <ModalContainer 
          title={`Medición Real: ${remision.folio_progresivo}`} 
          onClose={onClose}
        >
          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
              <p className="text-sm text-gray-600">Volumen Documentado (Nota)</p>
              <p className="text-2xl font-bold text-blue-800">{formatVisual(remision.volumen_total_m3)} m³</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volumen Medido en Patio (m³)
              </label>
              <div className="flex items-center gap-2 relative">
                <Ruler className="text-gray-400 absolute left-3" />
                <input
                  type="number"
                  step="0.001"
                  className="w-full border rounded-lg pl-10 pr-3 py-3 text-xl font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0"
                  value={medidaReal}
                  onChange={(e) => setMedidaReal(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Si no hubo diferencia, deja el valor por defecto.
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-2">
              <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-200">
                <Ban size={18} /> Cancelar
              </button>
              <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-blue-700 shadow-md">
                <Save size={18} /> {isSaving ? 'Guardando...' : 'Confirmar Medida'}
              </button>
            </div>
          </form>
        </ModalContainer>
      )}

      {/* Modal de Éxito (Feedback Visual) */}
      <SuccessActionModal 
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        title="¡Medida Actualizada!"
        message={`Se ha registrado correctamente la medida de ${formatVisual(Number(medidaReal))} m³ para esta remisión.`}
        buttonText="Entendido"
      />
    </>
  );
}