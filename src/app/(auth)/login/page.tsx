'use client';

import { useState, useEffect } from 'react'; // <--- 1. Importar useEffect
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
// import Image from 'next/image'; // (Si lo usas)

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- NUEVA LÓGICA DE AUTO-LIMPIEZA ---
  useEffect(() => {
    const limpiarSesion = async () => {
      console.log("🧹 Limpiando sesión anterior...");
      
      // 1. Limpiar almacenamiento local (Tus tokens)
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('token'); // Por si acaso
      localStorage.removeItem('tempAuthToken');

      // 2. Cerrar sesión en Supabase (Limpia cookies de Supabase)
      // Usamos 'await' para asegurar que se complete antes de intentar loguear de nuevo
      await supabase.auth.signOut();
      
      // 3. Opcional: Limpiar cookies del navegador accesibles por JS
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    };

    limpiarSesion();
  }, []); // El array vacío [] asegura que esto corra solo una vez al cargar la página
  // --------------------------------------

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        router.push('/seleccionar-aserradero');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message === 'Invalid login credentials' 
        ? 'Credenciales incorrectas. Verifica tu correo y contraseña.' 
        : 'Ocurrió un error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      {/* ... (El resto de tu JSX se mantiene EXACTAMENTE IGUAL) ... */}
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de Gestión de Aserradero
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
           {/* ... tus inputs ... */}
            <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="email-address" className="sr-only">Correo electrónico</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors"
                placeholder="Correo electrónico"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors"
                placeholder="Contraseña"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {/* Aquí agregamos el link de recuperación que hicimos antes */}
          <div className="flex items-center justify-end">
            <div className="text-sm">
                <a href="/recuperar-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                ¿Olvidaste tu contraseña?
                </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                loading ? 'bg-green-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200`}
            >
              {loading ? 'Verificando...' : 'Ingresar al Sistema'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}