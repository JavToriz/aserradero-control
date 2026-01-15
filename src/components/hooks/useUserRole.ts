// Denegar el acceso a ciertas rutas o funcionalidades basadas en los roles del usuario almacenados en el token JWT.
'use client';

import { useState, useEffect } from 'react';

export function useUserRole() {
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sessionToken');
    if (token) {
      try {
        // Decodificamos el token (parte 2 del JWT)
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (Array.isArray(payload.roles)) {
          setRoles(payload.roles);
        }
      } catch (e) {
        console.error("Error al leer roles del token", e);
      }
    }
    setLoading(false);
  }, []);

  return {
    roles,
    loading,
    isAdmin: roles.includes('admin'),
    isVendedor: roles.includes('vendedor'),
    isTrabajador: roles.includes('trabajador'),
    // Helper para verificar si tiene al menos uno de los roles permitidos
    hasPermission: (allowedRoles: string[]) => roles.some(r => allowedRoles.includes(r))
  };
}