import { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, Truck } from "lucide-react";
// Importamos los componentes que ahora son inteligentes (Data Fetching propio)
import TablaArrivos from "@/components/inventario-comercial/TablaArrivos";
import TablaStockComercial from "@/components/inventario-comercial/TablaStockComercial";
import NuevoArrivoModal from "@/components/inventario-comercial/NuevoArrivoModal";
import NuevaEntradaDirectaModal from "@/components/inventario-comercial/NuevaEntradaDirectaModal";

export const metadata: Metadata = {
  title: "Inventario Comercial | Aserradero",
};

export default function InventarioComercialPage() {
  // Ya no necesitamos cargar datos aquí, ni tener IDs hardcodeados.
  // La seguridad la manejan las APIs y los componentes cliente.

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventario</h2>
          <p className="text-muted-foreground">
            Gestión de Triplay y Aglomerados.
          </p>
        </div>
        
        <div className="flex gap-2">
            {/* Los modales ya saben qué hacer con el token del usuario */}
            <NuevoArrivoModal />
            <NuevaEntradaDirectaModal />
        </div>
      </div>

      <Tabs defaultValue="existencias" className="space-y-4">
        <TabsList>
          <TabsTrigger value="existencias" className="flex gap-2">
            <Package className="h-4 w-4" />
            En Bodega
          </TabsTrigger>
          <TabsTrigger value="transito" className="flex gap-2">
            <Truck className="h-4 w-4" />
            Pedidos / Arrivos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="existencias">
          <Card>
            <CardContent>
              <TablaStockComercial />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transito">
          <Card>
             <CardHeader>
              <CardTitle>En Tránsito</CardTitle>
              <CardDescription>
                Mercancía solicitada pendiente de recepción.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TablaArrivos />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}