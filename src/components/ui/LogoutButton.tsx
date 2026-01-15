'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // <--- 1. IMPORTAR CLIENTE SUPABASE

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 2. Cerrar sesión en Supabase (Esto mata la cookie/token de Supabase)
      // Esto asegurará que /seleccionar-aserradero ya no sea accesible
      await supabase.auth.signOut();

      // 3. Opcional: Llamar a tu endpoint de limpieza si hace algo extra (cookies servidor)
      await fetch('/api/auth/logout', { method: 'POST' });
      
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      // 4. Elimina TUS tokens del almacenamiento local
      localStorage.removeItem('sessionToken');
      // localStorage.removeItem('tempAuthToken'); // Si usas este, bórralo también

      // 5. Redirige al usuario a la página de login
      router.push('/login');
      router.refresh(); // Refresca para asegurar que limpiar cualquier estado caché
    }
  };

  return (
    <button
      onClick={handleLogout}
      title="Cerrar sesión"
      className="
        flex items-center justify-center gap-2
        w-full sm:w-auto
        px-4 py-2
        text-sm sm:text-base font-semibold
        text-red-600
        rounded-lg
        transition-all duration-200
        hover:bg-red-50 hover:text-red-700
        active:scale-95
        focus:outline-none focus:ring-2 focus:ring-red-400
      "
    >
      <LogOut size={18} className="shrink-0" />
      <span className="hidden sm:inline">Cerrar sesión</span>
    </button>

  );
}