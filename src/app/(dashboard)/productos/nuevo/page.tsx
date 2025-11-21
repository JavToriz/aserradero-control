// src/app/(dashboard)/productos/nuevo/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as Tabs from '@radix-ui/react-tabs';
import { ProductForm } from '@/components/productos/ProductForm'; // Asegúrate de que la ruta sea correcta
import { ArrowLeft } from 'lucide-react';

export default function NuevoProductoPage() {
  const [productType, setProductType] = useState<'MADERA_ASERRADA' | 'TRIPLAY_AGLOMERADO'>('MADERA_ASERRADA');
  const router = useRouter();

  // Esta función se ejecutará cuando el formulario guarde exitosamente
  const handleSaveSuccess = () => {
    // Redirige al usuario de vuelta a la lista de productos
    router.push('/productos');
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        
        {/* Encabezado y botón para regresar */}
        <div className="mb-6">
          <Link href="/productos" className="flex items-center text-gray-500 hover:text-gray-800 transition-colors mb-4">
            <ArrowLeft size={18} className="mr-2" />
            Volver a la lista de productos
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Registrar Nuevo Producto</h1>
          <p className="text-gray-500 mt-1">Selecciona el tipo de producto y completa la información.</p>
        </div>

        {/* Contenedor principal del formulario con fondo blanco */}
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
          <Tabs.Root 
            value={productType} 
            onValueChange={(value) => setProductType(value as 'MADERA_ASERRADA' | 'TRIPLAY_AGLOMERADO')}
          >
            {/* Pestañas para seleccionar el tipo de producto */}
            <Tabs.List className="flex border-b mb-6">
              <Tabs.Trigger 
                value="MADERA_ASERRADA" 
                className="px-4 py-2 font-medium text-gray-500 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 focus:outline-none transition-colors"
              >
                🌲 Madera Aserrada
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="TRIPLAY_AGLOMERADO" 
                className="px-4 py-2 font-medium text-gray-500 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 focus:outline-none transition-colors"
              >
                🪵 Triplay y Aglomerado
              </Tabs.Trigger>
            </Tabs.List>
            
            {/* Contenido de las pestañas */}
            <Tabs.Content value="MADERA_ASERRADA">
              <ProductForm 
                productType="MADERA_ASERRADA" 
                onSave={handleSaveSuccess} 
              />
            </Tabs.Content>
            <Tabs.Content value="TRIPLAY_AGLOMERADO">
              <ProductForm 
                productType="TRIPLAY_AGLOMERADO" 
                onSave={handleSaveSuccess} 
              />
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>
    </div>
  );
}