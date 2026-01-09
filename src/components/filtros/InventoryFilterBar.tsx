'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { StockItem } from '@/app/(dashboard)/produccion/page'; // Importamos el tipo o lo definimos aquí si prefieres hacerlo genérico

// --- CONFIGURACIÓN Y UTILIDADES ---
const GENEROS_STANDARD = ['PINO', 'BARROTE', 'OYAMEL', 'CEDRO', 'POLIN', 'AYACAHUITE', 'SABINO', 'MACHIMBRADA PINO'];
const TIPOS_STANDARD = ['TABLA', 'TABLON', 'POLIN', 'VIGA', 'COSTERA', 'BARROTE', 'TABLETA'];
const CLASIFICACIONES_STANDARD = ['PRIMERA', 'SEGUNDA', 'TERCERA'];

const normalize = (str: string | undefined | null) => str ? str.trim().toUpperCase() : 'DESCONOCIDO';

interface InventoryFilterBarProps {
  items: StockItem[]; // La lista completa original
  onFilterChange: (filteredItems: StockItem[]) => void; // Función para devolver los filtrados al padre
  compact?: boolean; // Opción extra por si quieres modo ultra compacto
}

export const InventoryFilterBar: React.FC<InventoryFilterBarProps> = ({ items, onFilterChange, compact = true }) => {
  // Estados Locales del Filtro
  const [busqueda, setBusqueda] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('TODOS');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroClasificacion, setFiltroClasificacion] = useState('TODOS');

  // --- LÓGICA DE FILTRADO ---
  const filteredResult = useMemo(() => {
    return items.filter(item => {
      const p = item.producto;
      // 1. Búsqueda Texto
      const textoMatch = 
        p.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(busqueda.toLowerCase()));

      if (!textoMatch) return false;

      // Helpers para atributos normalizados
      const attrs = p.atributos_madera || p.atributos_triplay;
      const itemGenero = normalize(attrs?.genero);
      const itemTipo = normalize(attrs?.tipo);
      const itemClasif = p.atributos_madera ? normalize(p.atributos_madera.clasificacion) : 'N/A';

      // 2. Filtros Select
      if (filtroGenero !== 'TODOS' && itemGenero !== filtroGenero) return false;
      if (filtroTipo !== 'TODOS' && itemTipo !== filtroTipo) return false;
      if (filtroClasificacion !== 'TODOS' && itemClasif !== filtroClasificacion) return false;

      return true;
    });
  }, [items, busqueda, filtroGenero, filtroTipo, filtroClasificacion]);

  // Notificar al padre cuando cambien los resultados
  // Usamos useEffect con un JSON.stringify o chequeo de longitud para evitar loops infinitos si la referencia cambia
  useEffect(() => {
    onFilterChange(filteredResult);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredResult]); // Se ejecuta cuando el resultado calculado cambia

  // --- OPCIONES DINÁMICAS ---
  const opciones = useMemo(() => {
    const generosSet = new Set<string>(GENEROS_STANDARD);
    const tiposSet = new Set<string>(TIPOS_STANDARD);
    const clasifSet = new Set<string>(CLASIFICACIONES_STANDARD);

    items.forEach(item => {
      const attrs = item.producto.atributos_madera || item.producto.atributos_triplay;
      if (attrs?.genero) generosSet.add(normalize(attrs.genero));
      if (attrs?.tipo) tiposSet.add(normalize(attrs.tipo));
      if (item.producto.atributos_madera?.clasificacion) clasifSet.add(normalize(item.producto.atributos_madera.clasificacion));
    });

    return {
      generos: Array.from(generosSet).sort(),
      tipos: Array.from(tiposSet).sort(),
      clasif: Array.from(clasifSet).sort(),
    };
  }, [items]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroGenero('TODOS');
    setFiltroTipo('TODOS');
    setFiltroClasificacion('TODOS');
  };

  const hayFiltros = busqueda || filtroGenero !== 'TODOS' || filtroTipo !== 'TODOS' || filtroClasificacion !== 'TODOS';

  // --- ESTILOS COMPACTOS ---
  const containerClass = compact ? "py-3 px-4" : "p-5";
  const inputHeight = compact ? "h-9 text-xs" : "h-11 text-sm";
  const labelClass = "text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1";

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 mb-4 pb-5 ${containerClass}`}>
      <div className="flex flex-col lg:flex-row gap-3 items-end">
        
        {/* 1. BUSCADOR (Weight más grande: flex-grow-[2]) */}
        <div className="w-full lg:flex-[2] min-w-[200px]">
          <div className="flex justify-between items-center">
            <label className={labelClass}>Búsqueda rápida</label>
            {hayFiltros && (
                <button onClick={limpiarFiltros} className="lg:hidden text-[10px] text-red-500 flex items-center gap-1 mb-1">
                    <X size={10} /> Limpiar
                </button>
            )}
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={compact ? 14 : 18} />
            <input 
              type="text" 
              placeholder="Escribe descripción, SKU o medidas..." 
              className={`w-full pl-9 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all ${inputHeight}`}
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {/* 2. SELECTORES (Weight normal: flex-1) */}
        
        {/* Género */}
        <div className="w-full lg:flex-1 min-w-[140px]">
          <label className={labelClass}>Género</label>
          <select 
            className={`w-full border border-gray-300 rounded-md px-2 bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer ${inputHeight}`}
            value={filtroGenero}
            onChange={e => setFiltroGenero(e.target.value)}
          >
            <option value="TODOS">Todos</option>
            {opciones.generos.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Tipo */}
        <div className="w-full lg:flex-1 min-w-[140px]">
          <label className={labelClass}>Tipo</label>
          <select 
            className={`w-full border border-gray-300 rounded-md px-2 bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer ${inputHeight}`}
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
          >
            <option value="TODOS">Todos</option>
            {opciones.tipos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Clasificación */}
        <div className="w-full lg:flex-1 min-w-[140px]">
          <label className={labelClass}>Clasificación</label>
          <select 
            className={`w-full border border-gray-300 rounded-md px-2 bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer ${inputHeight}`}
            value={filtroClasificacion}
            onChange={e => setFiltroClasificacion(e.target.value)}
          >
            <option value="TODOS">Todas</option>
            {opciones.clasif.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Botón Limpiar (Desktop) */}
        {hayFiltros && (
            <div className="hidden lg:block pb-1">
                <button 
                  onClick={limpiarFiltros}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  title="Limpiar filtros"
                >
                  <Filter size={18} className="line-through opacity-70" />
                </button>
            </div>
        )}
      </div>
      
      {/* Footer pequeño del componente 
      <div className="flex justify-end mt-2 border-t border-gray-100 pt-1">
        <span className="text-[10px] text-gray-400">
             Coincidencias: <span className="font-semibold text-gray-600">{filteredResult.length}</span> / {items.length}
        </span>
      </div>*/}
    </div>
  );
};