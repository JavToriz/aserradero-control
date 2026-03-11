// src/components/inventario-comercial/TablaStockComercial.tsx
'use client';

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
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
    atributos?: {
        genero?: string;
        tipo?: string;
        procedencia?: string;
    } | null;
  };
}

export default function TablaStockComercial() {
  const [originalData, setOriginalData] = useState<StockItem[]>([]);
  const [filteredData, setFilteredData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Paginación
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
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStock(); }, []);
  useEffect(() => { setCurrentPage(1); }, [filteredData.length]);

  const totalPiezas = filteredData.reduce((acc, item) => acc + item.cantidad, 0);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentData = filteredData.slice(startIndex, endIndex);

  if (loading) return <div className="py-12 text-center flex flex-col items-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2"/> Cargando inventario...</div>;

  return (
    <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            <h3 className="text-sm font-medium text-gray-500">
                Inventario Físico Actual
            </h3>
            <Button variant="outline" size="sm" onClick={fetchStock} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                <RefreshCw className="h-4 w-4 mr-2"/> Actualizar
            </Button>
        </div>

        <FiltroTableros items={originalData} onFilterChange={setFilteredData} />

        {filteredData.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p>No hay existencias registradas con estos filtros.</p>
             </div>
        ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                <Table>
                <TableHeader className="bg-gray-100/70">
                    <TableRow>
                        <TableHead className="font-bold text-gray-700">SKU</TableHead>
                        <TableHead className="font-bold text-gray-700 min-w-[200px]">Descripción</TableHead>
                        <TableHead className="font-bold text-gray-700">Género</TableHead>
                        <TableHead className="font-bold text-gray-700">Tipo</TableHead>
                        <TableHead className="font-bold text-gray-700">Ubicación</TableHead>
                        <TableHead className="font-bold text-gray-700 text-right">Existencia</TableHead>
                        <TableHead className="font-bold text-gray-700 text-right">Precio Venta</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {currentData.map((item) => {
                        const attr = item.producto.atributos;
                        return (
                            <TableRow key={item.id_stock} className="hover:bg-gray-50">
                                <TableCell className="text-xs text-muted-foreground font-mono font-medium">{item.producto.sku || "N/A"}</TableCell>
                                <TableCell className="font-medium text-sm text-gray-900">{item.producto.nombre}</TableCell>
                                <TableCell className="text-xs text-gray-600 uppercase font-medium">{attr?.genero || '-'}</TableCell>
                                <TableCell className="text-xs text-gray-600 uppercase">{attr?.tipo || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-white text-gray-700 border-gray-300 font-normal">
                                        {item.ubicacion}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className={`font-bold text-base ${item.cantidad < 10 ? 'text-orange-600' : 'text-green-700'}`}>
                                        {item.cantidad}
                                    </span>
                                    <span className="text-[10px] text-gray-400 ml-1 uppercase">{item.producto.unidad_medida}</span>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm text-gray-600">
                                    ${Number(item.producto.precio_venta).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
                </Table>
            </div>
        )}

        {filteredData.length > 0 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-xl shadow-sm mt-4">
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                        Mostrando <span className="font-semibold text-gray-900">{startIndex + 1}</span> a <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredData.length)}</span> de <span className="font-semibold text-gray-900">{filteredData.length}</span> registros
                        </p>
                    </div>
                    <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50">
                                <span className="sr-only">Anterior</span><ChevronLeft className="h-5 w-5" />
                            </button>
                            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">
                                Página {currentPage} de {totalPages}
                            </span>
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50">
                                <span className="sr-only">Siguiente</span><ChevronRight className="h-5 w-5" />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        )}
        
        <div className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex justify-end items-center gap-3 shadow-sm">
            <span className="text-sm text-blue-800 font-medium">Total de Piezas Físicas:</span>
            <Badge className="bg-blue-600 text-white text-lg px-3 py-1">{totalPiezas}</Badge>
        </div>
    </div>
  );
}