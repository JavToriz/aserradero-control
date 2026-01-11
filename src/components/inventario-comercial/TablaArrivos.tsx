'use client';

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import FiltroTableros from "@/components/filtros/FiltroTableros"; // Importamos el filtro

interface Arrivo {
  id_arrivo: number;
  cantidad_esperada: number;
  proveedor: string | null;
  fecha_estimada_llegada: string | null;
  producto: { 
      nombre: string; 
      sku: string | null; 
      unidad_medida: string | null;
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

export default function TablaArrivos() {
  const [originalData, setOriginalData] = useState<Arrivo[]>([]);
  const [filteredData, setFilteredData] = useState<Arrivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<number | null>(null);

  const fetchArrivos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('sessionToken');
      const res = await fetch("/api/inventario-comercial/arrivos", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOriginalData(data);
        setFilteredData(data);
      }
    } catch (error) {
      console.error("Error cargando arrivos", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArrivos(); }, []);

  const handleRecepcion = async (id: number, cantidad: number) => {
    setLoadingAction(id);
    const token = localStorage.getItem('sessionToken');
    try {
      const res = await fetch("/api/inventario-comercial/recepcion", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ id_arrivo: id, cantidad: cantidad, ubicacion: 3 })
      });

      if (res.ok) {
         fetchArrivos(); 
      } else {
        alert("Error al recepcionar");
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setLoadingAction(null);
    }
  };

  if (loading) return <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400"/></div>;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-500">
              Mostrando {filteredData.length} pedidos
          </h3>
          <Button variant="ghost" size="sm" onClick={fetchArrivos}><RefreshCw className="h-3 w-3 mr-1"/> Actualizar</Button>
      </div>

      {/* --- INTEGRACIÓN DEL FILTRO --- */}
      <FiltroTableros 
          items={originalData} 
          onFilterChange={(items) => setFilteredData(items as Arrivo[])} 
      />

      {filteredData.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg bg-gray-50">
            No se encontraron pedidos con los filtros actuales.
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden bg-white shadow-sm overflow-x-auto">
            <Table>
                <TableHeader className="bg-gray-50">
                <TableRow>
                    <TableHead className="font-bold text-gray-700 w-[120px]">SKU</TableHead>
                    <TableHead className="font-bold text-gray-700 min-w-[200px]">Producto</TableHead>
                    
                    {/* Nuevas Columnas de Detalle */}
                    <TableHead className="font-bold text-gray-700">Género</TableHead>
                    <TableHead className="font-bold text-gray-700">Tipo</TableHead>
                    

                    <TableHead className="font-bold text-gray-700">Proveedor</TableHead>
                    <TableHead className="font-bold text-gray-700">Cantidad</TableHead>
                    <TableHead className="font-bold text-gray-700">Fecha Est.</TableHead>
                    <TableHead className="font-bold text-gray-700 text-right">Acciones</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredData.map((row) => {
                    const attr = row.producto.atributos;
                    const medidas = attr ? `${attr.espesor_mm}mm  ${attr.ancho_ft}' x ${attr.largo_ft}'` : '-';

                    return (
                        <TableRow key={row.id_arrivo} className="hover:bg-blue-50/50">
                            <TableCell className="text-xs text-muted-foreground font-mono font-medium">
                                {row.producto.sku || "N/A"}
                            </TableCell>
                            <TableCell className="font-medium text-sm text-gray-900">
                                {row.producto.nombre}
                            </TableCell>

                            {/* Celdas de Atributos */}
                            <TableCell className="text-xs text-gray-600 uppercase font-medium">{attr?.genero || '-'}</TableCell>
                            <TableCell className="text-xs text-gray-600 uppercase">{attr?.tipo || '-'}</TableCell>
                          

                            <TableCell>{row.proveedor || "-"}</TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="text-sm font-bold bg-blue-50 text-blue-800 hover:bg-blue-100">
                                    {row.cantidad_esperada} {row.producto.unidad_medida}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-gray-500">
                                {row.fecha_estimada_llegada ? format(new Date(row.fecha_estimada_llegada), "PPP", { locale: es }) : "Sin fecha"}
                            </TableCell>
                            <TableCell className="text-right">
                                <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" disabled={loadingAction === row.id_arrivo} className="border-green-200 text-green-700 hover:bg-green-50 shadow-sm">
                                    {loadingAction === row.id_arrivo ? <Loader2 className="h-4 w-4 animate-spin"/> : <><ArrowDownToLine className="mr-2 h-4 w-4"/> Recibir</>}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Entrada</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Se ingresarán <b>{row.cantidad_esperada}</b> unidades de <b>{row.producto.nombre}</b> a Bodega.
                                        <br/>El pedido se marcará como recibido.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction className="bg-green-600 hover:bg-green-700" onClick={() => handleRecepcion(row.id_arrivo, Number(row.cantidad_esperada))}>
                                        Confirmar Entrada
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    );
                })}
                </TableBody>
            </Table>
        </div>
      )}
    </div>
  );
}