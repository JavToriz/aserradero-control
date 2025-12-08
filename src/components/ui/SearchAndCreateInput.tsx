// components/ui/SearchAndCreateInput.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useDebouncedSearch } from '@/components/hooks/useDebouncedSearch';
import { Plus, Loader2 } from 'lucide-react';

// Usamos tipos genéricos para que este componente sea reutilizable
interface SearchAndCreateInputProps<T> {
  label: string;
  placeholder: string;
  searchApiUrl: string;       
  displayField: keyof T;      
  inputValue: string;         
  onInputChange: (value: string) => void;
  onSelect: (item: T) => void;
  onCreateNew: () => void;
  // NUEVO: Prop opcional para renderizar el item de forma personalizada
  renderItem?: (item: T) => React.ReactNode;
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
  renderItem,
}: SearchAndCreateInputProps<T>) {
  
  const { query, setQuery, results, isLoading, setResults } = useDebouncedSearch<T>(searchApiUrl);
  const [isListOpen, setIsListOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onInputChange(value); 
    setQuery(value);      
    setIsListOpen(true);
  };

  const handleSelect = (item: T) => {
    onSelect(item);       
    setIsListOpen(false); 
    setResults([]);       
  };

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
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 border-gray-100"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(item);
              }}
            >
              {/* Si existe renderItem, lo usamos. Si no, usamos el displayField estándar */}
              {renderItem ? renderItem(item) : String(item[displayField])}
            </li>
          ))}
        </ul>
      )}
      
      {isListOpen && !isLoading && results.length === 0 && query.length > 1 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-sm text-gray-500">
          No se encontraron resultados para "{query}".
        </div>
      )}
    </div>
  );
}