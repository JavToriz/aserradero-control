// components/gastos/NuevoGastoForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchAndCreateInput } from '@/components/ui/SearchAndCreateInput';
import { PersonaFormModal } from '@/components/personas/PersonaFormModal';
import { Save, Ban, Truck } from 'lucide-react';

// Helper simple para números a letras
function numeroALetras(num: number): string {
  // Esto es un placeholder. Instala 'numero-a-letras' para producción.
  return `${num.toFixed(2)} PESOS 00/100 M.N.`; 
}

type Persona = { id_persona: number; nombre_completo: string; [key: string]: any };
// Tipo simple para Remisión (para el buscador)
type RemisionSearch = { id_remision: number; folio_progresivo: string; volumen_total_m3: number; [key: string]: any };

const CONCEPTOS = ['FLETE', 'NOMINA', 'INSUMOS', 'MANTENIMIENTO', 'OTRO'];

interface NuevoGastoFormProps {
  onSaveSuccess: (gasto: any) => void;
}

export function NuevoGastoForm({ onSaveSuccess }: NuevoGastoFormProps) {
  const router = useRouter();
  
  // Estados
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [beneficiario, setBeneficiario] = useState<Persona | null>(null);
  const [beneficiarioNombre, setBeneficiarioNombre] = useState('');
  
  const [concepto, setConcepto] = useState('FLETE');
  const [detalle, setDetalle] = useState('');
  
  const [remision, setRemision] = useState<RemisionSearch | null>(null); // El objeto seleccionado
  const [remisionQuery, setRemisionQuery] = useState(''); // --- NUEVO: El texto del input ---
  
  const [monto, setMonto] = useState<number>(0);
  const [montoLetra, setMontoLetra] = useState('');

  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Actualizar monto en letra cuando cambia el monto numérico
  useEffect(() => {
    if (monto > 0) {
      setMontoLetra(numeroALetras(monto));
    } else {
      setMontoLetra('');
    }
  }, [monto]);

  // Autollenar detalle si selecciona remisión
  useEffect(() => {
    if (remision && concepto === 'FLETE') {
      setDetalle(`Pago de flete por Remisión ${remision.folio_progresivo} (${remision.volumen_total_m3} m³)`);
    }
  }, [remision, concepto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beneficiario || monto <= 0) return alert("Datos incompletos");

    setIsSaving(true);
    const token = localStorage.getItem('sessionToken');

    try {
      const payload = {
        fecha_emision: fecha,
        id_beneficiario: beneficiario.id_persona,
        monto: monto,
        monto_letra: montoLetra,
        concepto_general: concepto,
        concepto_detalle: detalle,
        // Vincular documento si es flete
        documento_asociado_id: concepto === 'FLETE' && remision ? remision.id_remision : null,
        documento_asociado_tipo: concepto === 'FLETE' && remision ? 'REMISION' : null
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
      if (!res.ok) throw new Error(data.message);

      onSaveSuccess(data);

    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Función render personalizada para Remisiones en el buscador
  const renderRemisionItem = (item: RemisionSearch) => (
    <div className="flex flex-col py-1">
      <span className="font-bold">Folio: {item.folio_progresivo}</span>
      <span className="text-xs text-gray-500">{item.volumen_total_m3} m³</span>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* 1. Fecha y Beneficiario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input 
            type="date" 
            className="w-full border rounded-lg px-3 py-2"
            value={fecha} 
            onChange={e => setFecha(e.target.value)} 
            required
          />
        </div>
        <div>
          <SearchAndCreateInput<Persona>
            label="Beneficiario (Quién recibe)"
            placeholder="Buscar nombre..."
            searchApiUrl="/api/personas"
            displayField="nombre_completo"
            inputValue={beneficiarioNombre}
            onInputChange={(v) => { setBeneficiarioNombre(v); setBeneficiario(null); }}
            onSelect={(p) => { setBeneficiario(p); setBeneficiarioNombre(p.nombre_completo); }}
            onCreateNew={() => setIsPersonaModalOpen(true)}
          />
        </div>
      </div>

      {/* 2. Concepto y Vinculación */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <label className="block text-sm font-medium text-gray-700 mb-2">Concepto del Gasto</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {CONCEPTOS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => { 
                setConcepto(c); 
                setRemision(null); 
                setRemisionQuery(''); // Limpiar búsqueda al cambiar concepto
              }}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                concepto === c ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Si es FLETE, mostrar buscador de remisiones */}
        {concepto === 'FLETE' && (
          <div className="mb-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2 text-blue-800">
              <Truck size={18} />
              <span className="text-sm font-bold">Vincular Remisión (Flete)</span>
            </div>
            {/* FIX: Usamos 'remisionQuery' para el texto y 'setRemisionQuery' para actualizarlo */}
            <SearchAndCreateInput<RemisionSearch>
              label="Buscar Remisión por Folio"
              placeholder="Escribe el folio..."
              // Asumiendo que GET /api/remisiones soporta filtrado (si no, necesitarás actualizar el endpoint para aceptar ?query=)
              searchApiUrl="/api/remisiones" 
              displayField="folio_progresivo"
              inputValue={remisionQuery} // <-- Valor del estado de texto
              onInputChange={(v) => {
                setRemisionQuery(v); // <-- Actualiza el texto
                setRemision(null);   // Resetea la selección
              }}
              onSelect={(r) => {
                setRemision(r);
                setRemisionQuery(r.folio_progresivo); // Al seleccionar, pone el folio en el input
              }}
              onCreateNew={() => alert("No puedes crear remisiones desde aquí")}
              renderItem={renderRemisionItem}
            />
          </div>
        )}

        <label className="block text-sm font-medium text-gray-700 mb-1">Detalle / Observaciones</label>
        <textarea
          className="w-full border rounded-lg px-3 py-2 h-20"
          placeholder="Descripción detallada del pago..."
          value={detalle}
          onChange={e => setDetalle(e.target.value)}
        />
      </div>

      {/* 3. Monto */}
      <div className="bg-blue-50 p-6 rounded-lg text-center border border-blue-100">
        <label className="block text-sm font-medium text-blue-800 mb-2">Monto a Pagar</label>
        <div className="flex justify-center items-center gap-2">
          <span className="text-2xl font-bold text-blue-600">$</span>
          <input 
            type="number"
            step="0.01"
            className="w-48 text-3xl font-bold text-center border-b-2 border-blue-300 bg-transparent focus:outline-none focus:border-blue-600"
            placeholder="0.00"
            value={monto === 0 ? '' : monto}
            onChange={e => setMonto(e.target.value === '' ? 0 : parseFloat(e.target.value))}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2 uppercase min-h-[20px]">
          {montoLetra}
        </p>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-4 pt-4">
        <button type="button" onClick={() => router.back()} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2">
          <Ban size={18} /> Cancelar
        </button>
        <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-md">
          <Save size={18} /> {isSaving ? 'Guardando...' : 'Generar Recibo'}
        </button>
      </div>

      {/* Modal Persona */}
      <PersonaFormModal 
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        onSaveSuccess={(p) => { setBeneficiario(p); setBeneficiarioNombre(p.nombre_completo); setIsPersonaModalOpen(false); }}
      />
    </form>
  );
}