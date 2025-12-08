// app/(dashboard)/ventas/nueva/page.tsx
'use client';

import { NuevaVentaForm } from '@/components/ventas/NuevaVentaForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NuevaVentaPage() {
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* Encabezado y botón para regresar */}
        <div className="mb-6">
          <Link href="/ventas" className="flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4">
            <ArrowLeft size={16} className="mr-2" />
            Volver a Historial de Ventas
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Nueva Venta</h1>
          <p className="text-gray-500 mt-1">Registra la venta, descuenta inventario y genera la nota oficial.</p>
        </div>

        {/* Cargamos el formulario complejo aquí */}
        <NuevaVentaForm />
        
      </div>
    </div>
  );
}