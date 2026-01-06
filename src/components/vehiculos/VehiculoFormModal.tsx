'use client';

import { useState, useEffect } from 'react';
import { Truck, Save, Ban } from 'lucide-react';
import { ModalContainer } from '@/components/ui/ModalContainer';

interface VehiculoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (nuevoVehiculo: any) => void;
  modalTitle?: string;
}

const initialState = {
  matricula: '',
  marca: '',
  modelo: '',
  tipo: '',
  capacidad_carga_toneladas: '',
  propietario: ''
};

export function VehiculoFormModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  modalTitle = "Nuevo Vehículo" 
}: VehiculoFormModalProps) {

  const [formData, setFormData] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Limpiar formulario al cerrar/abrir
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
            capacidad_carga_toneladas: formData.capacidad_carga_toneladas ? parseFloat(formData.capacidad_carga_toneladas) : 0,
            propietario: formData.propietario.trim() || undefined
        };

        const res = await fetch('/api/vehiculos', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'No se pudo crear el vehículo.');
        }

        // ÉXITO: Llamamos directamente a onSuccess con la data creada
        // Esto dispara handleVehiculoSave en el padre, actualizando el input y cerrando el modal.
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
      icon={<Truck size={24} className="text-orange-600"/>}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Matrícula (Placas) *</label>
              <input 
                  required 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 uppercase focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                  value={formData.matricula} 
                  onChange={e => setFormData({...formData, matricula: e.target.value})} 
                  placeholder="Ej. ABC-123" 
              />
          </div>
          <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Propietario (Opcional)</label>
              <input 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                  value={formData.propietario} 
                  onChange={e => setFormData({...formData, propietario: e.target.value})} 
                  placeholder="Dueño o Empresa" 
              />
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Marca</label>
                  <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                      value={formData.marca} 
                      onChange={e => setFormData({...formData, marca: e.target.value})} 
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Modelo</label>
                  <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                      value={formData.modelo} 
                      onChange={e => setFormData({...formData, modelo: e.target.value})} 
                  />
              </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Tipo</label>
                  <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                      value={formData.tipo} 
                      onChange={e => setFormData({...formData, tipo: e.target.value})} 
                      placeholder="Ej. Rabón" 
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Capacidad (Ton)</label>
                  <input 
                      type="number" 
                      step="0.1" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                      value={formData.capacidad_carga_toneladas} 
                      onChange={e => setFormData({...formData, capacidad_carga_toneladas: e.target.value})} 
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