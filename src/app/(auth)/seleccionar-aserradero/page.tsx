// src/app/(auth)/seleccionar-aserradero/page.tsx
//a
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Aserradero {
  id_aserradero: number;
  nombre: string;
  ubicacion?: string;
}

export default function SeleccionarAserraderoPage() {
  const router = useRouter();
  const [aserraderos, setAserraderos] = useState<Aserradero[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAserraderos = async () => {
      try {
        // 1. Obtenemos la sesión actual de Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        // 2. Pedimos los aserraderos al backend enviando el token de Supabase
        const res = await fetch('/api/auth/session', {
          headers: {
            'Authorization': `Bearer ${session.access_token}` // ¡Clave! Enviamos el token de Supabase
          }
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
             throw new Error('No tienes aserraderos asignados o tu usuario no está vinculado.');
          }
          throw new Error('Error al cargar aserraderos');
        }

        const data = await res.json();
        setAserraderos(data.aserraderos);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAserraderos();
  }, [router]);

  const handleSelect = async (id_aserradero: number) => {
    setSelecting(id_aserradero);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión expirada");

      // 3. Hacemos el "Intercambio de Credenciales"
      const res = await fetch('/api/auth/select-sawmill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_aserradero,
          supabase_token: session.access_token // Enviamos token de Supabase para validar
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      // 4. ¡ÉXITO! Guardamos TU token interno (el que tiene roles y aserraderoId)
      // Ajusta 'token' al nombre de clave que use tu app (ej: 'auth_token', 'token', etc.)
      localStorage.setItem('sessionToken', data.sessionToken); 
      
      // Opcional: También podrías guardarlo en cookie si tu app lo prefiere
      document.cookie = `token=${data.sessionToken}; path=/; max-age=28800; SameSite=Strict`;

      // 5. Redirigir al Dashboard principal
      router.push('/dashboard'); // O la ruta principal de tu app
      router.refresh(); // Refresca para aplicar nuevos headers/cookies

    } catch (err: any) {
      alert(err.message);
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Selecciona un Aserradero</h2>
          <p className="mt-2 text-gray-600">Elige dónde trabajarás hoy</p>
        </div>

        {error ? (
          <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
            <p className="text-red-700 font-medium">{error}</p>
            <button onClick={() => router.push('/login')} className="mt-2 text-green-600 hover:text-green-800 text-sm font-medium">
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
            {aserraderos.map((aserradero) => (
              <button
                key={aserradero.id_aserradero}
                onClick={() => handleSelect(aserradero.id_aserradero)}
                disabled={selecting !== null}
                className="group relative bg-white overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-green-500 text-left"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-600 transition-colors">
                      <svg className="h-6 w-6 text-green-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    {selecting === aserradero.id_aserradero && (
                      <span className="h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                    {aserradero.nombre}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 truncate">
                    {aserradero.ubicacion || 'Ubicación no registrada'}
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-green-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}