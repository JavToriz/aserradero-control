'use client'; // Necesario para usar interactividad (click)

import { useRouter } from 'next/navigation';

interface Props {
  mensaje?: string;
}

export default function AccessDenied({ 
  mensaje = "Tu rol actual no tiene permisos para visualizar este módulo."
}: Props) {
  const router = useRouter();

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center p-4">
      <div className="max-w-md text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Acceso Restringido</h2>
        <p className="mt-2 text-sm text-gray-500">{mensaje}</p>
        <div className="mt-6">
          {/* Cambiamos Link por un botón de historial */}
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            &larr; Regresar
          </button>
        </div>
      </div>
    </div>
  );
}