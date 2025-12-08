// app/(dashboard)/reembarques/nueva/page.tsx
'use client';

import { NuevoReembarqueForm } from '@/components/reembarques/NuevoReembarqueForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NuevaReembarquePage() {
  const router = useRouter();

  const handleSuccess = (reembarque: any) => {
    alert("Reembarque guardado correctamente");
    router.push('/reembarques');
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/reembarques" className="flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4">
            <ArrowLeft size={16} className="mr-2" />
            Volver a Reembarques
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Nuevo Reembarque Forestal</h1>
          <p className="text-gray-500 mt-1">Registra la salida legal de producto o materia prima.</p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
          <NuevoReembarqueForm onSaveSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}