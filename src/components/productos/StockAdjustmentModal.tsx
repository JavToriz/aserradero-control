// src/components/productos/StockAdjustmentModal.tsx
// Modal que visualiza el formulario para ajustar el stock de un producto
'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { ModalContainer } from '@/components/ui/ModalContainer'; 

type Product = {
  id_producto: number;
  descripcion: string;
  stock: number;
  [key: string]: any;
};

interface StockAdjustmentModalProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  cantidad: number;
  motivo: string;
};

export const StockAdjustmentModal = ({ product, onClose, onSuccess }: StockAdjustmentModalProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      motivo: 'Ajuste de inventario', // Valor predeterminado
    },
  });
  const [apiError, setApiError] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    const token = localStorage.getItem('sessionToken');
    
    try {
      const response = await fetch(`/api/productos/${product.id_producto}/ajuste`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cantidad: Number(data.cantidad), // Aseguramos que sea un número
          motivo: data.motivo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al ajustar el stock.');
      }

      alert('¡Stock actualizado con éxito!');
      onSuccess(); // Llama a la función para cerrar y recargar

    } catch (error: any) {
      console.error(error);
      setApiError(error.message);
    }
  };

  return (
    <ModalContainer title={`Ajustar Stock: ${product.descripcion}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-sm text-gray-600">Stock Actual:</p>
          <p className="text-2xl font-bold text-gray-800">{product.stock} <span className="text-base font-normal">{product.unidad_medida}</span></p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-md" role="alert">
          <p className="font-bold">Registrar Entrada o Salida</p>
          <p className="text-sm">
            Usa un número <strong className="text-green-600">positivo</strong> (ej: 10) para registrar una <strong>entrada</strong>.
            <br />
            Usa un número <strong className="text-red-600">negativo</strong> (ej: -5) para registrar una <strong>salida</strong>.
          </p>
        </div>
        
        <div>
          <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700">Cantidad a Ajustar</label>
          <input
            type="number"
            id="cantidad"
            step="any" // Permite decimales
            {...register('cantidad', { 
              required: 'La cantidad es obligatoria.',
              validate: value => value !== 0 || 'La cantidad no puede ser cero.'
            })}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.cantidad && <p className="text-red-500 text-xs mt-1">{errors.cantidad.message}</p>}
        </div>

        <div>
          <label htmlFor="motivo" className="block text-sm font-medium text-gray-700">Motivo del Ajuste</label>
          <input
            type="text"
            id="motivo"
            {...register('motivo', { required: 'El motivo es obligatorio.' })}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
          />
          {errors.motivo && <p className="text-red-500 text-xs mt-1">{errors.motivo.message}</p>}
        </div>
        
        {apiError && <p className="text-red-500 text-sm text-center">{apiError}</p>}

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold px-6 py-2 rounded-lg hover:bg-gray-300">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
            {isSubmitting ? 'Guardando...' : 'Confirmar Ajuste'}
          </button>
        </div>
      </form>
    </ModalContainer>
  );
};