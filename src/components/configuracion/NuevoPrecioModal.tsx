// components/configuracion/NuevoPrecioModal.tsx
'use client';

import { useState } from 'react';
import { ModalContainer } from '@/components/ui/ModalContainer';
import { SuccessActionModal } from '@/components/ui/SuccessActionModal';
import { ErrorActionModal } from '@/components/ui/ErrorActionModal'; 
import { Save, Ban } from 'lucide-react';

interface NuevoPrecioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

// Opciones predefinidas para facilitar la captura (puedes añadir más)
const ESPECIES = ['Pino', 'Oyamel', 'Ayacahuite', 'Sabino', 'Polin', 'Costera', 'Cedro', 'Barrote'];
const CALIDADES = ['Primera', 'Segunda', 'Tercera', 'Costera'];

export function NuevoPrecioModal({ isOpen, onClose, onSaveSuccess }: NuevoPrecioModalProps) {
  const [especie, setEspecie] = useState('Pino');
  const [calidad, setCalidad] = useState('Primera');
  const [precio, setPrecio] = useState(''); 
  const [precioMayoreo, setPrecioMayoreo] = useState(''); 
  const [isSaving, setIsSaving] = useState(false);

  // Estados para modales de feedback
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState({ open: false, message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('sessionToken');

    try {
      const res = await fetch('/api/precios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          especie,
          calidad,
          precio_por_pt: parseFloat(precio),
          precio_mayoreo_por_pt: precioMayoreo ? parseFloat(precioMayoreo) : null
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al guardar');
      }

      // Éxito: Mostramos el modal verde
      setShowSuccess(true);

    } catch (error: any) {
      // Error: Mostramos el modal rojo
      setShowError({ 
        open: true, 
        message: error.message || 'No se pudo crear el precio base.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onSaveSuccess(); // Recargar tabla padre
    onClose();       // Cerrar este modal
    
    // Resetear campos
    setPrecio('');
    setPrecioMayoreo('');
    setEspecie('Pino');
    setCalidad('Primera');
  };

  if (!isOpen && !showSuccess && !showError.open) return null;

  return (
    <>
      {/* Modal Principal (Formulario) */}
      <ModalContainer title="Agregar Nuevo Precio Base" isOpen={isOpen} onClose={onClose}>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especie</label>
            <div className="flex gap-2">
              <select 
                className="w-full border rounded px-3 py-2"
                value={especie}
                onChange={(e) => setEspecie(e.target.value)}
              >
                {ESPECIES.map(e => <option key={e} value={e}>{e}</option>)}
                <option value="OTRA">Otra (Escribir manual)</option>
              </select>
              {especie === 'OTRA' && (
                 <input 
                   className="w-full border rounded px-3 py-2"
                   placeholder="Escribe la especie..."
                   onChange={(e) => setEspecie(e.target.value)} 
                 />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calidad</label>
            <select 
              className="w-full border rounded px-3 py-2"
              value={calidad}
              onChange={(e) => setCalidad(e.target.value)}
            >
              {CALIDADES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">Precio Público (PT)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                <input 
                  type="number"
                  step="0.01"
                  className="w-full border border-blue-300 rounded px-3 py-2 pl-8 font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.00"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">Precio Mayoreo (PT)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                <input 
                  type="number"
                  step="0.01"
                  className="w-full border border-green-300 rounded px-3 py-2 pl-8 font-bold text-gray-800 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Opcional"
                  value={precioMayoreo}
                  onChange={(e) => setPrecioMayoreo(e.target.value)}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded">
            <strong>Tip:</strong> El precio por Pie Tablar (PT) es la base. El sistema multiplicará este valor por el volumen de la madera.
          </p>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button type="button" onClick={onClose} className="bg-gray-100 px-4 py-2 rounded flex items-center gap-2">
              <Ban size={18} /> Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
              <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Precio'}
            </button>
          </div>

        </form>
      </ModalContainer>

      {/* --- MODALES DE FEEDBACK ESTANDARIZADOS --- */}
      
      <SuccessActionModal 
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        title="¡Precio Creado!"
        message={`Se ha registrado correctamente el precio base para ${especie} - ${calidad}.`}
        buttonText="Aceptar"
      />

      <ErrorActionModal 
        isOpen={showError.open}
        onClose={() => setShowError({ ...showError, open: false })}
        title="Error al Guardar, intenta de nuevo"
        message={showError.message}
        buttonText="Entendido"
      />
    </>
  );
}