// components/reembarques/NuevoReembarqueForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchAndCreateInput } from '@/components/ui/SearchAndCreateInput';
import { PersonaFormModal } from '@/components/personas/PersonaFormModal';
import { Save, Ban, FileSearch } from 'lucide-react';

// Tipos
type Persona = { id_persona: number; nombre_completo: string; [key: string]: any };
type Vehiculo = { id_vehiculo: number; matricula: string; [key: string]: any };
// Tipo para buscar Remisiones origen
type DocumentoOrigen = { id_remision: number; folio_progresivo: string; saldo_restante: number; volumen_total_m3: number; [key: string]: any };

interface NuevoReembarqueFormProps {
  onSaveSuccess: (reembarque: any) => void;
}

export function NuevoReembarqueForm({ onSaveSuccess }: NuevoReembarqueFormProps) {
  const router = useRouter();
  
  // Estados de datos
  const [formData, setFormData] = useState({
    folio_progresivo: '',
    folio_autorizado: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    
    // Relaciones
    id_remitente: null as number | null,
    id_destinatario: null as number | null,
    id_vehiculo: null as number | null,
    id_chofer: null as number | null,
    
    // Textos para inputs de búsqueda
    remitente_nombre: '',
    destinatario_nombre: '',
    vehiculo_matricula: '',
    chofer_nombre: '',

    // Producto y Saldos
    descripcion_producto_reembarque: 'Madera aserrada',
    genero_madera: 'Pino',
    cantidad_amparada: 0, // Lo que sale en este reembarque
    saldo_disponible_anterior: 0, // Lo que había antes
    // saldo_restante se calcula: anterior - amparada
    volumen_total_m3: 0, // Igual a cantidad_amparada generalmente

    // Origen
    id_documento_origen: null as number | null,
    tipo_documento_origen: null as 'REMISION' | 'REEMBARQUE' | null,
  });

  // Estado para búsqueda de documento origen
  const [docOrigenQuery, setDocOrigenQuery] = useState('');
  
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'remitente' | 'destinatario' | 'chofer'>('remitente');
  const [isSaving, setIsSaving] = useState(false);

  // Calcular saldos automáticamente
  const saldoRestante = Math.max(0, formData.saldo_disponible_anterior - formData.cantidad_amparada);

  const handleDocOrigenSelect = (doc: DocumentoOrigen) => {
    // Pre-llenar datos desde el documento origen (Remisión)
    setFormData(prev => ({
      ...prev,
      id_documento_origen: doc.id_remision,
      tipo_documento_origen: 'REMISION',
      saldo_disponible_anterior: Number(doc.saldo_restante) || Number(doc.volumen_total_m3), // Usar saldo si hay, si no volumen total
      // Aquí podrías pre-llenar remitente/destinatario si tuvieras esos datos en el objeto 'doc'
    }));
    setDocOrigenQuery(doc.folio_progresivo);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('sessionToken');

    try {
      const payload = {
        ...formData,
        saldo_restante: saldoRestante,
        volumen_total_m3: formData.cantidad_amparada // Asumimos que es lo mismo
      };

      const res = await fetch('/api/reembarques', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      onSaveSuccess(data);

    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Render para el buscador de origen
  const renderDocItem = (item: DocumentoOrigen) => (
    <div className="flex flex-col py-1">
      <span className="font-bold">Folio: {item.folio_progresivo}</span>
      <span className="text-xs text-gray-500">Vol: {item.volumen_total_m3} m³</span>
    </div>
  );

  // Helper para abrir modales de persona
  const openPersonaModal = (type: 'remitente' | 'destinatario' | 'chofer') => {
    setModalType(type);
    setIsPersonaModalOpen(true);
  };

  const handlePersonaSave = (p: Persona) => {
    setFormData(prev => ({
      ...prev,
      [`id_${modalType}`]: p.id_persona,
      [`${modalType}_nombre`]: p.nombre_completo
    }));
    setIsPersonaModalOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* 1. Vincular Documento Origen (Opcional) */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
          <FileSearch size={18} /> Vincular Documento Anterior (Origen)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchAndCreateInput<DocumentoOrigen>
            label="Buscar Remisión por Folio"
            placeholder="Ej: REM-001"
            searchApiUrl="/api/remisiones"
            displayField="folio_progresivo"
            inputValue={docOrigenQuery}
            onInputChange={(v) => { setDocOrigenQuery(v); setFormData(p => ({...p, id_documento_origen: null})); }}
            onSelect={handleDocOrigenSelect}
            onCreateNew={() => alert("No puedes crear remisiones aquí")}
            renderItem={renderDocItem}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Disponible (m³)</label>
            <input 
              type="number" 
              className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-600 font-bold"
              value={formData.saldo_disponible_anterior}
              onChange={(e) => setFormData(prev => ({...prev, saldo_disponible_anterior: parseFloat(e.target.value) || 0}))}
            />
            <p className="text-xs text-gray-500 mt-1">Se llena auto. al seleccionar origen, o ingrésalo manual.</p>
          </div>
        </div>
      </div>

      {/* 2. Datos del Reembarque */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Folio Progresivo</label>
          <input 
            className="w-full border rounded-lg px-3 py-2 uppercase"
            value={formData.folio_progresivo}
            onChange={(e) => setFormData(p => ({...p, folio_progresivo: e.target.value}))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Folio Autorizado (Opcional)</label>
          <input 
            className="w-full border rounded-lg px-3 py-2 uppercase"
            value={formData.folio_autorizado}
            onChange={(e) => setFormData(p => ({...p, folio_autorizado: e.target.value}))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Emisión</label>
          <input 
            type="date"
            className="w-full border rounded-lg px-3 py-2"
            value={formData.fecha_emision}
            onChange={(e) => setFormData(p => ({...p, fecha_emision: e.target.value}))}
            required
          />
        </div>
      </div>

      {/* 3. Producto y Cantidades */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Información del Producto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input 
              className="w-full border rounded-lg px-3 py-2"
              value={formData.descripcion_producto_reembarque}
              onChange={(e) => setFormData(p => ({...p, descripcion_producto_reembarque: e.target.value}))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
            <input 
              className="w-full border rounded-lg px-3 py-2"
              value={formData.genero_madera}
              onChange={(e) => setFormData(p => ({...p, genero_madera: e.target.value}))}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1 font-bold">Cantidad que Ampara (m³)</label>
            <input 
              type="number"
              step="0.001"
              className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 text-lg font-bold text-blue-800"
              value={formData.cantidad_amparada || ''}
              onChange={(e) => setFormData(p => ({...p, cantidad_amparada: parseFloat(e.target.value) || 0}))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Saldo Restante (Calc.)</label>
            <div className="w-full bg-gray-200 rounded-lg px-3 py-2 text-gray-700 font-mono">
              {saldoRestante.toFixed(3)} m³
            </div>
          </div>
        </div>
      </div>

      {/* 4. Transporte y Personas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SearchAndCreateInput<Persona>
          label="Remitente (Quién envía)"
          placeholder="Buscar..."
          searchApiUrl="/api/personas"
          displayField="nombre_completo"
          inputValue={formData.remitente_nombre}
          onInputChange={(v) => setFormData(p => ({...p, remitente_nombre: v, id_remitente: null}))}
          onSelect={(p) => setFormData(prev => ({ ...prev, id_remitente: p.id_persona, remitente_nombre: p.nombre_completo }))}
          onCreateNew={() => openPersonaModal('remitente')}
        />
        <SearchAndCreateInput<Persona>
          label="Destinatario"
          placeholder="Buscar..."
          searchApiUrl="/api/personas"
          displayField="nombre_completo"
          inputValue={formData.destinatario_nombre}
          onInputChange={(v) => setFormData(p => ({...p, destinatario_nombre: v, id_destinatario: null}))}
          onSelect={(p) => setFormData(prev => ({ ...prev, id_destinatario: p.id_persona, destinatario_nombre: p.nombre_completo }))}
          onCreateNew={() => openPersonaModal('destinatario')}
        />
        <SearchAndCreateInput<Vehiculo>
          label="Vehículo (Placas)"
          placeholder="Buscar placas..."
          searchApiUrl="/api/vehiculos"
          displayField="matricula"
          inputValue={formData.vehiculo_matricula}
          onInputChange={(v) => setFormData(p => ({...p, vehiculo_matricula: v, id_vehiculo: null}))}
          onSelect={(v) => setFormData(prev => ({ ...prev, id_vehiculo: v.id_vehiculo, vehiculo_matricula: v.matricula }))}
          onCreateNew={() => alert("Modal vehículo pendiente")}
        />
        <SearchAndCreateInput<Persona>
          label="Chofer"
          placeholder="Buscar..."
          searchApiUrl="/api/personas"
          displayField="nombre_completo"
          inputValue={formData.chofer_nombre}
          onInputChange={(v) => setFormData(p => ({...p, chofer_nombre: v, id_chofer: null}))}
          onSelect={(p) => setFormData(prev => ({ ...prev, id_chofer: p.id_persona, chofer_nombre: p.nombre_completo }))}
          onCreateNew={() => openPersonaModal('chofer')}
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <button type="button" onClick={() => router.back()} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200">
          <Ban size={18} /> Cancelar
        </button>
        <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-md">
          <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Reembarque'}
        </button>
      </div>

      <PersonaFormModal 
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        onSaveSuccess={handlePersonaSave}
        modalTitle={`Nuevo ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`}
      />
    </form>
  );
}