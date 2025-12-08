// components/produccion/MoverStockModal.tsx
// V2: Ahora incluye un campo para la cantidad de piezas.
import { useState, useEffect, useMemo } from 'react';
import { ModalContainer } from '@/components/ui/ModalContainer';
import { StockItem } from '@/app/(dashboard)/produccion/page';
import { Save, Ban, Truck } from 'lucide-react';

interface MoverStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMoveSuccess: () => void;
  item: StockItem;
  mode: 'full' | 'partial';
}

const UBICACIONES = ['PRODUCCION', 'SECADO', 'BODEGA', 'ANAQUELES'];

export function MoverStockModal({ isOpen, onClose, onMoveSuccess, item, mode }: MoverStockModalProps) {
  
  const opcionesDestino = useMemo(() => 
    UBICACIONES.filter(u => u !== item.ubicacion),
    [item.ubicacion]
  );
  
  const [destino, setDestino] = useState(opcionesDestino[0] || '');
  const [piezasAMover, setPiezasAMover] = useState(item.piezas_actuales);
  const [validationError, setValidationError] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && item) {
      setPiezasAMover(item.piezas_actuales); 
      setDestino(opcionesDestino[0] || '');
      setError(null);
      setValidationError('');
    }
  }, [item, isOpen, opcionesDestino]);

  const getToken = () => localStorage.getItem('sessionToken');

  const handlePiezasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorStr = e.target.value;
    // Si está vacío, permitimos que sea 0 internamente pero vacío en la UI
    if (valorStr === '') {
      setPiezasAMover(0);
      setValidationError('');
      return;
    }

    const valor = parseInt(valorStr, 10);
    setValidationError('');

    if (isNaN(valor) || valor < 0) {
      setPiezasAMover(0);
      return;
    }
    
    if (valor > item.piezas_actuales) {
      setValidationError(`No puedes mover más de ${item.piezas_actuales} piezas`);
      setPiezasAMover(item.piezas_actuales);
    } else {
      setPiezasAMover(valor);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setValidationError('');

    const cantidadFinal = mode === 'full' ? item.piezas_actuales : piezasAMover;

    if (cantidadFinal <= 0) {
      setValidationError('La cantidad debe ser mayor a cero');
      setIsSaving(false);
      return;
    }

    const token = getToken();

    try {
      const response = await fetch(`/api/stock-producto-terminado/${item.id_stock}/mover`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ubicacion_destino: destino,
          piezas_a_mover: cantidadFinal,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Error al mover el lote');
      
      onMoveSuccess(); 

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} title="Mover Lote de Stock">
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Moviendo Lote:</p>
          <p className="text-lg font-semibold text-gray-800">{item.producto.descripcion}</p>
          <p className="text-sm text-gray-500">
            Desde: <span className="font-medium text-red-600">{item.ubicacion}</span>
          </p>
          <p className="text-md text-blue-600 font-bold mt-2">
            Disponible: {item.piezas_actuales} piezas
          </p>
        </div>

        <div className={`grid grid-cols-1 ${mode === 'partial' ? 'md:grid-cols-2' : ''} gap-4`}>
          
          {mode === 'partial' && (
            <div>
              <label htmlFor="piezasAMover" className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad a Mover
              </label>
              <div className="relative">
                <input
                  id="piezasAMover"
                  name="piezasAMover"
                  type="number"
                  // UX FIX: Si es 0, se muestra vacío para escribir directo
                  value={piezasAMover === 0 ? '' : piezasAMover}
                  onChange={handlePiezasChange}
                  placeholder="0"
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${validationError ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                />
                <button
                  type="button"
                  onClick={() => setPiezasAMover(item.piezas_actuales)}
                  className="absolute right-1 top-1 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-gray-300"
                >
                  Mover todo
                </button>
              </div>
              {validationError && <p className="text-xs text-red-500 mt-1">{validationError}</p>}
            </div>
          )}

          <div className={mode === 'full' ? 'md:col-span-2' : ''}>
            <label htmlFor="destino" className="block text-sm font-medium text-gray-700 mb-1">
              Mover a:
            </label>
            <select
              id="destino"
              name="destino"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {opcionesDestino.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t pt-4 flex justify-end gap-4">
          {error && <p className="text-red-600 text-sm my-auto mr-4">Error: {error}</p>}
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors"
          >
            <Ban size={18} />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving || !!validationError || (mode === 'partial' && piezasAMover === 0)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Truck size={18} />
            {isSaving 
              ? 'Moviendo...' 
              : (mode === 'full' ? 'Mover Lote Completo' : `Mover ${piezasAMover} Piezas`)
            }
          </button>
        </div>
      </form>
    </ModalContainer>
  );
}