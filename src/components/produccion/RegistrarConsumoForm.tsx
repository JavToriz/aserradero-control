// components/produccion/RegistrarConsumoForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Ban, Minus, Plus } from 'lucide-react';

interface RegistrarConsumoFormProps {
  onSaveSuccess: (orden: any) => void;
}

const ESPECIES_MADERA = ['Pino', 'Encino', 'Oyamel', 'Cedro', 'Roble', 'Otra'];

export function RegistrarConsumoForm({ onSaveSuccess }: RegistrarConsumoFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fecha_aserrado: new Date().toISOString().split('T')[0],
    especie: 'Pino',
    total_m3_rollo_consumido: 0,
    observaciones: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('sessionToken');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    if (formData.total_m3_rollo_consumido <= 0) {
      setError('El total de m³ debe ser mayor a cero.');
      setIsSaving(false);
      return;
    }

    const token = getToken();

    try {
      const response = await fetch('/api/ordenes-aserrado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          total_m3_rollo_consumido: parseFloat(formData.total_m3_rollo_consumido.toString()) 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al guardar el consumo');
      }

      alert('Consumo registrado con éxito.'); 
      onSaveSuccess(result);

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      // Si el campo es numérico y el valor es vacío, guardamos 0 en el estado pero el input mostrará vacío
      [name]: (name === 'total_m3_rollo_consumido' && value === '') ? 0 : value
    }));
  };

  // Funciones para los botones +/-
  const adjustVolume = (amount: number) => {
    setFormData(prev => ({
      ...prev,
      total_m3_rollo_consumido: Math.max(0, (parseFloat(prev.total_m3_rollo_consumido.toString()) || 0) + amount)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input 
          label="Fecha de Aserrado" 
          name="fecha_aserrado" 
          type="date" 
          value={formData.fecha_aserrado} 
          onChange={handleChange} 
          required 
        />
        <Select 
          label="Especie de Madera" 
          name="especie" 
          value={formData.especie} 
          onChange={handleChange} 
          required
        >
          {ESPECIES_MADERA.map(esp => (
            <option key={esp} value={esp}>{esp}</option>
          ))}
        </Select>
      </div>

      <div className="text-center bg-gray-50 p-6 rounded-lg">
        <label htmlFor="total_m3_rollo_consumido" className="block text-sm font-medium text-gray-700 mb-2">
          Total de Metros Cúbicos (m³) en Rollo a Procesar
        </label>
        <div className="flex justify-center items-center gap-4">
          <button type="button" onClick={() => adjustVolume(-1)} className="p-2 bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300">
            <Minus size={20} />
          </button>
          
          <input
            id="total_m3_rollo_consumido"
            name="total_m3_rollo_consumido"
            type="number"
            step="0.01"
            // FIX UX: Si es 0, pasamos cadena vacía para que no se vea el "0"
            value={formData.total_m3_rollo_consumido === 0 ? '' : formData.total_m3_rollo_consumido}
            onChange={handleChange}
            placeholder="0"
            className="w-48 text-center text-4xl font-bold border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          
          <button type="button" onClick={() => adjustVolume(1)} className="p-2 bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300">
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-1">
          Observaciones (Opcional)
        </label>
        <textarea
          id="observaciones"
          name="observaciones"
          rows={3}
          value={formData.observaciones}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ej: Rollos de primera, diámetro promedio 30cm..."
        />
      </div>

      <div className="border-t pt-6 flex justify-end gap-4">
        {error && <p className="text-red-600 text-sm my-auto mr-4">Error: {error}</p>}
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
          {isSaving ? 'Registrando...' : 'Registrar Consumo'}
        </button>
      </div>
    </form>
  );
}

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

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: React.ReactNode;
}
const Select: React.FC<SelectProps> = ({ label, children, ...props }) => (
  <div className="w-full">
    <label htmlFor={props.name} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <select
      id={props.name}
      {...props}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </select>
  </div>
);