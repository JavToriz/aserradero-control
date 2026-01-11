'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalContainer } from "@/components/ui/ModalContainer"; 
import { SearchAndCreateInput } from "@/components/ui/SearchAndCreateInput";
import { Loader2, PackagePlus, Box } from "lucide-react";

// Tipos definidos localmente
type ProductoCatalogo = { 
  id_producto_catalogo: number; 
  descripcion: string; 
  sku?: string; 
  tipo_categoria: 'MADERA_ASERRADA' | 'TRIPLAY_AGLOMERADO';
  atributos_triplay?: { espesor_mm: number; ancho_ft: number; largo_ft: number } | null;
  [key: string]: any 
};

export default function NuevaEntradaDirectaModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoCatalogo | null>(null);
  const [nombreProducto, setNombreProducto] = useState('');
  const [cantidad, setCantidad] = useState('');

  const renderProductoItem = (item: ProductoCatalogo) => {
    let medidas = '';
    if (item.atributos_triplay) {
      const { espesor_mm, ancho_ft, largo_ft } = item.atributos_triplay;
      medidas = `${espesor_mm}mm x ${ancho_ft}' x ${largo_ft}'`;
    }
    return (
      <div className="flex flex-col py-1 w-full">
        <span className="font-medium text-gray-800 text-sm truncate">{item.descripcion}</span>
        <div className="flex justify-between items-center mt-0.5">
          <div className="flex items-center gap-1 text-xs text-blue-600 font-mono">
              <span>SKU: {item.sku || 'S/N'}</span>
          </div>
          {medidas && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">{medidas}</span>}
        </div>
      </div>
    );
  };

  // --- NUEVA FUNCIÓN PARA LA ALERTA ---
  const handleCreateNew = () => {
    alert("Para registrar un nuevo producto de Triplay/Aglomerado, por favor dirígete a la sección de 'Productos' en el menú principal.");
  };

  const handleSubmit = async () => {
    if (!productoSeleccionado || !cantidad) {
      alert("Selecciona un producto y una cantidad");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('sessionToken');
      const res = await fetch("/api/inventario-comercial/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          id_producto: productoSeleccionado.id_producto_catalogo,
          cantidad: cantidad,
          ubicacion: 3 
        }),
      });
      if (!res.ok) throw new Error("Error");
      setIsOpen(false);
      window.location.reload(); 
    } catch (error) {
      alert("Ocurrió un error al registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setIsOpen(true)}>
        <PackagePlus className="mr-2 h-4 w-4" /> Agregar inventario 
      </Button>

      {isOpen && (
        <ModalContainer title="Entrada Directa a Bodega" onClose={() => setIsOpen(false)}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <SearchAndCreateInput<ProductoCatalogo>
                  label="Buscar Producto"
                  placeholder="Escribe nombre o SKU..."
                  // GRACIAS AL FIX DEL HOOK, ESTO YA FUNCIONA PERFECTO:
                  searchApiUrl="/api/productos?categoria=TRIPLAY_AGLOMERADO" 
                  displayField="descripcion"
                  inputValue={nombreProducto}
                  onInputChange={(v) => { setNombreProducto(v); setProductoSeleccionado(null); }}
                  onSelect={(p) => { setProductoSeleccionado(p); setNombreProducto(p.descripcion); }}
                  onCreateNew={handleCreateNew} // <--- PASAMOS LA ALERTA
                  renderItem={renderProductoItem}
              />
            </div>
            <div className="grid gap-2">
              <Label>Cantidad (Piezas/Hojas)</Label>
              <Input type="number" placeholder="Ej. 50" className="text-lg font-bold" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
            </div>
            <div className="flex justify-end pt-2">
              <Button className="bg-green-600 hover:bg-green-700 w-full" onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirmar Ingreso
              </Button>
            </div>
          </div>
        </ModalContainer>
      )}
    </>
  );
}