import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseAuthFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAuthenticatedFetch<T>(url: string): UseAuthFetchResult<T> {
  const router = useRouter();
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0); // Para forzar recarga

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Obtenemos el token (que guardaste en localStorage en el login)
      const token = localStorage.getItem('sessionToken');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Aquí se inyecta el token automáticamente
        }
      });

      // Si el token expiró
      if (res.status === 401) {
        localStorage.removeItem('sessionToken'); // Limpieza
        router.push('/login');
        return;
      }

      // Si no tiene permisos para ESTA acción específica
      if (res.status === 403) {
         throw new Error("No tienes permisos para realizar esta acción.");
      }

      if (!res.ok) {
         const errorData = await res.json().catch(() => ({}));
         throw new Error(errorData.message || 'Error al cargar datos');
      }

      const jsonData = await res.json();
      setData(jsonData);

    } catch (err) { // CORRECCIÓN: Quitamos ': any' para satisfacer al linter
      // Validamos si es un Error real antes de leer el mensaje
      const message = err instanceof Error ? err.message : 'Ocurrió un error desconocido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [url, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData, trigger]);

  const refresh = () => setTrigger(prev => prev + 1);

  return { data, loading, error, refresh };
}