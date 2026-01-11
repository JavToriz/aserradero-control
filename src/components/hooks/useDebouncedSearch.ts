// components/hooks/useDebouncedSearch.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

// Hook genérico para la búsqueda con debounce
export function useDebouncedSearch<T>(searchApiUrl: string) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getToken = () => localStorage.getItem('sessionToken');

  // Función de búsqueda real
  const fetchResults = async (currentQuery: string) => {
    if (currentQuery.length < 2) { // No buscar si la consulta es muy corta
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const token = getToken();

    try {
      const separator = searchApiUrl.includes('?') ? '&' : '?';
      /*
      const response = await fetch(`${searchApiUrl}?query=${encodeURIComponent(currentQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });*/
      const response = await fetch(`${searchApiUrl}${separator}query=${encodeURIComponent(currentQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error en la búsqueda');
      const data: T[] = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching search results:", error);
      setResults([]); // Limpiar resultados en caso de error
    } finally {
      setIsLoading(false);
    }
  };

  // Crear una versión "debounced" de la función de búsqueda
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetch = useCallback(
    debounce(fetchResults, 300),
    [searchApiUrl] // Depende de la URL de la API
  );

  useEffect(() => {
    // Llama a la función "debounced" cada vez que 'query' cambia
    debouncedFetch(query);
  }, [query, debouncedFetch]);

  return { query, setQuery, results, isLoading, setResults };
}

// Función helper de debounce (puedes moverla a un archivo utils)
function debounce<F extends (...args: any[]) => void>(func: F, delay: number): F {
  let timeoutId: NodeJS.Timeout | null = null;
  return function(this: any, ...args: any[]) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  } as F;
}