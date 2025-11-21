// components/ui/SearchAndCreateInput.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useDebouncedSearch } from '@/components/hooks/useDebouncedSearch';
import { Plus, Loader2 } from 'lucide-react';

// Usamos tipos genéricos para que este componente sea reutilizable
interface SearchAndCreateInputProps<T> {
  label: string;
  placeholder: string;
  searchApiUrl: string;       // Ej: "/api/personas"
  displayField: keyof T;      // Ej: "nombre_completo"
  inputValue: string;         // Valor controlado desde el formulario padre
  onInputChange: (value: string) => void;
  onSelect: (item: T) => void;
  onCreateNew: () => void;
}

export function SearchAndCreateInput<T extends { [key: string]: any }>({
  label,
  placeholder,
  searchApiUrl,
  displayField,
  inputValue,
  onInputChange,
  onSelect,
  onCreateNew,
}: SearchAndCreateInputProps<T>) {
  
  // Usamos nuestro hook de búsqueda
  const { query, setQuery, results, isLoading, setResults } = useDebouncedSearch<T>(searchApiUrl);
  const [isListOpen, setIsListOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Manejar el cambio en el input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onInputChange(value); // Actualiza el estado del formulario padre
    setQuery(value);      // Actualiza el estado del hook de búsqueda
    setIsListOpen(true);
  };

  // Manejar la selección de un item de la lista
  const handleSelect = (item: T) => {
    onSelect(item);       // Llama al callback del padre con el objeto completo
    setIsListOpen(false); // Cierra la lista
    setResults([]);       // Limpia los resultados
  };

  // Cerrar la lista si se hace clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsListOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleChange}
            onFocus={() => setIsListOpen(true)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* Indicador de carga */}
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
          )}
        </div>
        <button
          type="button"
          onClick={onCreateNew}
          className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
          title={`Añadir Nuevo ${label}`}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Lista de resultados */}
      {isListOpen && (results.length > 0) && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((item, index) => (
            <li
              key={index} // Idealmente usar item.id si existe
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onMouseDown={(e) => { // Usar onMouseDown para que se dispare antes que el onBlur del input
                e.preventDefault();
                handleSelect(item);
              }}
            >
              {String(item[displayField])}
            </li>
          ))}
        </ul>
      )}
      {/* Mensaje de no resultados */}
      {isListOpen && !isLoading && results.length === 0 && query.length > 1 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-sm text-gray-500">
          No se encontraron resultados para "{query}".
        </div>
      )}
    </div>
  );
}