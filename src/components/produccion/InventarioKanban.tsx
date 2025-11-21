// components/produccion/InventarioKanban.tsx
// Este componente renderiza las 4 columnas (PRODUCCIÓN, SECADO, etc.)
import { StockItem } from '@/app/(dashboard)/produccion/page';
import { StockCard } from './StockCard';
import { Factory, Sun, Archive, Store } from 'lucide-react';

interface InventarioKanbanProps {
  stockItems: StockItem[];
  // --- PROPS ACTUALIZADAS ---
  onMoveFullItem: (item: StockItem) => void;
  onMovePartialItem: (item: StockItem) => void;
}

// Definimos las columnas
const COLUMNAS = [
  { id: 'PRODUCCION', titulo: 'Producción', icon: <Factory size={20} /> },
  { id: 'SECADO', titulo: 'Secado', icon: <Sun size={20} /> },
  { id: 'BODEGA', titulo: 'Bodega', icon: <Archive size={20} /> },
  { id: 'ANAQUELES', titulo: 'Anaqueles (Venta)', icon: <Store size={20} /> }, // <-- Corregido
];

export function InventarioKanban({ stockItems, onMoveFullItem, onMovePartialItem }: InventarioKanbanProps) {
  
  // Agrupamos los items por ubicación
  const itemsPorColumna = {
    PRODUCCION: stockItems.filter(item => item.ubicacion === 'PRODUCCION'),
    SECADO: stockItems.filter(item => item.ubicacion === 'SECADO'),
    BODEGA: stockItems.filter(item => item.ubicacion === 'BODEGA'),
    ANAQUELES: stockItems.filter(item => item.ubicacion === 'ANAQUELES'),
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {COLUMNAS.map(col => (
        <div key={col.id} className="bg-gray-100 rounded-lg p-4 h-full min-h-[300px]">
          {/* Encabezado de Columna */}
          <div className="flex items-center gap-3 mb-4 border-b pb-3">
            <span className="text-gray-600">{col.icon}</span>
            <h3 className="font-semibold text-gray-700 uppercase">{col.titulo}</h3>
            <span className="ml-auto text-sm font-bold text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
              {itemsPorColumna[col.id as keyof typeof itemsPorColumna].length}
            </span>
          </div>
          
          {/* Tarjetas de Stock */}
          <div className="space-y-4">
            {itemsPorColumna[col.id as keyof typeof itemsPorColumna].length > 0 ? (
              itemsPorColumna[col.id as keyof typeof itemsPorColumna].map(item => (
                <StockCard 
                  key={item.id_stock} 
                  item={item} 
                  // --- PROPS ACTUALIZADAS ---
                  onMoveFullClick={() => onMoveFullItem(item)}
                  onMovePartialClick={() => onMovePartialItem(item)}
                />
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center pt-8">Vacío</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}