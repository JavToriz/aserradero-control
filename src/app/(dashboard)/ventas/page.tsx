// app/(dashboard)/ventas/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Printer, Search, Loader2, Calendar, XCircle } from 'lucide-react';
import { ImprimirNotaModal } from '@/components/ventas/ImprimirNotaModal';

// --- HELPER PARA FECHAS (Reutilizado para consistencia) ---
const isDateInRange = (dateString: string, filter: string): boolean => {
  const d = new Date(dateString);
  // Ajustamos para comparar solo fechas sin horas
  const dateToCheck = new Date(d.getFullYear(), d.getMonth(), d.getDate()); 
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case 'hoy':
      return dateToCheck.getTime() === today.getTime();
    
    case 'ayer':
      const ayer = new Date(today);
      ayer.setDate(ayer.getDate() - 1);
      return dateToCheck.getTime() === ayer.getTime();

    case 'semana': {
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - today.getDay()); 
      return dateToCheck >= firstDay;
    }

    case 'mes':
      return dateToCheck.getMonth() === today.getMonth() && 
             dateToCheck.getFullYear() === today.getFullYear();
    
    case 'anio':
      return dateToCheck.getFullYear() === today.getFullYear();

    default: // 'todos'
      return true;
  }
};

export default function VentasPage() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [dateFilter, setDateFilter] = useState('mes'); // Default: Este Mes
  
  // Estado para el modal de impresión
  const [ventaParaImprimir, setVentaParaImprimir] = useState<any | null>(null);

  useEffect(() => {
    const fetchVentas = async () => {
      const token = localStorage.getItem('sessionToken');
      try {
        const res = await fetch('/api/ventas', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setVentas(data);
        }
      } catch (error) {
        console.error("Error cargando ventas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVentas();
  }, []);

  // Lógica de Filtrado y Cálculo de Totales
  const { ventasFiltradas, totalVentas } = useMemo(() => {
    const filtradas = ventas.filter(v => {
      // 1. Filtro Texto (Folio o Cliente)
      const texto = filtroTexto.toLowerCase();
      const coincideTexto = v.folio_nota.toLowerCase().includes(texto) ||
                            v.cliente.nombre_completo.toLowerCase().includes(texto);
      
      // 2. Filtro Fecha
      const coincideFecha = isDateInRange(v.fecha_salida, dateFilter);

      return coincideTexto && coincideFecha;
    });

    // Calcular Total Monetario de la vista actual
    const total = filtradas.reduce((acc, curr) => acc + Number(curr.total_venta), 0);

    return { ventasFiltradas: filtradas, totalVentas: total };
  }, [ventas, filtroTexto, dateFilter]);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      
      {/* Encabezado con KPI */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Ventas y Salidas</h1>
          <p className="text-gray-500">Historial de notas de venta generadas.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
             {/* Indicador de Total Filtrado - Igual que en Gastos */}
            <div className="bg-white px-4 py-2 rounded-lg border shadow-sm text-right hidden md:block min-w-[150px]">
                <p className="text-xs text-gray-400 uppercase font-bold">Venta Total (Periodo)</p>
                <p className="text-lg font-semibold text-gray-500">${totalVentas.toFixed(2)}</p>
            </div>

            <Link href="/ventas/nueva" passHref className="w-full md:w-auto">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-sm font-medium w-full h-full">
                <Plus size={20} />
                <span className="hidden sm:inline">Nueva Venta</span>
                <span className="sm:hidden">Nueva</span>
              </button>
            </Link>
        </div>
      </header>

      {/* Barra de Filtros (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        
        {/* 1. Buscador Texto (Folio/Cliente) */}
        <div className="md:col-span-8 bg-white p-2.5 rounded-xl shadow-sm flex items-center gap-2 border">
          <Search className="text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por folio o nombre del cliente..."
            className="flex-1 outline-none text-gray-700 w-full"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
          {filtroTexto && (
             <button onClick={() => setFiltroTexto('')} className="text-gray-400 hover:text-gray-600">
               <XCircle size={16}/>
             </button>
          )}
        </div>

        {/* 2. Filtro de Fecha */}
        <div className="md:col-span-4 bg-white p-2.5 rounded-xl shadow-sm flex items-center gap-2 border">
          <Calendar className="text-gray-400" size={20} />
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="outline-none text-gray-700 bg-transparent cursor-pointer w-full font-medium"
          >
            <option value="hoy">Hoy</option>
            <option value="ayer">Ayer</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="anio">Este Año</option>
            <option value="todos">Todo el Historial</option>
          </select>
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden animate-in fade-in duration-300">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="animate-spin mb-2 h-8 w-8 text-green-600" /> 
            <p>Cargando historial...</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Folio</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ventasFiltradas.length > 0 ? (
                ventasFiltradas.map((venta) => (
                  <tr key={venta.id_nota_venta} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-blue-600">
                      {venta.folio_nota}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(venta.fecha_salida).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {venta.cliente.nombre_completo}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">
                      ${Number(venta.total_venta).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        venta.pagado 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      }`}>
                        {venta.pagado ? 'PAGADO' : 'PENDIENTE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setVentaParaImprimir(venta)}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-full"
                        title="Ver / Imprimir Nota"
                      >
                        <Printer size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 flex flex-col items-center justify-center w-full">
                     <Search size={48} className="text-gray-200 mb-2" />
                     <p>No se encontraron ventas con los filtros actuales.</p>
                     {dateFilter !== 'todos' && (
                        <button onClick={() => setDateFilter('todos')} className="text-blue-600 text-sm hover:underline mt-2">
                            Ver todo el historial
                        </button>
                     )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal para imprimir historial */}
      {ventaParaImprimir && (
        <ImprimirNotaModal 
          isOpen={!!ventaParaImprimir}
          onClose={() => setVentaParaImprimir(null)}
          venta={ventaParaImprimir}
        />
      )}
    </div>
  );
}