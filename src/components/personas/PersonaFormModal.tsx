// components/personas/PersonaFormModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { ModalContainer } from '@/components/ui/ModalContainer'; // Asumo que tienes este componente
import { Save, Ban } from 'lucide-react';

// Definimos los tipos para las props
interface PersonaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (nuevaPersona: any) => void;
  modalTitle?: string;
}

// Tipo para los datos del formulario
type PersonaFormData = {
  nombre_completo: string;
  rfc: string;
  curp: string;
  telefono: string;
  domicilio_calle: string;
  domicilio_poblacion: string;
  domicilio_municipio: string;
  domicilio_entidad: string;
};

const initialState: PersonaFormData = {
  nombre_completo: '',
  rfc: '',
  curp: '',
  telefono: '',
  domicilio_calle: '',
  domicilio_poblacion: '',
  domicilio_municipio: '',
  domicilio_entidad: '',
};

export function PersonaFormModal({ 
  isOpen, 
  onClose, 
  onSaveSuccess, 
  modalTitle = "Crear Nueva Persona" 
}: PersonaFormModalProps) {
  
  const [formData, setFormData] = useState<PersonaFormData>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Limpiar el formulario cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialState);
      setError(null);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getToken = () => localStorage.getItem('sessionToken');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const token = getToken();

    try {
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al guardar la persona');
      }

      // Éxito
      onSaveSuccess(result); // Devuelve la nueva persona al formulario padre

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // Asumimos que ModalContainer es un componente que ya tienes
  return (
    <ModalContainer title={modalTitle} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        
        <h3 className="text-md font-semibold text-gray-700">Información Personal</h3>
        <Input label="Nombre Completo" name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="RFC (Opcional)" name="rfc" value={formData.rfc} onChange={handleChange} />
          <Input label="CURP (Opcional)" name="curp" value={formData.curp} onChange={handleChange} />
        </div>
        <Input label="Teléfono (Opcional)" name="telefono" value={formData.telefono} onChange={handleChange} />
        
        <h3 className="text-md font-semibold text-gray-700 pt-4 border-t">Domicilio (Opcional)</h3>
        <Input label="Calle y Número" name="domicilio_calle" value={formData.domicilio_calle} onChange={handleChange} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Población/Colonia" name="domicilio_poblacion" value={formData.domicilio_poblacion} onChange={handleChange} />
          <Input label="Municipio" name="domicilio_municipio" value={formData.domicilio_municipio} onChange={handleChange} />
          <Input label="Entidad" name="domicilio_entidad" value={formData.domicilio_entidad} onChange={handleChange} />
        </div>

        {/* Botones de acción del modal */}
        <div className="border-t pt-4 flex justify-end gap-4">
          {error && <p className="text-red-600 text-sm">Error: {error}</p>}
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
            {isSaving ? 'Guardando...' : 'Guardar Persona'}
          </button>
        </div>
      </form>
    </ModalContainer>
  );
}

// Componente Input simple para el modal (puedes reutilizar el del otro archivo)
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
const Input: React.FC<InputProps> = ({ label, ...props }) => (
  <div className="w-full">
    <label htmlFor={props.name} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      id={props.name}
      {...props}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);