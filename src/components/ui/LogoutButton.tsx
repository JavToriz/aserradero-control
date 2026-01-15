'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // <--- 1. IMPORTAR CLIENTE SUPABASE (MANTENIDO)

// 2. AGREGAMOS LA INTERFAZ PARA CORREGIR EL ERROR DE TYPESCRIPT
interface LogoutButtonProps {
  isCollapsed?: boolean;
}

// 3. RECIBIMOS LA PROP isCollapsed
export default function LogoutButton({ isCollapsed }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 2. Cerrar sesión en Supabase (Esto mata la cookie/token de Supabase)
      await supabase.auth.signOut();

      // 3. Opcional: Llamar a tu endpoint de limpieza
      await fetch('/api/auth/logout', { method: 'POST' });
      
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      // 4. Elimina TUS tokens del almacenamiento local
      localStorage.removeItem('sessionToken');
      // localStorage.removeItem('tempAuthToken'); 

      // 5. Redirige al usuario a la página de login
      router.push('/login');
      router.refresh(); 
    }
  };

  return (
    <button
      onClick={handleLogout}
      title="Cerrar sesión"
      className={`
        flex items-center 
        ${isCollapsed ? 'justify-center' : 'justify-start'} 
        gap-3
        w-full
        px-2 py-3
        text-sm font-medium
        text-red-600
        rounded-md
        transition-colors duration-200
        hover:bg-red-50 hover:text-red-700
        active:scale-95
        focus:outline-none
      `}
    >
      <LogOut size={20} className="shrink-0" />
      
      {/* Solo mostramos el texto si NO está colapsado */}
      <span className={`
        transition-all duration-300 overflow-hidden whitespace-nowrap
        ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
      `}>
        Cerrar sesión
      </span>
      
      {/* Mantenemos tu lógica de tooltips o comportamiento móvil si fuera necesario, 
          pero aquí adaptamos el estilo al Sidebar para que se vea bien */}
    </button>
  );
}