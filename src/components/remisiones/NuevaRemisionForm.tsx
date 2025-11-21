// components/remisiones/NuevaRemisionForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchAndCreateInput } from '@/components/ui/SearchAndCreateInput';
import { PersonaFormModal } from '@/components/personas/PersonaFormModal';
import { Save, Ban } from 'lucide-react';

// Tipos para los objetos que seleccionaremos
type Persona = { id_persona: number; nombre_completo: string; [key: string]: any };
type Vehiculo = { id_vehiculo: number; matricula: string; [key: string]: any };
type Predio = { id_predio: number; nombre_predio: string; [key: string]: any };

// Prop para el callback de éxito
interface NuevaRemisionFormProps {
  onSaveSuccess: (remision: any) => void;
}

export function NuevaRemisionForm({ onSaveSuccess }: NuevaRemisionFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    folio_progresivo: '',
    folio_autorizado: '',
    fecha_emision: new Date().toISOString().split('T')[0], // Default a hoy
    // IDs de las relaciones
    id_titular: null,
    id_predio_origen: null,
    id_remitente: null,
    id_destinatario: null,
    id_vehiculo: null,
    id_chofer: null,
    // Campos de texto para mostrar selección
    titular_nombre: '',
    predio_nombre: '',
    remitente_nombre: '',
    destinatario_nombre: '',
    vehiculo_matricula: '',
    chofer_nombre: '',
    // Datos del producto
    descripcion_producto_remision: 'Madera de Pino en rollo',
    genero_madera: 'Pino',
    cantidad_amparada: 0,
    saldo_disponible_anterior: 0,
    volumen_total_m3: 0,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para controlar qué modal está abierto
  const [modalState, setModalState] = useState({
    titular: false,
    remitente: false,
    destinatario: false,
    chofer: false,
    // (Añadir vehiculo y predio aquí cuando se implementen)
  });

  const getToken = () => localStorage.getItem('sessionToken');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const token = getToken();

    try {
      const response = await fetch('/api/remisiones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al guardar la remisión');
      }

      // Éxito
      alert('Remisión guardada con éxito.'); // Reemplazar con un toast
      onSaveSuccess(result);

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // ---- Funciones para manejar los modales y selecciones ----

  // Función genérica para abrir un modal
  const openModal = (tipo: keyof typeof modalState) => {
    setModalState(prev => ({ ...prev, [tipo]: true }));
  };

  // Función genérica para cerrar modales
  const closeModal = (tipo: keyof typeof modalState) => {
    setModalState(prev => ({ ...prev, [tipo]: false }));
  };

  // Función genérica para manejar el éxito de un modal de Persona
  const handlePersonaSaveSuccess = (nuevaPersona: Persona, tipo: 'titular' | 'remitente' | 'destinatario' | 'chofer') => {
    setFormData(prev => ({
      ...prev,
      [`id_${tipo}`]: nuevaPersona.id_persona,
      [`${tipo}_nombre`]: nuevaPersona.nombre_completo,
    }));
    closeModal(tipo);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* SECCIÓN 1: DATOS DEL DOCUMENTO */}
      <FormSection title="1. Datos del Documento">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Folio Progresivo (Físico)" name="folio_progresivo" value={formData.folio_progresivo} onChange={(e) => setFormData(prev => ({...prev, folio_progresivo: e.target.value}))} required />
          <Input label="Folio Autorizado (Opcional)" name="folio_autorizado" value={formData.folio_autorizado} onChange={(e) => setFormData(prev => ({...prev, folio_autorizado: e.target.value}))} />
          <Input label="Fecha de Emisión" name="fecha_emision" type="date" value={formData.fecha_emision} onChange={(e) => setFormData(prev => ({...prev, fecha_emision: e.target.value}))} required />
        </div>
      </FormSection>

      {/* SECCIÓN 2: TITULAR Y ORIGEN */}
      <FormSection title="2. Titular y Origen">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SearchAndCreateInput<Persona>
            label="Titular"
            placeholder="Buscar por nombre o RFC..."
            searchApiUrl="/api/personas"
            displayField="nombre_completo"
            // Mostrar el nombre seleccionado en el input
            inputValue={formData.titular_nombre}
            onInputChange={(value) => setFormData(prev => ({ ...prev, titular_nombre: value, id_titular: null }))}
            onSelect={(item) => setFormData(prev => ({ ...prev, id_titular: item.id_persona, titular_nombre: item.nombre_completo }))}
            onCreateNew={() => openModal('titular')}
          />
          <SearchAndCreateInput<Predio>
            label="Origen de la Materia (Predio)"
            placeholder="Buscar por nombre o clave RFN..."
            searchApiUrl="/api/predios"
            displayField="nombre_predio"
            inputValue={formData.predio_nombre}
            onInputChange={(value) => setFormData(prev => ({ ...prev, predio_nombre: value, id_predio_origen: null }))}
            onSelect={(item) => setFormData(prev => ({ ...prev, id_predio_origen: item.id_predio, predio_nombre: item.nombre_predio }))}
            onCreateNew={() => alert('Modal de Predio no implementado. Siga el ejemplo de Titular.')}
          />
        </div>
      </FormSection>

      {/* SECCIÓN 3: INFORMACIÓN DEL PRODUCTO */}
      <FormSection title="3. Información del Producto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Descripción Producto" name="descripcion_producto_remision" value={formData.descripcion_producto_remision} onChange={(e) => setFormData(prev => ({...prev, descripcion_producto_remision: e.target.value}))} />
          <Input label="Género Madera" name="genero_madera" value={formData.genero_madera} onChange={(e) => setFormData(prev => ({...prev, genero_madera: e.target.value}))} />
          <Input label="Volumen Total (m³)" name="volumen_total_m3" type="number" step="0.01" value={formData.volumen_total_m3} onChange={(e) => setFormData(prev => ({...prev, volumen_total_m3: parseFloat(e.target.value) || 0}))} />
        </div>
      </FormSection>

      {/* SECCIÓN 4: DESTINATARIO Y TRANSPORTE */}
      <FormSection title="4. Destinatario y Transporte">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SearchAndCreateInput<Persona>
            label="Remitente"
            placeholder="Buscar por nombre o RFC..."
            searchApiUrl="/api/personas"
            displayField="nombre_completo"
            inputValue={formData.remitente_nombre}
            onInputChange={(value) => setFormData(prev => ({ ...prev, remitente_nombre: value, id_remitente: null }))}
            onSelect={(item) => setFormData(prev => ({ ...prev, id_remitente: item.id_persona, remitente_nombre: item.nombre_completo }))}
            onCreateNew={() => openModal('remitente')}
          />
          <SearchAndCreateInput<Persona>
            label="Destinatario"
            placeholder="Buscar por nombre o RFC..."
            searchApiUrl="/api/personas"
            displayField="nombre_completo"
            inputValue={formData.destinatario_nombre}
            onInputChange={(value) => setFormData(prev => ({ ...prev, destinatario_nombre: value, id_destinatario: null }))}
            onSelect={(item) => setFormData(prev => ({ ...prev, id_destinatario: item.id_persona, destinatario_nombre: item.nombre_completo }))}
            onCreateNew={() => openModal('destinatario')}
          />
          <SearchAndCreateInput<Vehiculo>
            label="Vehículo (Placas)"
            placeholder="Buscar por matrícula..."
            searchApiUrl="/api/vehiculos"
            displayField="matricula"
            inputValue={formData.vehiculo_matricula}
            onInputChange={(value) => setFormData(prev => ({ ...prev, vehiculo_matricula: value, id_vehiculo: null }))}
            onSelect={(item) => setFormData(prev => ({ ...prev, id_vehiculo: item.id_vehiculo, vehiculo_matricula: item.matricula }))}
            onCreateNew={() => alert('Modal de Vehículo no implementado.')}
          />
          <SearchAndCreateInput<Persona>
            label="Chofer"
            placeholder="Buscar por nombre o RFC..."
            searchApiUrl="/api/personas"
            displayField="nombre_completo"
            inputValue={formData.chofer_nombre}
            onInputChange={(value) => setFormData(prev => ({ ...prev, chofer_nombre: value, id_chofer: null }))}
            onSelect={(item) => setFormData(prev => ({ ...prev, id_chofer: item.id_persona, chofer_nombre: item.nombre_completo }))}
            onCreateNew={() => openModal('chofer')}
          />
        </div>
      </FormSection>

      {/* BOTONES DE ACCIÓN */}
      <div className="border-t pt-6 flex justify-end gap-4">
        {error && <p className="text-red-600 text-sm">Error: {error}</p>}
        <button
          type="button"
          onClick={() => router.back()}
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
          {isSaving ? 'Guardando...' : 'Guardar Remisión'}
        </button>
      </div>

      {/* MODALES */}
      <PersonaFormModal
        isOpen={modalState.titular}
        onClose={() => closeModal('titular')}
        onSaveSuccess={(nuevaPersona) => handlePersonaSaveSuccess(nuevaPersona, 'titular')}
        modalTitle="Añadir Nuevo Titular"
      />
      <PersonaFormModal
        isOpen={modalState.remitente}
        onClose={() => closeModal('remitente')}
        onSaveSuccess={(nuevaPersona) => handlePersonaSaveSuccess(nuevaPersona, 'remitente')}
        modalTitle="Añadir Nuevo Remitente"
      />
      <PersonaFormModal
        isOpen={modalState.destinatario}
        onClose={() => closeModal('destinatario')}
        onSaveSuccess={(nuevaPersona) => handlePersonaSaveSuccess(nuevaPersona, 'destinatario')}
        modalTitle="Añadir Nuevo Destinatario"
      />
      <PersonaFormModal
        isOpen={modalState.chofer}
        onClose={() => closeModal('chofer')}
        onSaveSuccess={(nuevaPersona) => handlePersonaSaveSuccess(nuevaPersona, 'chofer')}
        modalTitle="Añadir Nuevo Chofer"
      />
      {/* (Añadir modales de Vehiculo y Predio aquí) */}
    </form>
  );
}

// Componentes de UI simples (puedes moverlos a su propio archivo)
const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <fieldset className="border-t pt-6">
    <legend className="text-lg font-semibold text-gray-700 mb-4">{title}</legend>
    {children}
  </fieldset>
);

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