'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 1. Llama al endpoint de logout (opcional, pero buena práctica)
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error("Error al llamar al endpoint de logout:", error);
    } finally {
      // 2. Elimina el token del almacenamiento local
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('tempAuthToken'); // Buena idea limpiar ambos por si acaso

      // 3. Redirige al usuario a la página de login
      router.push('/login');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 text-red-500 hover:text-red-700 font-semibold p-2 rounded-md transition-colors"
      title="Cerrar Sesión"
    >
      <LogOut size={18} />
      <span>Cerrar Sesión</span>
    </button>
  );
}