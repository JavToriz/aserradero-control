'use client';

import { useState, useEffect } from 'react';
import { MapPin, Save, Ban } from 'lucide-react';
import { ModalContainer } from '@/components/ui/ModalContainer';

interface PredioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (nuevoPredio: any) => void;
  modalTitle?: string;
}

const initialState = {
  nombre_predio: '',
  clave_rfn: '',
  municipio: '',
  entidad: ''
};

export function PredioFormModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  modalTitle = "Nuevo Predio" 
}: PredioFormModalProps) {

  const [formData, setFormData] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Limpiar el formulario cuando se abre/cierra
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialState);
      setError(null);
    }
  }, [isOpen]);

  // SEGURIDAD: Evita renderizado si no está abierto
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
        const token = localStorage.getItem('sessionToken');
        
        const payload = {
            ...formData,
            clave_rfn: formData.clave_rfn.trim() || undefined
        };

        const res = await fetch('/api/predios', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'No se pudo crear el predio.');
        }

        // ÉXITO: Inmediato.
        // Esto envía la data al padre, el cual seleccionará el item y cerrará este modal automáticamente.
        onSuccess(data);

    } catch (err: any) { 
        console.error(err); 
        setError(err.message || 'Error de conexión.');
    } finally { 
        setIsSaving(false); 
    }
  };

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      icon={<MapPin size={24} className="text-green-600"/>}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Nombre del Predio *</label>
              <input 
                  required 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                  value={formData.nombre_predio} 
                  onChange={e => setFormData({...formData, nombre_predio: e.target.value})} 
                  placeholder="Ej. Las Cumbres"
              />
          </div>
          <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Clave RFN</label>
              <input 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 uppercase focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                  value={formData.clave_rfn} 
                  onChange={e => setFormData({...formData, clave_rfn: e.target.value})} 
                  placeholder="Opcional"
              />
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Municipio</label>
                  <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                      value={formData.municipio} 
                      onChange={e => setFormData({...formData, municipio: e.target.value})} 
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Entidad</label>
                  <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                      value={formData.entidad} 
                      onChange={e => setFormData({...formData, entidad: e.target.value})} 
                  />
              </div>
          </div>

          <div className="border-t pt-4 flex justify-end gap-4 mt-4">
              {error && <p className="text-red-600 text-sm flex items-center">Error: {error}</p>}
              
              <button 
                  type="button" 
                  onClick={onClose} 
                  disabled={isSaving}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                  <Ban size={18} />
                  Cancelar
              </button>
              
              <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                  <Save size={18} />
                  {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
          </div>
      </form>
    </ModalContainer>
  );
}