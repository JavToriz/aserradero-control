// components/produccion/StockCard.tsx
// Esta es la "tarjeta" individual que vive en el Kanban

import { StockItem } from '@/app/(dashboard)/produccion/page';
import { Truck, MoveDown } from 'lucide-react';

interface StockCardProps {
  item: StockItem;
  onMoveFullClick: () => void;
  onMovePartialClick: () => void;
}

const formatMedidas = (item: StockItem) => {
  const { producto } = item;
  if (producto.tipo_categoria === 'MADERA_ASERRADA' && producto.atributos_madera) {
      const { grosor_pulgadas, ancho_pulgadas, largo_pies } = producto.atributos_madera;
      return `${grosor_pulgadas}" x ${ancho_pulgadas}" x ${largo_pies}'`;
  }
  if (producto.tipo_categoria === 'TRIPLAY_AGLOMERADO' && producto.atributos_triplay) {
      const { espesor_mm, ancho_ft, largo_ft } = producto.atributos_triplay;
      return `${espesor_mm}mm x ${ancho_ft}' x ${largo_ft}'`;
  }
  return 'N/A';
};

// Nueva función para obtener los detalles extra
const formatDetalles = (item: StockItem) => {
  const { producto } = item;
  if (producto.tipo_categoria === 'MADERA_ASERRADA' && producto.atributos_madera) {
    const { genero, tipo, clasificacion } = producto.atributos_madera;
    // Ej: Pino - Tabla - Primera
    return `${genero || ''} • ${tipo || ''} • ${clasificacion || ''}`;
  }
  if (producto.tipo_categoria === 'TRIPLAY_AGLOMERADO' && producto.atributos_triplay) {
    const { genero, tipo, procedencia } = producto.atributos_triplay;
    return `${genero || ''} • ${tipo || ''} • ${procedencia || ''}`;
  }
  return '';
};

export function StockCard({ item, onMoveFullClick, onMovePartialClick }: StockCardProps) {
  const fechaIngreso = new Date(item.fecha_ingreso).toLocaleDateString();
  const medidas = formatMedidas(item);
  const detalles = formatDetalles(item);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-shadow hover:shadow-md">
      {/* Descripción */}
      <h4 className="font-bold text-gray-800 text-base mb-1">{item.producto.descripcion}</h4>
      
      {/* Detalles Extra (Género, Tipo, Clasificación) */}
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
        {detalles}
      </p>

      {/* Medidas (Destacadas) */}
      <p className="text-sm text-gray-700 bg-gray-100 inline-block px-2 py-0.5 rounded mb-2">
        {medidas}
      </p>

      {/* Piezas y Fecha */}
      <div className="flex justify-between items-center my-2 pt-3 border-t">
        <div className="text-left">
          <span className="text-2xl font-bold text-blue-600">{item.piezas_actuales}</span>
          <span className="text-sm text-gray-500 ml-1">piezas</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Ingresó:</p>
          <p className="text-sm font-medium text-gray-600">{fechaIngreso}</p>
        </div>
      </div>
      
      {/* Botones */}
      <div className="flex gap-2 mt-2">
        <button 
          onClick={onMovePartialClick}
          className="w-full bg-gray-50 text-gray-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors text-sm"
        >
          <MoveDown size={16} />
          Mover Piezas
        </button>

        <button 
          onClick={onMoveFullClick}
          className="w-full bg-blue-50 text-blue-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          <Truck size={16} />
          Mover Lote
        </button>
      </div>
    </div>
  );
}