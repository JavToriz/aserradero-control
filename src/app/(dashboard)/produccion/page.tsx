// app/(dashboard)/produccion/page.tsx
'use client';
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Warehouse, Package, Truck, Minus, GitBranch } from 'lucide-react';
import { InventarioKanban } from '@/components/produccion/InventarioKanban';
import { MoverStockModal } from '@/components/produccion/MoverStockModal';

// --- TIPOS ---
// Tipo para los KPIs del Dashboard
type KpiData = {
  m3EnPatio: string;
  totalPiezasTerminadas: number;
  lotesActivos: number;
};

// Tipo para el item de Stock (lo que viene de la API del Kanban)
export type StockItem = {
  id_stock: number;
  piezas_actuales: number;
  ubicacion: 'PRODUCCION' | 'SECADO' | 'BODEGA' | 'ANAQUELES';
  fecha_ingreso: string;
  producto: {
    descripcion: string;
    tipo_categoria: string;
    atributos_madera?: { grosor_pulgadas: number; ancho_pulgadas: number; largo_pies: number } | null;
    atributos_triplay?: { espesor_mm: number; ancho_ft: number; largo_ft: number } | null;
  };
};

export default function ProduccionDashboardPage() {
  const router = useRouter();
  const getToken = () => localStorage.getItem('sessionToken');

  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el modal de movimiento
  const [itemParaMover, setItemParaMover] = useState<StockItem | null>(null);
  // --- NUEVO ESTADO PARA EL MODO ---
  const [moveMode, setMoveMode] = useState<'full' | 'partial'>('full');

  // --- Función de Carga de Datos ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    try {
      // Cargar KPIs y Stock en paralelo
      const [kpiRes, stockRes] = await Promise.all([
        fetch('/api/produccion/dashboard-kpis', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/stock-producto-terminado/kanban', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!kpiRes.ok || !stockRes.ok) {
        throw new Error('No se pudieron cargar los datos de producción');
      }

      const kpiData = await kpiRes.json();
      const stockData = await stockRes.json();

      setKpis(kpiData);
      setStockItems(stockData);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Manejadores de Modal (ACTUALIZADOS) ---
  const handleOpenMoveFullModal = (item: StockItem) => {
    setMoveMode('full');
    setItemParaMover(item);
  };
  
  const handleOpenMovePartialModal = (item: StockItem) => {
    setMoveMode('partial');
    setItemParaMover(item);
  };

  const handleCloseMoveModal = () => {
    setItemParaMover(null);
  };

  const handleMoveSuccess = () => {
    setItemParaMover(null); // Cierra el modal
    fetchData(); // Recarga todos los datos para reflejar el cambio
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      
      {/* --- ENCABEZADO Y ACCIONES --- */}
      <header className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Producción e Inventario</h1>
          <p className="text-gray-500">Indicadores clave y gestión de inventario en proceso.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/produccion/consumo" passHref>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors shadow-sm">
              <Minus size={18} /> Registrar Consumo
            </button>
          </Link>
          <Link href="/produccion/transformado" passHref>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm">
              <Plus size={18} /> Registrar Producción
            </button>
          </Link>
        </div>
      </header>
      
      {/* --- SECCIÓN DE KPIs (INDICADORES CLAVE) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <KpiCard
          title="Balance de Materia Prima"
          value={kpis ? kpis.m3EnPatio : '...'}
          unit="m³ en Patio"
          icon={<Warehouse className="text-blue-500" />}
        />
        <KpiCard
          title="Inventario Terminado (Total)"
          value={kpis ? kpis.totalPiezasTerminadas.toLocaleString() : '...'}
          unit="Piezas"
          icon={<Package className="text-green-500" />}
        />
        <KpiCard
          title="Lotes de Stock Activos"
          value={kpis ? kpis.lotesActivos.toLocaleString() : '...'}
          unit="Lotes en proceso"
          icon={<GitBranch className="text-purple-500" />}
        />
      </div>

      {/* --- SECCIÓN KANBAN (VISTA 7.3) --- */}
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Inventario en Proceso</h2>
      {loading ? (
        <p className="text-center text-gray-500 py-8">Cargando inventario...</p>
      ) : (
        <InventarioKanban 
          stockItems={stockItems}
          // --- PROPS ACTUALIZADAS ---
          onMoveFullItem={handleOpenMoveFullModal}
          onMovePartialItem={handleOpenMovePartialModal}
        />
      )}

      {/* --- MODAL PARA MOVER STOCK (ACTUALIZADO) --- */}
      {itemParaMover && (
        <MoverStockModal
          isOpen={!!itemParaMover}
          onClose={handleCloseMoveModal}
          onMoveSuccess={handleMoveSuccess}
          item={itemParaMover}
          mode={moveMode} // <-- Pasamos el modo
        />
      )}
    </div>
  );
}

// Componente de UI simple para los KPIs
const KpiCard: React.FC<{ title: string; value: string | number; unit: string; icon: React.ReactNode }> = ({ title, value, unit, icon }) => (
  <div className="bg-white p-5 rounded-xl shadow-md flex items-center gap-5">
    <div className="flex-shrink-0 p-3 bg-gray-100 rounded-full">
      {React.cloneElement(icon as React.ReactElement, { size: 24 })}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-400">{unit}</p>
    </div>
  </div>
);