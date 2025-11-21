// src/components/productos/AdjustmentHistoryModal.tsx
// modal que mostrará la tabla con el historial de movimientos de inventario

'use client';

import { useEffect, useState } from 'react';
import { ModalContainer } from '@/components/ui/ModalContainer';

type Product = {
  id_producto: number;
  descripcion: string;
  [key: string]: any;
};

interface AdjustmentHistoryModalProps {
  product: Product;
  onClose: () => void;
}

type Adjustment = {
  id_ajuste: number;
  fecha_ajuste: string;
  cantidad: number;
  motivo: string;
  usuario: {
    nombre_completo: string;
  };
};

export const AdjustmentHistoryModal = ({ product, onClose }: AdjustmentHistoryModalProps) => {
  const [history, setHistory] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const token = localStorage.getItem('sessionToken');
      try {
        const response = await fetch(`/api/productos/${product.id_producto}/ajuste`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('No se pudo cargar el historial.');
        const data = await response.json();
        setHistory(data);
      } catch (error) {
        console.error(error);
        alert('Error al cargar el historial.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [product.id_producto]);

  return (
    <ModalContainer title={`Historial de Ajustes: ${product.descripcion}`} onClose={onClose}>
      <div className="max-h-[60vh] overflow-y-auto">
        {loading ? (
          <p className="text-center text-gray-500 py-8">Cargando historial...</p>
        ) : history.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay ajustes registrados para este producto.</p>
        ) : (
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3">Fecha</th>
                <th scope="col" className="px-6 py-3">Cantidad</th>
                <th scope="col" className="px-6 py-3">Motivo</th>
                <th scope="col" className="px-6 py-3">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {history.map((adj) => (
                <tr key={adj.id_ajuste} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{new Date(adj.fecha_ajuste).toLocaleString()}</td>
                  <td className={`px-6 py-4 font-bold ${adj.cantidad > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {adj.cantidad > 0 ? `+${adj.cantidad}` : adj.cantidad}
                  </td>
                  <td className="px-6 py-4">{adj.motivo}</td>
                  <td className="px-6 py-4">{adj.usuario.nombre_completo || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Añadimos la nota informativa al pie del modal */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 italic">
          Nota: Los registros con más de 3 meses de antigüedad se eliminan automáticamente.
        </p>
      </div>
    </ModalContainer>
  );
};