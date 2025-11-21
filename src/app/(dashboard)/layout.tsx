// app/(dashboard)/layout.tsx
'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Verificamos si existe el token de sesión en el almacenamiento local del navegador
    const token = localStorage.getItem('sessionToken'); // Usaremos 'sessionToken'

    if (!token) {
      // Si no hay token, redirigimos al usuario a la página de login
      router.push('/login');
    } else {
      // Si hay un token, permitimos que se muestre el contenido del dashboard
      // En una app más compleja, aquí podrías verificar la validez del token contra la API
      setIsVerified(true);
    }
  }, [router]);

  // Mientras se verifica el token, no mostramos nada para evitar un "parpadeo" de la UI
  if (!isVerified) {
    return null; // O puedes mostrar un spinner de carga: return <LoadingSpinner />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      {/* CAMBIO: El margen izquierdo del contenido principal debe coincidir con el ancho de la sidebar */}
      <main className="flex-1 overflow-y-auto p-8 md:ml-auto transition-all duration-300">
        {children}
      </main>
    </div>
  );
}