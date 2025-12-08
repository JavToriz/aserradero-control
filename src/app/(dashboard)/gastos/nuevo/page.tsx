// app/(dashboard)/gastos/nuevo/page.tsx
'use client';

import { NuevoGastoForm } from '@/components/gastos/NuevoGastoForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NuevoGastoPage() {
  const router = useRouter();

  const handleSuccess = (gasto: any) => {
    // Podríamos abrir el modal de imprimir aquí, o redirigir
    // Para simplificar, redirigimos y el usuario puede imprimir desde la tabla
    alert("Recibo generado correctamente");
    router.push('/gastos');
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/gastos" className="flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4">
            <ArrowLeft size={16} className="mr-2" />
            Volver a Gastos
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Nuevo Recibo de Gasto</h1>
          <p className="text-gray-500 mt-1">Registra pagos de fletes, nómina o insumos.</p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
          <NuevoGastoForm onSaveSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}