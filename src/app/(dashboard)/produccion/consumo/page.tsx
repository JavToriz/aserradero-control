// app/(dashboard)/produccion/consumo/page.tsx
'use client';

import { RegistrarConsumoForm } from '@/components/produccion/RegistrarConsumoForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegistrarConsumoPage() {
  const router = useRouter();

  // Esta función se llamará cuando el formulario se guarde exitosamente
  const handleSaveSuccess = (nuevaOrden: any) => {
    // Idealmente, mostrar un toast de éxito
    console.log('Orden de aserrado guardada:', nuevaOrden);
    // Redirigir al usuario a una página de dashboard de producción (que crearemos después)
    router.push('/produccion');
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        
        {/* Encabezado y botón para regresar */}
        <div className="mb-6">
          <Link href="/produccion" className="flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4">
            <ArrowLeft size={16} className="mr-2" />
            Volver a Producción
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Registrar Consumo de Materia Prima</h1>
          <p className="text-gray-500 mt-1">Registra la materia prima (rollo) que entra al proceso de aserrado.</p>
        </div>

        {/* Contenedor principal del formulario */}
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
          <RegistrarConsumoForm onSaveSuccess={handleSaveSuccess} />
        </div>
      </div>
    </div>
  );
}