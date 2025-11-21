// app/(dashboard)/produccion/transformado/page.tsx
'use client';

import { RegistrarProduccionForm } from '@/components/produccion/RegistrarProduccionForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegistrarProduccionPage() {
  const router = useRouter();

  const handleSaveSuccess = (resultado: any) => {
    // `resultado` será la respuesta de 'createMany' (ej: { count: 3 })
    console.log('Producción registrada:', resultado);
    alert(`Se registraron ${resultado.count} nuevos lotes de stock.`);
    router.push('/produccion'); // Idealmente a la vista Kanban
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* Encabezado y botón para regresar */}
        <div className="mb-6">
          <Link href="/produccion" className="flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4">
            <ArrowLeft size={16} className="mr-2" />
            Volver a Producción
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Registrar Producto Transformado</h1>
          <p className="text-gray-500 mt-1">Registra las piezas (tablas, vigas, etc.) creadas desde una orden de aserrado.</p>
        </div>

        {/* Contenedor principal del formulario */}
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
          <RegistrarProduccionForm onSaveSuccess={handleSaveSuccess} />
        </div>
      </div>
    </div>
  );
}