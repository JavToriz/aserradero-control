'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchAndCreateInput } from '@/components/ui/SearchAndCreateInput';
import { PersonaFormModal } from '@/components/personas/PersonaFormModal';
import { Save, Ban, Truck, Trees } from 'lucide-react'; // Agregué icono Trees para madera

// Helper simple para números a letras
function numeroALetras(num: number): string {
  // TODO: Reemplazar con librería real 'numero-a-letras' en producción
  return `${num.toFixed(2)} PESOS 00/100 M.N.`; 
}

type Persona = { id_persona: number; nombre_completo: string; [key: string]: any };

// Tipo para Remisión
type RemisionSearch = { 
  id_remision: number; 
  folio_progresivo: string; 
  volumen_total_m3: number; 
  [key: string]: any 
};

// --- CONFIGURACIÓN DE CONCEPTOS ---
const CONCEPTOS = ['PAGO DE MADERA', 'FLETE', 'NOMINA', 'INSUMOS', 'MANTENIMIENTO', 'OTRO'];
// Conceptos que requieren vincularse a una remisión
const CONCEPTOS_CON_REMISION = ['FLETE', 'PAGO DE MADERA'];

interface NuevoGastoFormProps {
  onSaveSuccess: (gasto: any) => void;
}

export function NuevoGastoForm({ onSaveSuccess }: NuevoGastoFormProps) {
  const router = useRouter();
  
  // Estados
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  
  const [beneficiario, setBeneficiario] = useState<Persona | null>(null);
  const [beneficiarioNombre, setBeneficiarioNombre] = useState('');
  
  const [concepto, setConcepto] = useState('PAGO DE MADERA'); // Default sugerido por negocio
  const [detalle, setDetalle] = useState('');
  
  // Estado para Remisión (Flete o Madera)
  const [remision, setRemision] = useState<RemisionSearch | null>(null);
  const [remisionQuery, setRemisionQuery] = useState(''); 
  
  const [monto, setMonto] = useState<number>(0);
  const [montoLetra, setMontoLetra] = useState('');

  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Efecto: Actualizar monto en letra
  useEffect(() => {
    if (monto > 0) {
      setMontoLetra(numeroALetras(monto));
    } else {
      setMontoLetra('');
    }
  }, [monto]);

  // 2. Efecto: Autollenar detalle inteligente según el concepto y la remisión seleccionada
  useEffect(() => {
    if (remision && CONCEPTOS_CON_REMISION.includes(concepto)) {
      if (concepto === 'FLETE') {
        setDetalle(`Pago de Flete correspondiente a Remisión Folio ${remision.folio_progresivo} (${remision.volumen_total_m3} m³)`);
      } else if (concepto === 'PAGO DE MADERA') {
        setDetalle(`Abono a compra de madera de Remisión Folio ${remision.folio_progresivo}`);
      }
    }
  }, [remision, concepto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beneficiario || monto <= 0) return alert("Por favor complete Beneficiario y Monto.");
    
    // Validación de negocio: Si es concepto de remisión, exigir que se seleccione una
    if (CONCEPTOS_CON_REMISION.includes(concepto) && !remision) {
      return alert(`Para el concepto ${concepto} es obligatorio seleccionar una Remisión.`);
    }

    setIsSaving(true);
    const token = localStorage.getItem('sessionToken');

    // Determinar si hay asociación documental
    const tieneAsociacion = CONCEPTOS_CON_REMISION.includes(concepto) && remision;

    try {
      const payload = {
        fecha_emision: fecha,
        id_beneficiario: beneficiario.id_persona,
        monto: monto,
        monto_letra: montoLetra,
        concepto_general: concepto,
        concepto_detalle: detalle,
        // Vinculación dinámica
        documento_asociado_id: tieneAsociacion ? remision!.id_remision : null,
        documento_asociado_tipo: tieneAsociacion ? 'REMISION' : null
      };

      const res = await fetch('/api/gastos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al guardar el gasto');

      onSaveSuccess(data);

    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBeneficiarioCreated = (nuevaPersona: Persona) => {
    setBeneficiario(nuevaPersona);
    setBeneficiarioNombre(nuevaPersona.nombre_completo);
    setIsPersonaModalOpen(false);
  };

  const renderRemisionItem = (item: RemisionSearch) => (
    <div className="flex flex-col py-1">
      <span className="font-bold text-gray-800">Folio: {item.folio_progresivo}</span>
      <span className="text-xs text-gray-500">Volumen: {item.volumen_total_m3} m³</span>
    </div>
  );

  // Helper para saber si mostramos el buscador de remisiones
  const showRemisionSearch = CONCEPTOS_CON_REMISION.includes(concepto);

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* SECCIÓN 1: Datos Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Pago</label>
          <input 
            type="date" 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={fecha} 
            onChange={e => setFecha(e.target.value)} 
            required
          />
        </div>
        <div>
          <SearchAndCreateInput<Persona>
            label="Beneficiario (Proveedor/Transportista)"
            placeholder="Buscar por nombre..."
            searchApiUrl="/api/personas"
            displayField="nombre_completo"
            inputValue={beneficiarioNombre}
            onInputChange={(v) => { setBeneficiarioNombre(v); setBeneficiario(null); }}
            onSelect={(p) => { setBeneficiario(p); setBeneficiarioNombre(p.nombre_completo); }}
            onCreateNew={() => setIsPersonaModalOpen(true)}
          />
        </div>
      </div>

      {/* SECCIÓN 2: Concepto y Vinculación */}
      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">Concepto del Gasto</label>
        
        {/* Selector de Conceptos (Pills) */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CONCEPTOS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => { 
                setConcepto(c);
                // Opcional: Si cambias entre Flete y Madera, podrías querer mantener la remisión, 
                // pero por seguridad limpiamos para evitar confusiones.
                setRemision(null); 
                setRemisionQuery(''); 
                setDetalle('');
              }}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all shadow-sm ${
                concepto === c 
                  ? 'bg-blue-600 text-white ring-2 ring-blue-300' 
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Buscador Condicional de Remisiones */}
        {showRemisionSearch && (
          <div className="mb-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-2 text-blue-800 bg-blue-50 p-2 rounded w-fit">
              {concepto === 'FLETE' ? <Truck size={18} /> : <Trees size={18} />}
              <span className="text-sm font-bold">
                {concepto === 'FLETE' ? 'Vincular Flete a Remisión' : 'Vincular Compra de Madera a Remisión'}
              </span>
            </div>
            
            <SearchAndCreateInput<RemisionSearch>
              label="Buscar Remisión (Origen)"
              placeholder="Escribe el folio progresivo..."
              searchApiUrl="/api/remisiones"
              displayField="folio_progresivo"
              inputValue={remisionQuery}
              onInputChange={(v) => {
                setRemisionQuery(v);
                setRemision(null);
              }}
              onSelect={(r) => {
                setRemision(r);
                setRemisionQuery(r.folio_progresivo);
              }}
              // No permitimos crear remisiones desde gastos, deben existir previamente
              onCreateNew={() => alert("La remisión debe ser creada primero en el módulo de Entradas.")}
              renderItem={renderRemisionItem}
            />
            {!remision && (
              <p className="text-xs text-amber-600 mt-1">
                * Es necesario seleccionar una remisión para este concepto.
              </p>
            )}
          </div>
        )}

        <label className="block text-sm font-medium text-gray-700 mb-1">Detalle / Notas Adicionales</label>
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Escribe detalles adicionales..."
          value={detalle}
          onChange={e => setDetalle(e.target.value)}
        />
      </div>

      {/* SECCIÓN 3: Monto */}
      <div className="bg-blue-50 p-6 rounded-lg text-center border border-blue-100 shadow-inner">
        <label className="block text-sm font-bold text-blue-800 mb-2 uppercase tracking-wide">Monto a Pagar</label>
        <div className="flex justify-center items-center gap-2 relative">
          <span className="text-3xl font-bold text-blue-600 absolute left-1/4">$</span>
          <input 
            type="number"
            step="0.01"
            min="0"
            className="w-1/2 text-4xl font-bold text-center border-b-2 border-blue-300 bg-transparent focus:outline-none focus:border-blue-600 text-gray-800 placeholder-gray-300"
            placeholder="0.00"
            value={monto === 0 ? '' : monto}
            onChange={e => setMonto(e.target.value === '' ? 0 : parseFloat(e.target.value))}
          />
        </div>
        <p className="text-xs font-mono text-gray-500 mt-3 uppercase min-h-[20px] bg-white/50 inline-block px-3 py-1 rounded">
          {montoLetra || '---'}
        </p>
      </div>

      {/* Botones de Acción */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <button 
          type="button" 
          onClick={() => router.back()} 
          className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-gray-50 font-medium transition-colors"
        >
          <Ban size={18} /> Cancelar
        </button>
        <button 
          type="submit" 
          disabled={isSaving || (showRemisionSearch && !remision)} 
          className={`px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-md text-white font-medium transition-all ${
            isSaving || (showRemisionSearch && !remision)
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          }`}
        >
          <Save size={18} /> {isSaving ? 'Registrando...' : 'Generar Recibo'}
        </button>
      </div>

    </form>

    {/* Modales Auxiliares */}
    <PersonaFormModal 
      isOpen={isPersonaModalOpen}
      onClose={() => setIsPersonaModalOpen(false)}
      onSaveSuccess={handleBeneficiarioCreated}
      modalTitle='Nuevo Beneficiario'
    />
    </>
  );
}