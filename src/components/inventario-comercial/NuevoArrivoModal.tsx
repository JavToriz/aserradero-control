'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalContainer } from "@/components/ui/ModalContainer"; 
import { SearchAndCreateInput } from "@/components/ui/SearchAndCreateInput";
import { Loader2, Truck, Box } from "lucide-react";

export default function NuevoArrivoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
  const [nombreProducto, setNombreProducto] = useState('');
  const [formData, setFormData] = useState({ cantidad: "", proveedor: "", fecha: "" });

  const renderProductoItem = (item: any) => (
      <div className="flex flex-col py-1 w-full">
        <span className="font-medium text-sm">{item.descripcion}</span>
        <div className="flex items-center gap-1 text-xs text-blue-600 font-mono">
              SKU: {item.sku || 'S/N'}
        </div>
      </div>
  );

  // --- ALERTA ---
  const handleCreateNew = () => {
    alert(" Por favor crea el producto desde el catálogo principal.");
  };

  const handleSubmit = async () => {
    if (!productoSeleccionado || !formData.cantidad) return alert("Faltan datos");
    setLoading(true);
    try {
      const token = localStorage.getItem('sessionToken');
      const res = await fetch("/api/inventario-comercial/arrivos", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          id_producto: productoSeleccionado.id_producto_catalogo,
          cantidad: formData.cantidad,
          proveedor: formData.proveedor,
          fecha_estimada: formData.fecha
        }),
      });
      if (!res.ok) throw new Error("Error");
      setIsOpen(false);
      window.location.reload(); 
    } catch (error) {
      alert("Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50" onClick={() => setIsOpen(true)}>
        <Truck className="mr-2 h-4 w-4" /> Registrar Pedido
      </Button>

      {isOpen && (
        <ModalContainer title="Registrar Pedido" onClose={() => setIsOpen(false)}>
          <div className="grid gap-4 py-4">
            <SearchAndCreateInput
                label="Producto"
                placeholder="Buscar..."
                // URL SEGURA GRACIAS AL FIX
                searchApiUrl="/api/productos?categoria=TRIPLAY_AGLOMERADO" 
                displayField="descripcion"
                inputValue={nombreProducto}
                onInputChange={(v) => { setNombreProducto(v); setProductoSeleccionado(null); }}
                onSelect={(p) => { setProductoSeleccionado(p); setNombreProducto(p.descripcion); }}
                onCreateNew={handleCreateNew} // <--- ALERTA
                renderItem={renderProductoItem}
            />
            {/* Resto de campos... */}
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Cantidad</Label><Input type="number" value={formData.cantidad} onChange={(e)=>setFormData({...formData, cantidad:e.target.value})}/></div>
                <div className="grid gap-2"><Label>Fecha estimada de llegada</Label><Input type="date" value={formData.fecha} onChange={(e)=>setFormData({...formData, fecha:e.target.value})}/></div>
            </div>
            <div className="grid gap-2"><Label>Proveedor</Label><Input value={formData.proveedor} onChange={(e)=>setFormData({...formData, proveedor:e.target.value})}/></div>
            <Button className="w-full bg-green-600 hover:bg-green-700 mt-4" onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="animate-spin"/> : "Guardar"}
            </Button>
          </div>
        </ModalContainer>
      )}
    </>
  );
}