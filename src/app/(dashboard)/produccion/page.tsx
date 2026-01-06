// app/(dashboard)/produccion/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Warehouse, Package, Minus, GitBranch, Search, Trees, Settings2 } from 'lucide-react';
import { InventarioKanban } from '@/components/produccion/InventarioKanban';
import { MoverStockModal } from '@/components/produccion/MoverStockModal';
import { BalanceCard } from '@/components/produccion/BalanceCard'; // <--- IMPORTACIÓN NUEVA
import { AjustePatioModal } from '@/components/produccion/AjustePatioModal';
import * as Tabs from '@radix-ui/react-tabs';

// --- TIPOS ---
type KpiData = {
  m3EnPatio: string;
  totalPiezasTerminadas: number;
  lotesActivos: number;
  // Datos extra para el desglose de patio
  desglosePatio?: { especie: string; m3: number }[];
};

export type StockItem = {
  id_stock: number;
  piezas_actuales: number;
  ubicacion: 'PRODUCCION' | 'SECADO' | 'BODEGA' | 'ANAQUELES';
  fecha_ingreso: string;
  producto: {
    descripcion: string;
    sku?: string;
    tipo_categoria: string;
    atributos_madera?: { genero: string; tipo: string; clasificacion: string; grosor_pulgadas: number; ancho_pulgadas: number; largo_pies: number } | null;
    atributos_triplay?: { genero: string; tipo: string; procedencia: string; espesor_mm: number; ancho_ft: number; largo_ft: number } | null;
  };
};

export default function ProduccionDashboardPage() {
  const router = useRouter();
  const getToken = () => localStorage.getItem('sessionToken');

  // Estados de Datos
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado de UI
  const [activeTab, setActiveTab] = useState('proceso'); // 'proceso' | 'patio'
  const [itemParaMover, setItemParaMover] = useState<StockItem | null>(null);
  const [moveMode, setMoveMode] = useState<'full' | 'partial'>('full');

  // --- FILTROS DE INVENTARIO ---
  const [busqueda, setBusqueda] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('TODOS');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroClasificacion, setFiltroClasificacion] = useState('TODOS');

  // Estado para el modal de ajuste de patio
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);
  const handleAjusteSuccess = () => {
    // Recargar datos (truco simple: forzar update o llamar fetchData)
    // Como BalanceCard tiene su propio fetch interno, idealmente pasamos una prop "key" o un "trigger"
    // Pero por simplicidad, recargaremos toda la página o usaremos router.refresh()
    window.location.reload(); 
  };

  // Carga de Datos
  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    try {
      const [kpiRes, stockRes] = await Promise.all([
        fetch('/api/produccion/dashboard-kpis', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/stock-producto-terminado/kanban', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (kpiRes.ok && stockRes.ok) {
        setKpis(await kpiRes.json());
        setStockItems(await stockRes.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- LÓGICA DE FILTRADO (Cliente) ---
  const stockFiltrado = useMemo(() => {
    return stockItems.filter(item => {
      const p = item.producto;
      // 1. Búsqueda Texto (Descripción o SKU)
      const textoMatch = 
        p.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(busqueda.toLowerCase()));

      if (!textoMatch) return false;

      // Helpers para atributos
      const attrs = p.atributos_madera || p.atributos_triplay;
      const genero = attrs?.genero || 'Desconocido';
      const tipo = attrs?.tipo || 'Desconocido';
      const clasif = p.atributos_madera?.clasificacion || 'N/A'; // Solo madera tiene clasif

      // 2. Filtros Select
      if (filtroGenero !== 'TODOS' && genero !== filtroGenero) return false;
      if (filtroTipo !== 'TODOS' && tipo !== filtroTipo) return false;
      if (filtroClasificacion !== 'TODOS' && clasif !== filtroClasificacion) return false;

      return true;
    });
  }, [stockItems, busqueda, filtroGenero, filtroTipo, filtroClasificacion]);

  // Obtener opciones únicas para los selectores dinámicamente
  const opcionesFiltros = useMemo(() => {
    const generos = new Set<string>();
    const tipos = new Set<string>();
    const clasificaciones = new Set<string>();

    stockItems.forEach(item => {
      const attrs = item.producto.atributos_madera || item.producto.atributos_triplay;
      if (attrs?.genero) generos.add(attrs.genero);
      if (attrs?.tipo) tipos.add(attrs.tipo);
      if (item.producto.atributos_madera?.clasificacion) clasificaciones.add(item.producto.atributos_madera.clasificacion);
    });

    return {
      generos: Array.from(generos),
      tipos: Array.from(tipos),
      clasificaciones: Array.from(clasificaciones)
    };
  }, [stockItems]);


  // Manejadores de Modal
  const handleOpenMoveFullModal = (item: StockItem) => {
    setMoveMode('full');
    setItemParaMover(item);
  };
  const handleOpenMovePartialModal = (item: StockItem) => {
    setMoveMode('partial');
    setItemParaMover(item);
  };
  const handleMoveSuccess = () => {
    setItemParaMover(null);
    fetchData();
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Inventarios</h1>
          <p className="text-gray-500">Gestión de materia prima y producto terminado.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/produccion/consumo">
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 shadow-sm text-sm font-medium">
              <Minus size={16} /> Salida Patio (Consumo)
            </button>
          </Link>
          <Link href="/produccion/transformado">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow-sm text-sm font-medium">
              <Plus size={16} /> Entrada Producción
            </button>
          </Link>
        </div>
      </header>
      
      {/* KPIs Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <KpiCard
          title="Materia Prima en Patio"
          value={kpis ? kpis.m3EnPatio : '...'}
          unit="m³ Totales"
          icon={<Trees className="text-green-700" />}
          color="bg-green-50"
        />
        <KpiCard
          title="Producto Terminado"
          value={kpis ? kpis.totalPiezasTerminadas.toLocaleString() : '...'}
          unit="Piezas en Existencia"
          icon={<Package className="text-blue-600" />}
          color="bg-blue-50"
        />
        <KpiCard
          title="Lotes Activos"
          value={kpis ? kpis.lotesActivos.toLocaleString() : '...'}
          unit="Lotes en Tablero"
          icon={<GitBranch className="text-purple-600" />}
          color="bg-purple-50"
        />
      </div>

      {/* PESTAÑAS PRINCIPALES */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <Tabs.List className="flex border-b border-gray-200">
          <Tabs.Trigger 
            value="proceso" 
            className="px-6 py-3 text-gray-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-medium flex items-center gap-2 transition-colors hover:text-gray-800"
          >
            <Warehouse size={18} /> Inventario
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="patio" 
            className="px-6 py-3 text-gray-600 data-[state=active]:border-b-2 data-[state=active]:border-green-600 data-[state=active]:text-green-600 font-medium flex items-center gap-2 transition-colors hover:text-gray-800"
          >
            <Trees size={18} /> Inventario de Patio
          </Tabs.Trigger>
        </Tabs.List>

        {/* CONTENIDO: KANBAN (PROCESO) */}
        <Tabs.Content value="proceso" className="pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* BARRA DE FILTROS (EXISTENTE) */}
          <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex flex-col md:flex-row gap-4 items-center">
            {/* Buscador Texto */}
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por descripción, SKU..." 
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
            
            {/* Filtros Selectores */}
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <select 
                className="border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={filtroGenero}
                onChange={e => setFiltroGenero(e.target.value)}
              >
                <option value="TODOS">Género: Todos</option>
                {opcionesFiltros.generos.map(g => <option key={g} value={g}>{g}</option>)}
              </select>

              <select 
                className="border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
              >
                <option value="TODOS">Tipo: Todos</option>
                {opcionesFiltros.tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <select 
                className="border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={filtroClasificacion}
                onChange={e => setFiltroClasificacion(e.target.value)}
              >
                <option value="TODOS">Clasif: Todas</option>
                {opcionesFiltros.clasificaciones.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Botón Limpiar */}
              {(busqueda || filtroGenero !== 'TODOS' || filtroTipo !== 'TODOS' || filtroClasificacion !== 'TODOS') && (
                <button 
                  onClick={() => { setBusqueda(''); setFiltroGenero('TODOS'); setFiltroTipo('TODOS'); setFiltroClasificacion('TODOS'); }}
                  className="text-xs text-red-500 hover:underline px-2"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* KANBAN */}
          {loading ? (
            <p className="text-center text-gray-500 py-12">Cargando inventario...</p>
          ) : (
            <InventarioKanban 
              stockItems={stockFiltrado}
              onMoveFullItem={handleOpenMoveFullModal}
              onMovePartialItem={handleOpenMovePartialModal}
            />
          )}
        </Tabs.Content>

        {/* CONTENIDO: PATIO (MATERIA PRIMA) - AQUÍ ESTÁ EL CAMBIO */}
        <Tabs.Content value="patio" className="pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-700">Balance General</h2>
                <button 
                    onClick={() => setIsAjusteModalOpen(true)}
                    className="flex items-center gap-2 text-sm bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
                >
                    <Settings2 size={16} />
                    Realizar Ajuste Manual
                </button>
            </div>
            
            {/* Componente Nuevo de Balance */}
            <BalanceCard />

            <div className="bg-white p-6 rounded-2xl shadow-sm border mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Información Adicional</h3>
                <p className="text-sm text-gray-500">
                    El balance "Documentado" se calcula a partir de las Remisiones (entradas) y Reembarques (salidas) registrados ante la autoridad.
                    El balance "Físico" se calcula a partir de la medición real de las Remisiones al ingreso y el consumo reportado en ventas.
                </p>
            </div>
        </Tabs.Content>
      </Tabs.Root>

      {/* Modal Mover Stock */}
      {itemParaMover && (
        <MoverStockModal
          isOpen={!!itemParaMover}
          onClose={() => setItemParaMover(null)}
          onMoveSuccess={handleMoveSuccess}
          item={itemParaMover}
          mode={moveMode}
        />
      )}
      <AjustePatioModal 
      isOpen={isAjusteModalOpen}
      onClose={() => setIsAjusteModalOpen(false)}
      onSuccess={handleAjusteSuccess}
      />
    </div>
  );
}

// Componente KpiCard 
const KpiCard: React.FC<{ title: string; value: string | number; unit: string; icon: React.ReactNode; color?: string }> = ({ title, value, unit, icon, color = 'bg-gray-100' }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border flex items-center gap-5 transition-transform hover:scale-[1.01]">
    <div className={`flex-shrink-0 p-4 rounded-xl ${color}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 28 })}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-800 leading-none">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{unit}</p>
    </div>
  </div>
);