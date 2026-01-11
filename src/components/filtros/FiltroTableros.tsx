'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';

// Interfaz genérica para items (Stock o Arrivos)
interface ItemConProducto {
  producto: {
    nombre: string;
    sku: string | null;
    atributos?: {
        genero?: string;
        tipo?: string;
    } | null;
  };
  [key: string]: any; // Permite otras propiedades (id_stock, id_arrivo, etc.)
}

interface Props {
  items: ItemConProducto[]; 
  onFilterChange: (filteredItems: any[]) => void;
}

export default function FiltroTableros({ items, onFilterChange }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('TODOS');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');

  // --- LÓGICA DE FILTRADO ---
  const filteredResult = useMemo(() => {
    return items.filter(item => {
      const p = item.producto;
      const attrs = p.atributos;

      // 1. Búsqueda Texto
      const textoMatch = 
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(busqueda.toLowerCase()));

      if (!textoMatch) return false;

      // 2. Filtro GÉNERO
      if (filtroGenero !== 'TODOS') {
         const generoItem = attrs?.genero ? attrs.genero.toUpperCase() : 'OTROS';
         if (generoItem !== filtroGenero) return false;
      }

      // 3. Filtro TIPO
      if (filtroTipo !== 'TODOS') {
         const tipoItem = attrs?.tipo ? attrs.tipo.toUpperCase() : 'OTROS';
         if (tipoItem !== filtroTipo) return false;
      }

      return true;
    });
  }, [items, busqueda, filtroGenero, filtroTipo]);

  useEffect(() => {
    onFilterChange(filteredResult);
  }, [filteredResult, onFilterChange]);

  // --- OBTENER OPCIONES DE LA DB ---
  const opciones = useMemo(() => {
    const generosSet = new Set<string>();
    const tiposSet = new Set<string>();

    items.forEach(item => {
      const a = item.producto.atributos;
      if (a?.genero) generosSet.add(a.genero.toUpperCase());
      if (a?.tipo) tiposSet.add(a.tipo.toUpperCase());
    });

    return {
      generos: Array.from(generosSet).sort(),
      tipos: Array.from(tiposSet).sort(),
    };
  }, [items]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroGenero('TODOS');
    setFiltroTipo('TODOS');
  };

  const hayFiltros = busqueda || filtroGenero !== 'TODOS' || filtroTipo !== 'TODOS';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 p-4">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        
        {/* BUSCADOR */}
        <div className="w-full md:flex-[2]">
          <div className="flex justify-between mb-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Búsqueda</label>
            {hayFiltros && (
                <button onClick={limpiarFiltros} className="md:hidden text-xs text-red-500 flex items-center gap-1">
                    <X size={12} /> Limpiar
                </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por Descripción o SKU..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {/* SELECTOR GÉNERO */}
        <div className="w-full md:flex-1">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Género</label>
          <select 
            className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            value={filtroGenero}
            onChange={e => setFiltroGenero(e.target.value)}
          >
            <option value="TODOS">Todos</option>
            {opciones.generos.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* SELECTOR TIPO */}
        <div className="w-full md:flex-1">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tipo</label>
          <select 
            className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
          >
            <option value="TODOS">Todos</option>
            {opciones.tipos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* BOTÓN LIMPIAR */}
        {hayFiltros && (
            <button 
              onClick={limpiarFiltros}
              className="hidden md:flex p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mb-[2px]"
              title="Limpiar filtros"
            >
              <Filter size={20} className="line-through opacity-70" />
            </button>
        )}
      </div>
    </div>
  );
}