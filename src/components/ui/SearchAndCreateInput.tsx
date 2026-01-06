'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { useDebouncedSearch } from '@/components/hooks/useDebouncedSearch';

interface SearchAndCreateInputProps<T = any> {
  label: string;
  placeholder?: string;
  searchApiUrl?: string; 
  endpoint?: string; 
  displayField: string; 
  subLabelField?: string; 
  value?: string;
  inputValue?: string;
  onSelect: (item: T) => void;
  onInputChange?: (value: string) => void; 
  onCreateNew?: () => void;
  renderItem?: (item: T) => React.ReactNode;
}

export function SearchAndCreateInput<T = any>({
  label,
  placeholder,
  searchApiUrl,
  endpoint,
  displayField,
  subLabelField,
  value,
  inputValue,
  onSelect,
  onInputChange,
  onCreateNew,
  renderItem
}: SearchAndCreateInputProps<T>) {
  
  const incomingValue = value || inputValue || '';
  const finalEndpoint = searchApiUrl || endpoint || '';

  // 1. Estado local para el Input (UI)
  const [localQuery, setLocalQuery] = useState<string>(incomingValue);
  
  // 2. Hook de Búsqueda (Lógica API)
  // IMPORTANTE: Obtenemos 'setQuery' del hook para avisarle qué buscar
  const { results, isLoading, setQuery: setHookQuery, setResults } = useDebouncedSearch<T>(finalEndpoint);

  const [showResults, setShowResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sincronizar cambios desde el padre (incomingValue) hacia el input local
  useEffect(() => {
    setLocalQuery(incomingValue);
  }, [incomingValue]);

  // Cierra el dropdown si clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
        if (!localQuery.trim()) {
           onSelect({} as T);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [localQuery, onSelect]); 

  const handleSelect = (item: any) => {
    const text = item[displayField];
    setLocalQuery(text);       // Actualiza UI
    setHookQuery(text);        // Actualiza Hook (opcional, para mantener sync)
    setSelectedItem(item);
    onSelect(item);
    setShowResults(false);
  };

  const handleLocalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // 1. Actualizar UI inmediatamente
    setLocalQuery(newValue); 
    setShowResults(true);
    
    // 2. Avisar al Hook para que inicie el debounce y la búsqueda
    setHookQuery(newValue);

    // 3. Avisar al padre y limpiar selección previa
    if (onInputChange) onInputChange(newValue);
    if (selectedItem) setSelectedItem(null); 
  };

  const handleClear = () => {
    setLocalQuery('');
    setHookQuery(''); // Limpia búsqueda en el hook
    setResults([]);   // Limpia resultados
    if(onInputChange) onInputChange('');
    setSelectedItem(null);
  };

  return (
    <div className="relative mb-4 w-full" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder={placeholder || 'Buscar...'}
          value={localQuery} 
          onChange={handleLocalInputChange}
          onFocus={() => {
            setShowResults(true);
            // Si ya hay texto, aseguramos que el hook tenga el query para buscar si estaba limpio
            if(localQuery) setHookQuery(localQuery);
          }}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        
        {localQuery && (
          <button 
            type="button" 
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showResults && (localQuery.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          {isLoading && <div className="p-3 text-sm text-gray-500">Buscando...</div>}
          
          {!isLoading && results.length === 0 && localQuery.length >= 2 && (
            <div className="p-3 text-sm text-gray-500 text-center">
              No se encontraron resultados.
            </div>
          )}

          {results.map((item: any, index: number) => (
            <div
              key={index}
              onClick={() => handleSelect(item)}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
            >
              {renderItem ? renderItem(item) : (
                <>
                    <p className="font-medium text-gray-800">{item[displayField]}</p>
                    {subLabelField && item[subLabelField] && (
                        <p className="text-xs text-gray-500">{item[subLabelField]}</p>
                    )}
                </>
              )}
            </div>
          ))}

          {onCreateNew && (
            <button
              type="button"
              onClick={() => {
                setShowResults(false);
                onCreateNew();
              }}
              className="w-full text-left p-3 bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-medium flex items-center gap-2 border-t"
            >
              <Plus size={16} />
              Crear nuevo registro
            </button>
          )}
        </div>
      )}
    </div>
  );
}