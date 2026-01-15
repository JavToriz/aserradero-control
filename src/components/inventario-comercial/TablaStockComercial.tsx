'use client';

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// --- NUEVOS IMPORTS NECESARIOS ---
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/my-switch";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Calculator } from "lucide-react";
// ---------------------------------
import FiltroTableros from "@/components/filtros/FiltroTableros";

interface StockItem {
  id_stock: number;
  cantidad: number;
  ubicacion: string;
  producto: { 
    nombre: string; 
    sku: string | null; 
    unidad_medida: string | null; 
    precio_venta: number;
    precio_compra: number; // <--- AÑADIDO: Necesario para el cálculo
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

  // --- NUEVOS ESTADOS ---
  const [modoSimulacion, setModoSimulacion] = useState(false);
  const [margenObjetivo, setMargenObjetivo] = useState<number>(30);
  // ----------------------

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

  const totalPiezas = filteredData.reduce((acc, item) => acc + item.cantidad, 0);

  // --- LÓGICA DE CÁLCULO AÑADIDA ---
  const calcularPrecioSugerido = (costo: number, margen: number) => {
    if (!costo || costo <= 0) return 0;
    const decimal = margen / 100;
    if (decimal >= 1) return 0; 
    return costo / (1 - decimal);
  };
  // ---------------------------------

  if (loading) return <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400"/></div>;

  return (
    <div>
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-4">
            <h3 className="text-sm font-medium text-gray-500">
                Mostrando {filteredData.length} registros
            </h3>

            {/* --- CONTROLES DE SIMULACIÓN AÑADIDOS --- */}
            <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-md border">
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="modo-simulacion" 
                        checked={modoSimulacion}
                        onCheckedChange={setModoSimulacion}
                    />
                    <Label htmlFor="modo-simulacion" className="cursor-pointer flex items-center gap-2 text-sm">
                        <Calculator className="h-4 w-4 text-blue-600" />
                        {modoSimulacion ? "Ocultar Análisis" : "Margen de Ganancia"}
                    </Label>
                </div>

                {modoSimulacion && (
                    <div className="flex items-center gap-2 border-l pl-4 ml-2 animate-in fade-in">
                        <span className="text-xs font-medium text-gray-600">Margen %:</span>
                        <Input 
                            type="number" 
                            value={margenObjetivo}
                            onChange={(e) => setMargenObjetivo(Number(e.target.value))}
                            className="w-16 h-8 text-right"
                        />
                    </div>
                )}
                
                <div className="h-6 w-px bg-gray-300 mx-2"></div>

                <Button variant="ghost" size="sm" onClick={fetchStock} className="text-blue-600">
                    <RefreshCw className="h-3 w-3 mr-1"/> Actualizar
                </Button>
            </div>
            {/* ---------------------------------------- */}
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
                        <TableHead className="font-bold text-gray-700">Procedencia</TableHead>
                        
                        <TableHead className="font-bold text-gray-700">Ubicación</TableHead>

                        {/* --- COLUMNAS CONDICIONALES --- */}
                        {modoSimulacion && (
                             <TableHead className="font-bold text-gray-600 text-right bg-yellow-50">Costo</TableHead>
                        )}
                        {/* ------------------------------ */}

                        <TableHead className="font-bold text-gray-700 text-right">Precio Actual</TableHead>

                        {/* --- COLUMNAS CONDICIONALES --- */}
                        {modoSimulacion && (
                            <>
                                <TableHead className="font-bold text-blue-700 text-right bg-blue-50">Sugerido ({margenObjetivo}%)</TableHead>
                                <TableHead className="font-bold text-green-700 text-right bg-green-50">Ganancia</TableHead>
                            </>
                        )}
                        {/* ------------------------------ */}

                        <TableHead className="font-bold text-gray-700 text-right">Existencia</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.map((item) => {
                        const attr = item.producto.atributos;
                        // const medidas = attr ? `${attr.espesor_mm}mm  ${attr.ancho_ft}' x ${attr.largo_ft}'` : '-'; // (Nota: esta variable no se usaba en tu render, la dejé comentada o la puedes quitar)

                        // --- CÁLCULOS AÑADIDOS ---
                        const costo = Number(item.producto.precio_compra || 0);
                        const precioSugerido = calcularPrecioSugerido(costo, margenObjetivo);
                        const ganancia = precioSugerido - costo;
                        const alerta = modoSimulacion && item.producto.precio_venta < precioSugerido;
                        // -------------------------

                        return (
                            <TableRow key={item.id_stock} className="hover:bg-blue-50/50">
                                <TableCell className="text-xs text-muted-foreground font-mono font-medium">
                                    {item.producto.sku || "N/A"}
                                </TableCell>
                                <TableCell className="font-medium text-sm text-gray-900">
                                    {item.producto.nombre}
                                </TableCell>
                                
                                <TableCell className="text-xs text-gray-600 uppercase font-medium">{attr?.genero || '-'}</TableCell>
                                <TableCell className="text-xs text-gray-600 uppercase">{attr?.tipo || '-'}</TableCell>
                                <TableCell className="text-xs text-gray-600 uppercase">{attr?.procedencia || '-'}</TableCell>

                                <TableCell>
                                    <Badge variant="outline" className="bg-white text-gray-700 border-gray-300 font-normal">
                                        {item.ubicacion}
                                    </Badge>
                                </TableCell>

                                {/* --- CELDA COSTO (CONDICIONAL) --- */}
                                {modoSimulacion && (
                                    <TableCell className="text-right font-mono text-xs text-gray-500 bg-yellow-50/30">
                                        ${costo.toFixed(2)}
                                    </TableCell>
                                )}
                                {/* --------------------------------- */}

                                <TableCell className="text-right font-mono text-xs text-gray-600">
                                    ${Number(item.producto.precio_venta).toFixed(2)}
                                </TableCell>

                                {/* --- CELDAS CÁLCULO (CONDICIONAL) --- */}
                                {modoSimulacion && (
                                    <>
                                        <TableCell className="text-right font-mono text-xs font-bold text-blue-700 bg-blue-50/30">
                                            ${precioSugerido.toFixed(2)}
                                            {alerta && <span className="block text-[9px] text-red-500 font-normal">Bajo</span>}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs text-green-700 bg-green-50/30">
                                            ${ganancia.toFixed(2)}
                                        </TableCell>
                                    </>
                                )}
                                {/* ------------------------------------ */}

                                <TableCell className="text-right">
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
        
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-100 flex justify-end items-center gap-2">
            <span className="text-sm text-blue-800">Total Inventario:</span>
            <b className="text-blue-900 text-xl">{totalPiezas}</b>
        </div>
    </div>
  );
}