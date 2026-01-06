'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchAndCreateInput } from '@/components/ui/SearchAndCreateInput';
import { PersonaFormModal } from '@/components/personas/PersonaFormModal';
import { VehiculoFormModal } from '@/components/vehiculos/VehiculoFormModal';
import { PredioFormModal } from '@/components/predios/PredioFormModal';
import { Save, Ban } from 'lucide-react';

type Persona = { id_persona: number; nombre_completo: string; [key: string]: any };
type Vehiculo = { id_vehiculo: number; matricula: string; [key: string]: any };
type Predio = { id_predio: number; nombre_predio: string; [key: string]: any };

interface NuevaRemisionFormProps {
  onSaveSuccess?: (remision: any) => void;
}

const STORAGE_KEY = 'remision_draft';

export function NuevaRemisionForm({ onSaveSuccess }: NuevaRemisionFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    folio_progresivo: '',
    folio_autorizado: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    id_titular: null,
    id_predio_origen: null,
    id_remitente: null,
    id_destinatario: null,
    id_vehiculo: null,
    id_chofer: null,
    titular_nombre: '',
    predio_nombre: '',
    remitente_nombre: '',
    destinatario_nombre: '',
    vehiculo_matricula: '',
    chofer_nombre: '',
    descripcion_producto_remision: 'Madera de Pino en rollo',
    genero_madera: 'Pino',
    cantidad_amparada: 0,
    saldo_disponible_anterior: 0,
    volumen_total_m3: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) try { setFormData(prev => ({ ...prev, ...JSON.parse(saved) })); } catch (e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const [isSaving, setIsSaving] = useState(false);
  const [modalState, setModalState] = useState({
    titular: false,
    remitente: false,
    destinatario: false,
    chofer: false,
    vehiculo: false,
    predio: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('sessionToken');

    try {
      const response = await fetch('/api/remisiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Error al guardar');

      localStorage.removeItem(STORAGE_KEY);
      alert('Remisión guardada con éxito.');
      if(onSaveSuccess) onSaveSuccess(result);
      else router.push('/remisiones');

    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const openModal = (tipo: keyof typeof modalState) => setModalState(prev => ({ ...prev, [tipo]: true }));
  const closeModal = (tipo: keyof typeof modalState) => setModalState(prev => ({ ...prev, [tipo]: false }));

  const handlePersonaSaveSuccess = (p: Persona, tipo: 'titular' | 'remitente' | 'destinatario' | 'chofer') => {
    setFormData(prev => ({ ...prev, [`id_${tipo}`]: p.id_persona, [`${tipo}_nombre`]: p.nombre_completo }));
    closeModal(tipo);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        
        <FormSection title="1. Datos del Documento">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Folio Progresivo (Físico)" name="folio_progresivo" value={formData.folio_progresivo} onChange={(e) => setFormData(prev => ({...prev, folio_progresivo: e.target.value}))} required />
            <Input label="Folio Autorizado (Opcional)" name="folio_autorizado" value={formData.folio_autorizado} onChange={(e) => setFormData(prev => ({...prev, folio_autorizado: e.target.value}))} />
            <Input label="Fecha de Emisión" name="fecha_emision" type="date" value={formData.fecha_emision} onChange={(e) => setFormData(prev => ({...prev, fecha_emision: e.target.value}))} required />
          </div>
        </FormSection>

        <FormSection title="2. Titular y Origen">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SearchAndCreateInput<Persona>
              label="Titular" searchApiUrl="/api/personas" displayField="nombre_completo" inputValue={formData.titular_nombre}
              onInputChange={(value) => setFormData(prev => ({ ...prev, titular_nombre: value, id_titular: null }))}
              onSelect={(item) => setFormData(prev => ({ ...prev, id_titular: item.id_persona, titular_nombre: item.nombre_completo }))}
              onCreateNew={() => openModal('titular')}
            />
            <SearchAndCreateInput<Predio>
              label="Origen de la Materia (Predio)" searchApiUrl="/api/predios" displayField="nombre_predio" inputValue={formData.predio_nombre}
              onInputChange={(value) => setFormData(prev => ({ ...prev, predio_nombre: value, id_predio_origen: null }))}
              onSelect={(item) => setFormData(prev => ({ ...prev, id_predio_origen: item.id_predio, predio_nombre: item.nombre_predio }))}
              onCreateNew={() => openModal('predio')}
            />
          </div>
        </FormSection>

        <FormSection title="3. Información del Producto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Descripción Producto" name="descripcion_producto_remision" value={formData.descripcion_producto_remision} onChange={(e) => setFormData(prev => ({...prev, descripcion_producto_remision: e.target.value}))} />
            <Input label="Género Madera" name="genero_madera" value={formData.genero_madera} onChange={(e) => setFormData(prev => ({...prev, genero_madera: e.target.value}))} />
            <Input label="Volumen Total (m³)" name="volumen_total_m3" type="number" step="0.01" value={formData.volumen_total_m3} onChange={(e) => setFormData(prev => ({...prev, volumen_total_m3: parseFloat(e.target.value) || 0}))} />
          </div>
        </FormSection>

        <FormSection title="4. Destinatario y Transporte">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SearchAndCreateInput<Persona>
              label="Remitente" searchApiUrl="/api/personas" displayField="nombre_completo" inputValue={formData.remitente_nombre}
              onInputChange={(value) => setFormData(prev => ({ ...prev, remitente_nombre: value, id_remitente: null }))}
              onSelect={(item) => setFormData(prev => ({ ...prev, id_remitente: item.id_persona, remitente_nombre: item.nombre_completo }))}
              onCreateNew={() => openModal('remitente')}
            />
            <SearchAndCreateInput<Persona>
              label="Destinatario" searchApiUrl="/api/personas" displayField="nombre_completo" inputValue={formData.destinatario_nombre}
              onInputChange={(value) => setFormData(prev => ({ ...prev, destinatario_nombre: value, id_destinatario: null }))}
              onSelect={(item) => setFormData(prev => ({ ...prev, id_destinatario: item.id_persona, destinatario_nombre: item.nombre_completo }))}
              onCreateNew={() => openModal('destinatario')}
            />
            <SearchAndCreateInput<Vehiculo>
              label="Vehículo (Placas)" searchApiUrl="/api/vehiculos" displayField="matricula" inputValue={formData.vehiculo_matricula}
              onInputChange={(value) => setFormData(prev => ({ ...prev, vehiculo_matricula: value, id_vehiculo: null }))}
              onSelect={(item) => setFormData(prev => ({ ...prev, id_vehiculo: item.id_vehiculo, vehiculo_matricula: item.matricula }))}
              onCreateNew={() => openModal('vehiculo')}
            />
            <SearchAndCreateInput<Persona>
              label="Chofer" searchApiUrl="/api/personas" displayField="nombre_completo" inputValue={formData.chofer_nombre}
              onInputChange={(value) => setFormData(prev => ({ ...prev, chofer_nombre: value, id_chofer: null }))}
              onSelect={(item) => setFormData(prev => ({ ...prev, id_chofer: item.id_persona, chofer_nombre: item.nombre_completo }))}
              onCreateNew={() => openModal('chofer')}
            />
          </div>
        </FormSection>

        <div className="border-t pt-6 flex justify-end gap-4">
          <button type="button" onClick={() => router.back()} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200">
            <Ban size={18} /> Cancelar
          </button>
          <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
            <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Remisión'}
          </button>
        </div>
      </form>

      {/* --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE: MODALES FUERA DEL FORM --- */}
      <PersonaFormModal isOpen={modalState.titular} onClose={() => closeModal('titular')} onSaveSuccess={(p) => handlePersonaSaveSuccess(p, 'titular')} modalTitle="Nuevo Titular" />
      <PersonaFormModal isOpen={modalState.remitente} onClose={() => closeModal('remitente')} onSaveSuccess={(p) => handlePersonaSaveSuccess(p, 'remitente')} modalTitle="Nuevo Remitente" />
      <PersonaFormModal isOpen={modalState.destinatario} onClose={() => closeModal('destinatario')} onSaveSuccess={(p) => handlePersonaSaveSuccess(p, 'destinatario')} modalTitle="Nuevo Destinatario" />
      <PersonaFormModal isOpen={modalState.chofer} onClose={() => closeModal('chofer')} onSaveSuccess={(p) => handlePersonaSaveSuccess(p, 'chofer')} modalTitle="Nuevo Chofer" />
      
      <VehiculoFormModal 
        isOpen={modalState.vehiculo} 
        onClose={() => closeModal('vehiculo')} 
        onSuccess={(v) => { setFormData(prev => ({ ...prev, id_vehiculo: v.id_vehiculo, vehiculo_matricula: v.matricula })); closeModal('vehiculo'); }} 
        modalTitle="Nuevo Vehículo" 
      />
      
      <PredioFormModal 
        isOpen={modalState.predio} 
        onClose={() => closeModal('predio')} 
        onSuccess={(p) => { setFormData(prev => ({ ...prev, id_predio_origen: p.id_predio, predio_nombre: p.nombre_predio })); closeModal('predio'); }} 
      />
    </>
  );
}

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <fieldset className="border-t pt-6">
    <legend className="text-lg font-semibold text-gray-700 mb-4">{title}</legend>
    {children}
  </fieldset>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
  </div>
);