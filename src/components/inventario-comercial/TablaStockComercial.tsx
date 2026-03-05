'use client';

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/my-switch";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Calculator, Save, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import FiltroTableros from "@/components/filtros/FiltroTableros";

interface StockItem {
  id_stock: number;
  cantidad: number;
  ubicacion: string;
  producto: { 
    id_producto_catalogo: number; 
    nombre: string; 
    sku: string | null; 
    unidad_medida: string | null; 
    precio_venta: number;
    precio_compra: number; 
    atributos?: {
        genero?: string;
        tipo?: string;
        procedencia?: string;
        espesor_mm?: number;
        ancho_ft?: number;
        largo_ft?: number;
    } | null;
  };
}

export default function TablaStockComercial() {
  const [originalData, setOriginalData] = useState<StockItem[]>([]);
  const [filteredData, setFilteredData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DEL SIMULADOR Y EDICIÓN ---
  const [modoSimulacion, setModoSimulacion] = useState(false);
  const [margenObjetivo, setMargenObjetivo] = useState<number>(30);
  
  // Guardamos los precios que el usuario edita a mano: { [id_producto]: nuevoPrecio }
  const [editedPrices, setEditedPrices] = useState<Record<number, number>>({});
  const [savingProduct, setSavingProduct] = useState<number | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  // --- ESTADOS DE PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const fetchStock = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('sessionToken');
      const res = await fetch("/api/inventario-comercial/stock", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOriginalData(data);
        setFilteredData(data);
        setEditedPrices({}); // Limpiar ediciones pendientes al recargar
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStock(); }, []);

  // Reiniciar la paginación a 1 cuando cambia el filtro
  useEffect(() => { setCurrentPage(1); }, [filteredData.length]);

  const totalPiezas = filteredData.reduce((acc, item) => acc + item.cantidad, 0);

  // --- LÓGICA DE CÁLCULO ---
  const calcularPrecioSugerido = (costo: number, margen: number) => {
    if (!costo || costo <= 0) return 0;
    const decimal = margen / 100;
    if (decimal >= 1) return 0; 
    return costo / (1 - decimal);
  };

  // --- GUARDADO INDIVIDUAL ---
  const handleSavePrice = async (id_producto: number, newPrice: number) => {
    if (!id_producto) return;
    setSavingProduct(id_producto);
    try {
        const token = localStorage.getItem('sessionToken');
        const res = await fetch(`/api/productos/${id_producto}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ precio_venta: newPrice })
        });

        if (res.ok) {
            // Actualizamos la tabla localmente
            const updateList = (list: StockItem[]) => list.map(item => 
                item.producto.id_producto_catalogo === id_producto 
                    ? { ...item, producto: { ...item.producto, precio_venta: newPrice } }
                    : item
            );
            setOriginalData(updateList);
            setFilteredData(updateList);
            
            // Removemos de la lista de ediciones pendientes
            setEditedPrices(prev => {
                const next = { ...prev };
                delete next[id_producto];
                return next;
            });
        } else {
            alert("Error al actualizar el precio.");
        }
    } catch (error) {
        console.error(error);
    } finally {
        setSavingProduct(null);
    }
  };

  // --- GUARDADO EN BLOQUE ---
  const handleBulkSave = async () => {
    if (!confirm(`¿Estás seguro de actualizar los precios de los ${filteredData.length} productos mostrados en pantalla?`)) return;
    
    setIsBulkSaving(true);
    let successCount = 0;
    const token = localStorage.getItem('sessionToken');

    for (const item of filteredData) {
        const idProd = item.producto.id_producto_catalogo;
        if (!idProd) continue;

        const costo = Number(item.producto.precio_compra || 0);
        const precioSugerido = calcularPrecioSugerido(costo, margenObjetivo);
        
        const finalPrice = editedPrices[idProd] !== undefined 
            ? editedPrices[idProd] 
            : Number(precioSugerido.toFixed(2));

        if (finalPrice !== Number(item.producto.precio_venta) && finalPrice > 0) {
            try {
                const res = await fetch(`/api/productos/${idProd}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ precio_venta: finalPrice })
                });
                if (res.ok) successCount++;
            } catch (error) {
                console.error("Error actualizando producto:", idProd);
            }
        }
    }

    if (successCount > 0) {
        alert(`¡Listo! Se actualizaron ${successCount} precios exitosamente.`);
        fetchStock(); 
    } else {
        alert("No hubo cambios necesarios. Todos los precios ya estaban actualizados.");
    }
    setIsBulkSaving(false);
  };

  // --- MATEMÁTICAS DE PAGINACIÓN ---
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentData = filteredData.slice(startIndex, endIndex);

  if (loading) return <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400"/></div>;

  return (
    <div>
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-4">
            <h3 className="text-sm font-medium text-gray-500">
                Mostrando {filteredData.length} registros
            </h3>

            {/* --- CONTROLES DE SIMULACIÓN --- */}
            <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-2 rounded-md border w-full md:w-auto">
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="modo-simulacion" 
                        checked={modoSimulacion}
                        onCheckedChange={setModoSimulacion}
                    />
                    <Label htmlFor="modo-simulacion" className="cursor-pointer flex items-center gap-2 text-sm font-bold">
                        <Calculator className="h-4 w-4 text-blue-600" />
                        {modoSimulacion ? "Pricing Manager Activo" : "Simulador de Ganancias"}
                    </Label>
                </div>

                {modoSimulacion && (
                    <>
                        <div className="flex items-center gap-2 border-l border-gray-300 pl-4 ml-2 animate-in fade-in">
                            <span className="text-xs font-medium text-gray-600">Margen Global %:</span>
                            <Input 
                                type="number" 
                                value={margenObjetivo}
                                onChange={(e) => setMargenObjetivo(Number(e.target.value))}
                                className="w-16 h-8 text-right font-bold text-blue-700 bg-white border-blue-200 focus-visible:ring-blue-500"
                            />
                        </div>
                        
                        {/* Botón de Bulk Update Inteligente */}
                        <Button 
                            onClick={handleBulkSave}
                            disabled={isBulkSaving || filteredData.length === 0}
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700 text-white ml-2 animate-in fade-in"
                        >
                            {isBulkSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4 mr-2" />}
                            Aplicar a los {filteredData.length} filtrados
                        </Button>
                    </>
                )}
                
                <div className="h-6 w-px bg-gray-300 mx-2 hidden md:block"></div>

                <Button variant="ghost" size="sm" onClick={fetchStock} className="text-blue-600 ml-auto md:ml-0">
                    <RefreshCw className="h-4 w-4 mr-1"/> Actualizar
                </Button>
            </div>
        </div>

        <FiltroTableros 
            items={originalData} 
            onFilterChange={setFilteredData} 
        />

        {filteredData.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
                <p>No se encontraron resultados.</p>
             </div>
        ) : (
            <div className="border rounded-md overflow-hidden bg-white shadow-sm overflow-x-auto">
                <Table>
                <TableHeader className="bg-gray-50">
                    <TableRow>
                        <TableHead className="font-bold text-gray-700 w-[120px]">SKU</TableHead>
                        <TableHead className="font-bold text-gray-700 min-w-[200px]">Descripción</TableHead>
                        <TableHead className="font-bold text-gray-700">Género</TableHead>
                        <TableHead className="font-bold text-gray-700">Tipo</TableHead>
                        
                        {modoSimulacion && (
                             <TableHead className="font-bold text-gray-600 text-right bg-yellow-50">Costo</TableHead>
                        )}

                        <TableHead className="font-bold text-gray-700 text-right">Precio Actual</TableHead>

                        {modoSimulacion && (
                            <>
                                <TableHead className="font-bold text-blue-700 bg-blue-50 text-center">Nuevo Precio (Editable)</TableHead>
                                <TableHead className="font-bold text-green-700 text-right bg-green-50">Ganancia</TableHead>
                            </>
                        )}

                        <TableHead className="font-bold text-gray-700 text-right">Existencia</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {currentData.map((item) => {
                        const attr = item.producto.atributos;
                        const idProd = item.producto.id_producto_catalogo;

                        // Cálculos
                        const costo = Number(item.producto.precio_compra || 0);
                        const precioActual = Number(item.producto.precio_venta || 0);
                        
                        // Sugerido por la fórmula
                        const precioSugeridoFormula = calcularPrecioSugerido(costo, margenObjetivo);
                        
                        // Precio que se muestra en el Input (El editado por el usuario, o el sugerido)
                        const precioSugeridoDisplay = editedPrices[idProd] !== undefined 
                            ? editedPrices[idProd] 
                            : Number(precioSugeridoFormula.toFixed(2));
                        
                        // Ganancia real basada en el precio del input
                        const ganancia = precioSugeridoDisplay - costo;
                        
                        // Alertas y estados visuales
                        const requiereAtencion = modoSimulacion && precioActual < precioSugeridoFormula;
                        const tieneCambiosPendientes = modoSimulacion && precioSugeridoDisplay !== precioActual;
                        const isSavingRow = savingProduct === idProd;

                        return (
                            <TableRow key={item.id_stock} className="hover:bg-blue-50/40">
                                <TableCell className="text-xs text-muted-foreground font-mono font-medium">
                                    {item.producto.sku || "N/A"}
                                </TableCell>
                                <TableCell className="font-medium text-sm text-gray-900">
                                    {item.producto.nombre}
                                </TableCell>
                                <TableCell className="text-xs text-gray-600 uppercase font-medium">{attr?.genero || '-'}</TableCell>
                                <TableCell className="text-xs text-gray-600 uppercase">{attr?.tipo || '-'}</TableCell>

                                {modoSimulacion && (
                                    <TableCell className="text-right font-mono text-xs text-gray-500 bg-yellow-50/30 border-l">
                                        ${costo.toFixed(2)}
                                    </TableCell>
                                )}

                                <TableCell className="text-right font-mono text-sm text-gray-800">
                                    ${precioActual.toFixed(2)}
                                    {requiereAtencion && <span className="block text-[10px] text-red-500 font-medium">Margen bajo</span>}
                                </TableCell>

                                {modoSimulacion && (
                                    <>
                                        <TableCell className="bg-blue-50/30 border-l border-r p-2 align-middle">
                                            <div className="flex items-center justify-center gap-1">
                                                <span className="text-gray-400 text-xs">$</span>
                                                <Input 
                                                    type="number"
                                                    step="0.01"
                                                    className={`h-8 w-24 text-right font-bold font-mono text-sm ${tieneCambiosPendientes ? 'border-blue-400 ring-1 ring-blue-100 bg-white' : 'bg-transparent border-transparent hover:border-gray-300'}`}
                                                    value={precioSugeridoDisplay}
                                                    onChange={(e) => setEditedPrices({ ...editedPrices, [idProd]: Number(e.target.value) })}
                                                />
                                                {/* Botón de Guardado Individual */}
                                                {tieneCambiosPendientes && idProd > 0 && (
                                                    <Button 
                                                        size="icon" 
                                                        variant="ghost" 
                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-100 hover:text-blue-800 animate-in zoom-in"
                                                        disabled={isSavingRow}
                                                        onClick={() => handleSavePrice(idProd, precioSugeridoDisplay)}
                                                        title="Guardar este precio"
                                                    >
                                                        {isSavingRow ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs text-green-700 bg-green-50/30">
                                            ${ganancia.toFixed(2)}
                                        </TableCell>
                                    </>
                                )}

                                <TableCell className="text-right border-l">
                                    <span className={`font-bold text-base ${item.cantidad < 10 ? 'text-orange-600' : 'text-green-700'}`}>
                                        {item.cantidad}
                                    </span>
                                    <span className="text-[10px] text-gray-400 ml-1 uppercase">{item.producto.unidad_medida}</span>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
                </Table>
            </div>
        )}

        {/* --- CONTROLES DE PAGINACIÓN MODERNOS --- */}
        {filteredData.length > 0 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 border rounded-b-md shadow-sm mt-4">
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                        Mostrando <span className="font-semibold text-gray-900">{startIndex + 1}</span> a <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredData.length)}</span> de <span className="font-semibold text-gray-900">{filteredData.length}</span> registros
                        </p>
                    </div>
                    <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                        >
                            <span className="sr-only">Anterior</span>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        
                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0">
                            Página {currentPage} de {totalPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                        >
                            <span className="sr-only">Siguiente</span>
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                        </nav>
                    </div>
                </div>
            </div>
        )}
        
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-100 flex justify-end items-center gap-2 shadow-sm">
            <span className="text-sm text-blue-800 font-medium">Total de Piezas en Inventario:</span>
            <b className="text-blue-900 text-xl">{totalPiezas}</b>
        </div>
    </div>
  );
}