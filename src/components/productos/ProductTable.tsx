// src/components/productos/ProductTable.tsx
import { Pencil, Trash2, Save, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type Product = {
  id_producto_catalogo: number;
  descripcion: string; 
  tipo_categoria: any; 
  precio_compra?: number;
  precio_venta: number;
  [key: string]: any; 
};

interface ProductTableProps {
  products: Product[];
  type: 'madera' | 'triplay';
  onEdit: (product: Product) => void;   
  onDelete: (product: Product) => void; 
  modoSimulacion?: boolean;
  margenObjetivo?: number;
  editedPrices?: Record<number, number>;
  setEditedPrices?: (prices: Record<number, number>) => void;
  onSavePrice?: (id: number, price: number) => void;
  savingProduct?: number | null;
}

// Función helper para formatear las medidas
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

// Fórmula de Marcaje (Costo + %) para el simulador
const calcularPrecioSugerido = (costo: number, porcentajeGanancia: number) => {
    if (!costo || costo <= 0) return 0;
    const decimal = porcentajeGanancia / 100;
    return costo * (1 + decimal); 
};

// --- CORRECCIÓN: Calcula el marcaje (Markup) real para la vista normal ---
const calculateMarkup = (venta: number, compra: number | null | undefined): string => {
  const precioVenta = Number(venta);
  const precioCompra = Number(compra);
  if (!precioVenta || precioVenta <= 0 || !precioCompra || precioCompra <= 0) return 'N/A';
  
  // Fórmula de Marcaje: ((Venta / Costo) - 1) * 100
  const markup = ((precioVenta / precioCompra) - 1) * 100;
  return markup.toFixed(2) + '%';
};

const getMarginStyle = (venta: number, compra: number | null | undefined): string => {
    const precioVenta = Number(venta);
    const precioCompra = Number(compra);
    if (!precioVenta || precioVenta <= 0 || !precioCompra || precioCompra <= 0) return 'text-gray-500';
    
    const markup = ((precioVenta / precioCompra) - 1) * 100;
    if (markup < 15) return 'text-red-600 font-semibold';
    if (markup < 30) return 'text-yellow-600 font-semibold';
    return 'text-green-600 font-semibold';
}
// --------------------------------------------------------------------------

export const ProductTable = ({ 
    products, type, onEdit, onDelete,
    modoSimulacion = false, margenObjetivo = 30, editedPrices = {}, setEditedPrices, onSavePrice, savingProduct
}: ProductTableProps) => {
    
    // Bandera para saber si estamos en modo simulador activo (solo válido para triplay)
    const isSimulacionActiva = type === 'triplay' && modoSimulacion;

    return (
        <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-200">
            <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
                    <tr>
                        <th scope="col" className="px-6 py-3">SKU</th>
                        <th scope="col" className="px-6 py-3">Descripción</th>
                        <th scope="col" className="px-6 py-3">Género</th>
                        <th scope="col" className="px-6 py-3">Tipo</th>
                        {type === 'madera' && <th scope="col" className="px-6 py-3">Clasificación</th>}
                        {type === 'triplay' && <th scope="col" className="px-6 py-3">Procedencia</th>}
                        <th scope="col" className="px-6 py-3">Medidas</th>
                        
                        {/* Columnas dinámicas de Precios */}
                        {isSimulacionActiva ? (
                            <>
                                <th scope="col" className="px-6 py-3 text-right bg-yellow-50 text-gray-800">Costo Base</th>
                                <th scope="col" className="px-6 py-3 text-right text-gray-800">Precio Actual</th>
                                <th scope="col" className="px-6 py-3 text-center bg-blue-50 text-blue-800">Nuevo Precio</th>
                                <th scope="col" className="px-6 py-3 text-right bg-green-50 text-green-800">Ganancia $</th>
                            </>
                        ) : (
                            <>
                                {type === 'triplay' && <th scope="col" className="px-6 py-3 text-right">Costo</th>}
                                <th scope="col" className="px-6 py-3 text-right text-blue-700">Precio Venta</th>
                                {type === 'triplay' && (
                                    <>
                                        <th scope="col" className="px-6 py-3 text-right text-purple-700">IVA (16%)</th>
                                        <th scope="col" className="px-6 py-3 text-right text-green-700">Precio c/IVA</th>
                                        <th scope="col" className="px-6 py-3 text-right">Margen %</th>
                                    </>
                                )}
                            </>
                        )}
                        <th scope="col" className="px-6 py-3 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => {
                        const idProd = product.id_producto_catalogo;
                        const costo = Number(product.precio_compra || 0);
                        const precioActual = Number(product.precio_venta || 0);

                        // Lógica del simulador (Solo se usa si isSimulacionActiva es true)
                        const precioSugeridoFormula = calcularPrecioSugerido(costo, margenObjetivo);
                        const precioSugeridoDisplay = editedPrices[idProd] !== undefined 
                            ? editedPrices[idProd] 
                            : Number(precioSugeridoFormula.toFixed(2));
                        const ganancia = precioSugeridoDisplay - costo;
                        const tieneCambiosPendientes = isSimulacionActiva && precioSugeridoDisplay !== precioActual;
                        const isSavingRow = savingProduct === idProd;

                        return (
                            <tr key={idProd} className="bg-white border-b hover:bg-gray-50/80 transition-colors">
                                <td className="px-6 py-4 font-mono font-medium text-xs text-gray-500">{product.sku}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">{product.descripcion}</td>
                                <td className="px-6 py-4 text-xs uppercase">{type === 'madera' ? product.atributos_madera?.genero : product.atributos_triplay?.genero}</td>
                                <td className="px-6 py-4 text-xs uppercase">{type === 'madera' ? product.atributos_madera?.tipo : product.atributos_triplay?.tipo}</td>
                                {type === 'madera' && <td className="px-6 py-4 text-xs uppercase">{product.atributos_madera?.clasificacion}</td>}
                                {type === 'triplay' && <td className="px-6 py-4 text-xs uppercase">{product.atributos_triplay?.procedencia}</td>}
                                <td className="px-6 py-4 text-xs text-gray-500">{formatMedidas(product, type)}</td>
                                
                                {/* Celdas Dinámicas de Precios */}
                                {isSimulacionActiva ? (
                                    <>
                                        <td className="px-6 py-4 text-right font-mono text-xs text-gray-600 bg-yellow-50/30 border-l border-yellow-100">
                                            ${costo.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-sm text-gray-800">
                                            ${precioActual.toFixed(2)}
                                        </td>
                                        <td className="px-2 py-4 align-middle bg-blue-50/30 border-l border-r border-blue-100">
                                            <div className="flex items-center justify-center gap-1">
                                                <span className="text-gray-400 text-xs">$</span>
                                                <Input 
                                                    type="number" step="0.01"
                                                    className={`h-8 w-24 text-right font-bold font-mono text-sm ${tieneCambiosPendientes ? 'border-blue-400 ring-1 ring-blue-100 bg-white' : 'bg-transparent border-transparent hover:border-gray-300'}`}
                                                    value={precioSugeridoDisplay}
                                                    onChange={(e) => setEditedPrices && setEditedPrices({ ...editedPrices, [idProd]: Number(e.target.value) })}
                                                />
                                                {tieneCambiosPendientes && idProd > 0 && onSavePrice && (
                                                    <Button 
                                                        size="icon" variant="ghost" 
                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-100 animate-in zoom-in"
                                                        disabled={isSavingRow}
                                                        onClick={() => onSavePrice(idProd, precioSugeridoDisplay)}
                                                    >
                                                        {isSavingRow ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-xs text-green-700 bg-green-50/30">
                                            ${ganancia.toFixed(2)}
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        {type === 'triplay' && <td className="px-6 py-4 text-right font-mono text-gray-500">${costo.toFixed(2)}</td>}
                                        <td className="px-6 py-4 text-right font-mono font-bold text-blue-700">${precioActual.toFixed(2)}</td>
                                        {type === 'triplay' && (
                                            <>
                                                <td className="px-6 py-4 text-right font-mono text-purple-700">${(precioActual * 0.16).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-green-700">${(precioActual * 1.16).toFixed(2)}</td>
                                                <td className={`px-6 py-4 text-right ${getMarginStyle(precioActual, costo)}`}>
                                                    {calculateMarkup(precioActual, costo)} {/* <-- Función corregida */}
                                                </td>
                                            </>
                                        )}
                                    </>
                                )}

                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-3">
                                        <button onClick={() => onEdit(product)} className="text-blue-600 hover:text-blue-800 transition-colors" title="Editar detalles">
                                            <Pencil size={18} />
                                        </button>
                                        <button onClick={() => onDelete(product)} className="text-red-500 hover:text-red-700 transition-colors" title="Eliminar producto">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};