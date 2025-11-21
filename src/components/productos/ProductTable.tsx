// components/productos/ProductTable.tsx
// Este componente mostrará los datos y se adaptará según el tipo de producto.
import { Pencil, Trash2, Boxes, History } from 'lucide-react';

// Define el tipo para los productos y las funciones de callback
type Product = {
  id_producto_catalogo: number;
  //stock: number;
  [key: string]: any; // Permite otras propiedades
};

interface ProductTableProps {
  products: Product[];
  type: 'madera' | 'triplay';
  onEdit: (product: Product) => void;   // Función para editar
  onDelete: (product: Product) => void; // Función para eliminar
  //onAdjustStock: (product: Product) => void;
  //onShowHistory: (product: Product) => void;
}

// Función helper para formatear las medidas (sin cambios)
const formatMedidas = (product: any, type: 'madera' | 'triplay') => {
    if (type === 'madera' && product.atributos_madera) {
        const { grosor_pulgadas, ancho_pulgadas, largo_pies } = product.atributos_madera;
        return `${grosor_pulgadas}" x ${ancho_pulgadas}" x ${largo_pies}'`;
    }
    if (type === 'triplay' && product.atributos_triplay) {
        const { espesor_mm, ancho_ft, largo_ft } = product.atributos_triplay;
        return `${espesor_mm}mm x ${ancho_ft}' x ${largo_ft}'`;
    }
    return 'N/A';
};
/* Nueva función para obtener el estilo del stock
const getStockStyle = (stock: number) => {
  const stockValue = Number(stock);
  if (stockValue < 20) {
    return 'text-red-600 font-bold';
  }
  if (stockValue >= 20 && stockValue <= 60) {
    return 'text-yellow-600 font-bold';
  }
  return 'text-green-600 font-bold';
};
*/

// =========== Funciones para obtener margen de ganancia ===========

/**
 * Calcula el margen de ganancia en porcentaje.
 * @param venta Precio de venta del producto.
 * @param compra Precio de compra del producto.
 * @returns El margen como un string formateado (ej: "25.00%") o "N/A".
 */
const calculateMargin = (venta: number, compra: number | null | undefined): string => {
  const precioVenta = Number(venta);
  const precioCompra = Number(compra);

  if (!precioVenta || precioVenta <= 0 || precioCompra < 0) {
    return 'N/A';
  }

  const margin = ((precioVenta - precioCompra) / precioVenta) * 100;
  return margin.toFixed(2) + '%';
};

/**
 * Devuelve una clase de CSS basada en el valor del margen.
 * @param venta Precio de venta.
 * @param compra Precio de compra.
 * @returns Una cadena con la clase de Tailwind CSS.
 */
const getMarginStyle = (venta: number, compra: number | null | undefined): string => {
    const precioVenta = Number(venta);
    const precioCompra = Number(compra);

    if (!precioVenta || precioVenta <= 0 || precioCompra < 0) {
        return 'text-gray-500';
    }
    const margin = ((precioVenta - precioCompra) / precioVenta) * 100;

    if (margin < 15) return 'text-red-600 font-semibold';
    if (margin < 30) return 'text-yellow-600 font-semibold';
    return 'text-green-600 font-semibold';
}

// =======================================================


export const ProductTable = ({ products, type, onEdit, onDelete }: ProductTableProps) => {
    return (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                        <th scope="col" className="px-6 py-3">SKU</th>
                        <th scope="col" className="px-6 py-3">Descripción</th>
                        <th scope="col" className="px-6 py-3">Género</th>
                        <th scope="col" className="px-6 py-3">Tipo</th>
                        {type === 'madera' && <th scope="col" className="px-6 py-3">Clasificación</th>}
                        {type === 'triplay' && <th scope="col" className="px-6 py-3">Procedencia</th>}
                        <th scope="col" className="px-6 py-3">Medidas</th>
                        {type === 'triplay' && <th scope="col" className="px-6 py-3">Precio compra</th>}
                        <th scope="col" className="px-6 py-3">Precio Venta</th>
                        {type === 'triplay' && <th scope="col" className="px-6 py-3">Margen (%)</th>}
                        <th scope="col" className="px-6 py-3">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product.id_producto_catalogo} className="bg-white border-b hover:bg-gray-50">
                            {/* ... Celdas de datos sin cambios ... */}
                            <td className="px-6 py-4 font-medium">{product.sku}</td>
                            <td className="px-6 py-4">{product.descripcion}</td>
                            <td className="px-6 py-4">{type === 'madera' ? product.atributos_madera?.genero : product.atributos_triplay?.genero}</td>
                            <td className="px-6 py-4">{type === 'madera' ? product.atributos_madera?.tipo : product.atributos_triplay?.tipo}</td>
                            {type === 'madera' && <td className="px-6 py-4">{product.atributos_madera?.clasificacion}</td>}
                            {type === 'triplay' && <td className="px-6 py-4">{product.atributos_triplay?.procedencia}</td>}
                            <td className="px-6 py-4">{formatMedidas(product, type)}</td>
                            {type === 'triplay' && <td className="px-6 py-4">${product.precio_compra}</td>}
                            <td className="px-6 py-4">${product.precio_venta}</td>
                            {type === 'triplay' && (
                                <td className={`px-6 py-4 ${getMarginStyle(product.precio_venta, product.precio_compra)}`}>
                                    {calculateMargin(product.precio_venta, product.precio_compra)}
                                </td>
                            )}
                            {/*<td className="px-6 py-4">
                              <span className={getStockStyle(product.stock)}>
                                {product.stock}
                              </span> {product.unidad_medida}
                            </td> */}
                            <td className="px-6 py-4 flex gap-4">
                                {/*<button 
                                  onClick={() => onAdjustStock(product)} 
                                  className="text-gray-600 hover:text-indigo-800"
                                  title="Ajustar Stock"
                                >
                                  <Boxes size={18} />
                                </button>
                                <button 
                                  onClick={() => onShowHistory(product)} 
                                  className="text-gray-600 hover:text-purple-800"
                                  title="Ver Historial"
                                >
                                  <History size={18} />
                                </button> */}
                                <button 
                                    onClick={() => onEdit(product)} 
                                    className="text-blue-600 hover:text-blue-800"
                                    aria-label="Editar producto"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button 
                                    onClick={() => onDelete(product)} 
                                    className="text-red-600 hover:text-red-800"
                                    aria-label="Eliminar producto"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};