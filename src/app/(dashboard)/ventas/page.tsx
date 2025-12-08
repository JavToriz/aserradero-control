// app/(dashboard)/ventas/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Printer, Search, FileText, Loader2 } from 'lucide-react';
import { ImprimirNotaModal } from '@/components/ventas/ImprimirNotaModal';

export default function VentasPage() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  
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

  // Filtrado simple en cliente
  const ventasFiltradas = ventas.filter(v => 
    v.folio_nota.toLowerCase().includes(filtro.toLowerCase()) ||
    v.cliente.nombre_completo.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Encabezado */}
      <header className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Ventas y Salidas</h1>
          <p className="text-gray-500">Historial de notas de venta generadas.</p>
        </div>
        <Link href="/ventas/nueva" passHref>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm font-medium">
            <Plus size={20} />
            Nueva Venta
          </button>
        </Link>
      </header>

      {/* Barra de búsqueda */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex items-center gap-2 border">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Buscar por folio o cliente..."
          className="flex-1 outline-none text-gray-700"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      {/* Tabla de Ventas */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center flex justify-center text-gray-500">
            <Loader2 className="animate-spin mr-2" /> Cargando historial...
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
                    <td className="px-6 py-4 font-medium text-blue-600">
                      {venta.folio_nota}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(venta.fecha_salida).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {venta.cliente.nombre_completo}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700">
                      ${Number(venta.total_venta).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        venta.pagado 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {venta.pagado ? 'PAGADO' : 'PENDIENTE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setVentaParaImprimir(venta)}
                        className="text-gray-500 hover:text-blue-600 transition-colors p-2"
                        title="Ver / Imprimir Nota"
                      >
                        <Printer size={18} />
                      </button>
                      {/* Aquí podrías agregar botón de editar/cancelar en el futuro */}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No se encontraron ventas.
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