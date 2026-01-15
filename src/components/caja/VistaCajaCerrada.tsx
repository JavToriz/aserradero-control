'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Store } from 'lucide-react';

export function VistaCajaCerrada({ onCajaAbierta }: { onCajaAbierta: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [serverError, setServerError] = useState('');

  const onSubmit = async (data: any) => {
    setServerError('');
    const token = localStorage.getItem('sessionToken'); // <--- TU LÓGICA

    try {
      const res = await fetch('/api/caja', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // <--- HEADER MANUAL
        },
        body: JSON.stringify({
          action: 'ABRIR',
          monto: Number(data.monto),
          id_aserradero: 1, 
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      onCajaAbierta();
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
        <Store className="w-10 h-10 text-gray-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">La caja está cerrada</h2>
      <p className="text-gray-500 text-center max-w-md mb-8">
        Para comenzar a registrar ventas y gastos, necesitas abrir un nuevo turno indicando el fondo inicial.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm bg-white p-6 rounded-lg shadow-lg border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fondo Inicial en Efectivo
        </label>
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500">$</span>
          </div>
          <input
            type="number"
            step="0.01"
            className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
            {...register('monto', { required: 'El monto es obligatorio', min: 0 })}
          />
        </div>
        {errors.monto && <span className="text-red-500 text-sm">{String(errors.monto.message)}</span>}
        {serverError && <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{serverError}</div>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Abriendo...' : 'Abrir Turno'}
        </button>
      </form>
    </div>
  );
}