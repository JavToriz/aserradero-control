// components/ventas/SeleccionarInventarioModal.tsx
// modal para que muestra de dónde se puede tomar ese producto
'use client';

import { useState, useEffect } from 'react';
import { ModalContainer } from '@/components/ui/ModalContainer';
import { Save, Ban, AlertCircle } from 'lucide-react';

// Tipos
type StockDisponible = {
  id_stock: number;
  ubicacion: string;
  piezas_actuales: number;
  fecha_ingreso: string;
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: { id: number; nombre: string } | null;
  cantidadRequerida: number; 
  onConfirm: (origenes: { id_stock: number; cantidad: number }[]) => void;
}

export function SeleccionarInventarioModal({ isOpen, onClose, producto, cantidadRequerida, onConfirm }: ModalProps) {
  // Inicializamos siempre como array vacío para evitar el error inicial
  const [stockList, setStockList] = useState<StockDisponible[]>([]);
  const [loading, setLoading] = useState(false);
  const [seleccion, setSeleccion] = useState<{ [id_stock: number]: number }>({});
  const [error, setError] = useState<string | null>(null);

  // Cargar stock disponible al abrir
  useEffect(() => {
    if (isOpen && producto) {
      setLoading(true);
      setSeleccion({});
      setError(null);
      setStockList([]); // Limpiamos lista anterior
      
      const token = localStorage.getItem('sessionToken');
      
      fetch(`/api/stock-producto-terminado/disponibilidad?id_producto=${producto.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(async (res) => {
        // --- CORRECCIÓN 1: Verificamos si la respuesta es exitosa ---
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Error al cargar disponibilidad');
        }
        return res.json();
      })
      .then((data) => {
        // --- CORRECCIÓN 2: Verificamos que sea un array antes de setear ---
        if (Array.isArray(data)) {
            setStockList(data);
        } else {
            console.error("La API devolvió un formato inesperado:", data);
            setStockList([]);
        }
      })
      .catch((err) => {
          console.error(err);
          setError(err.message);
          setStockList([]); // En caso de error, aseguramos que siga siendo array
      })
      .finally(() => setLoading(false));
    }
  }, [isOpen, producto]);

  // Calcular totales
  const cantidadSeleccionada = Object.values(seleccion).reduce((a, b) => a + b, 0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const faltante = cantidadRequerida - cantidadSeleccionada;
  const esValido = cantidadSeleccionada === cantidadRequerida;

  const handleCantidadChange = (id_stock: number, max: number, valorStr: string) => {
    const valor = valorStr === '' ? 0 : parseInt(valorStr, 10);
    
    if (valor < 0) return;
    if (valor > max) return; // No puedes tomar más de lo que hay en el lote

    setSeleccion(prev => ({
      ...prev,
      [id_stock]: valor
    }));
  };

  // Auto-llenado inteligente (FIFO)
  const autoLlenar = () => {
    let remanente = cantidadRequerida;
    const nuevaSeleccion: { [key: number]: number } = {};

    for (const lote of stockList) {
      if (remanente <= 0) break;
      const tomar = Math.min(remanente, lote.piezas_actuales);
      nuevaSeleccion[lote.id_stock] = tomar;
      remanente -= tomar;
    }
    setSeleccion(nuevaSeleccion);
  };

  const handleConfirm = () => {
    if (!esValido) {
      setError(`Debes seleccionar exactamente ${cantidadRequerida} piezas.`);
      return;
    }
    // Convertir el objeto de selección al formato requerido
    const origenes = Object.entries(seleccion)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({ id_stock: parseInt(id), cantidad: qty }));
    
    onConfirm(origenes);
  };

  if (!isOpen || !producto) return null;

  return (
    <ModalContainer title={`Seleccionar Inventario: ${producto.nombre}`} onClose={onClose}>
      <div className="p-4 space-y-4">
        
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-800">Cantidad a Vender:</p>
            <p className="text-2xl font-bold text-blue-600">{cantidadRequerida} piezas</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Seleccionado:</p>
            <p className={`text-xl font-bold ${esValido ? 'text-green-600' : 'text-red-500'}`}>
              {cantidadSeleccionada}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-4">Cargando disponibilidad...</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <div className="flex justify-end mb-2">
               <button onClick={autoLlenar} className="text-xs text-blue-600 hover:underline">
                 Auto-llenar (Más antiguos primero)
               </button>
            </div>
            
            {/* Verificación de seguridad extra */}
            {Array.isArray(stockList) && stockList.length === 0 ? (
              <p className="text-red-500 text-center">No hay stock disponible para este producto.</p>
            ) : (
              Array.isArray(stockList) && stockList.map(lote => (
                <div key={lote.id_stock} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div>
                    <span className="font-bold text-gray-700 block">{lote.ubicacion}</span>
                    <span className="text-xs text-gray-500">Ingreso: {new Date(lote.fecha_ingreso).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Disp: {lote.piezas_actuales}</span>
                    <input
                      type="number"
                      className="w-20 px-2 py-1 border rounded text-right"
                      placeholder="0"
                      value={seleccion[lote.id_stock] === 0 ? '' : seleccion[lote.id_stock] || ''}
                      onChange={(e) => handleCantidadChange(lote.id_stock, lote.piezas_actuales, e.target.value)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="border-t pt-4 flex justify-end gap-4">
          <button onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2">
            <Ban size={18} /> Cancelar
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={!esValido}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} /> Confirmar Selección
          </button>
        </div>
      </div>
    </ModalContainer>
  );
}