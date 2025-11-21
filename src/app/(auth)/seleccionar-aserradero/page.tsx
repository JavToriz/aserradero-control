// src/app/(auth)/seleccionar-aserradero/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Frown, Loader2 } from 'lucide-react';

type Aserradero = {
  id_aserradero: number;
  nombre: string;
};

// Array de colores para los iconos, para darles variedad.
const iconColors = [
    'text-emerald-400', 'text-sky-400', 'text-amber-400', 
    'text-rose-400', 'text-violet-400', 'text-lime-400'
];

export default function SelectSawmillPage() {
  const [aserraderos, setAserraderos] = useState<Aserradero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAserraderos = async () => {
      // Obtenemos el token temporal guardado en el login.
      const tempToken = localStorage.getItem('tempAuthToken');

      if (!tempToken) {
        router.push('/login'); // Si no hay token, no debería estar aquí.
        return;
      }

      try {
        const response = await fetch('/api/auth/session', {
          headers: { 'Authorization': `Bearer ${tempToken}` },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'No se pudieron cargar los perfiles.');
        }

        setAserraderos(data.aserraderos);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAserraderos();
  }, [router]);

  const handleSelectAserradero = async (id_aserradero: number) => {
    const tempToken = localStorage.getItem('tempAuthToken');

    try {
      const response = await fetch('/api/auth/select-sawmill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`,
        },
        body: JSON.stringify({ id_aserradero }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo seleccionar el perfil.');
      }
      
      // 💡 Paso 2: Borramos el token temporal y guardamos el token FINAL y permanente.
      localStorage.removeItem('tempAuthToken');
      localStorage.setItem('sessionToken', data.sessionToken);

      // ¡Listo! Redireccionamos a la aplicación principal.
      router.push('/productos');

    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-800 text-white">
        <Loader2 className="animate-spin" size={48} />
        <p className="mt-4 text-lg">Cargando perfiles...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-800 text-white p-8">
      <h1 className="text-4xl md:text-5xl font-bold mb-2">¿Quién está trabajando?</h1>
      <p className="text-gray-400 mb-12">Selecciona un perfil de aserradero para continuar.</p>

      {error ? (
         <div className="flex flex-col items-center text-center p-8 bg-gray-700 rounded-lg">
            <Frown size={48} className="text-red-400 mb-4" />
            <p className="text-xl font-semibold">Ocurrió un error</p>
            <p className="text-gray-300">{error}</p>
         </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
          {aserraderos.map((aserradero, index) => (
            <div 
              key={aserradero.id_aserradero} 
              onClick={() => handleSelectAserradero(aserradero.id_aserradero)}
              className="flex flex-col items-center gap-4 cursor-pointer group"
            >
              <div className="w-28 h-28 md:w-36 md:h-36 bg-gray-700 rounded-lg flex items-center justify-center 
              group-hover:bg-gray-600 group-hover:scale-105 transform transition-all duration-200">
                <Building2 size={64} className={iconColors[index % iconColors.length]} />
              </div>
              <p className="text-lg font-medium text-gray-300 group-hover:text-white transition-colors">{aserradero.nombre}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
