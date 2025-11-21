// app/(dashboard)/remisiones/nueva/page.tsx
'use client';

import { NuevaRemisionForm } from '@/components/remisiones/NuevaRemisionForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NuevaRemisionPage() {
  const router = useRouter();

  // Esta función se llamará cuando el formulario se guarde exitosamente
  const handleSaveSuccess = (nuevaRemision: any) => {
    // Idealmente, mostrar un toast de éxito
    console.log('Remisión guardada:', nuevaRemision);
    // Redirigir al usuario a la lista principal
    router.push('/remisiones');
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* Encabezado y botón para regresar */}
        <div className="mb-6">
          <Link href="/remisiones" className="flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4">
            <ArrowLeft size={16} className="mr-2" />
            Volver a Remisiones
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Nueva Remisión Forestal</h1>
          <p className="text-gray-500 mt-1">Captura los datos del documento físico oficial.</p>
        </div>

        {/* Contenedor principal del formulario */}
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
          <NuevaRemisionForm onSaveSuccess={handleSaveSuccess} />
        </div>
      </div>
    </div>
  );
}