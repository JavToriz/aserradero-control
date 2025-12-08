// app/(dashboard)/gastos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Printer, Search, Truck, Filter, CheckCircle, Clock } from 'lucide-react';
import { ImprimirReciboModal } from '@/components/gastos/ImprimirReciboModal';
import * as Tabs from '@radix-ui/react-tabs';

export default function GastosPage() {
  const [gastos, setGastos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [estadoFiltro, setEstadoFiltro] = useState('todos'); 
  const [gastoParaImprimir, setGastoParaImprimir] = useState<any | null>(null);

  const fetchGastos = async () => {
    const token = localStorage.getItem('sessionToken');
    try {
      const res = await fetch('/api/gastos', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setGastos(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGastos();
  }, []);

  const toggleEstadoPago = async (gasto: any) => {
    if (gasto.concepto_general !== 'FLETE') return;

    const nuevoEstado = gasto.estado_pago === 'PAGADO' ? 'PENDIENTE' : 'PAGADO';
    const token = localStorage.getItem('sessionToken');

    const gastosPrevios = [...gastos];
    setGastos(prev => prev.map(g => g.id_recibo_gasto === gasto.id_recibo_gasto ? { ...g, estado_pago: nuevoEstado } : g));

    try {
      const res = await fetch(`/api/gastos/${gasto.id_recibo_gasto}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ estado_pago: nuevoEstado })
      });

      if (!res.ok) throw new Error('Falló la actualización');
      
    } catch (error) {
      console.error(error);
      setGastos(gastosPrevios);
      alert("No se pudo actualizar el estado.");
    }
  };

  const gastosFiltrados = gastos.filter(g => {
    const coincideTexto = g.beneficiario.nombre_completo.toLowerCase().includes(filtro.toLowerCase()) ||
                          g.concepto_general.toLowerCase().includes(filtro.toLowerCase());
    
    const coincideTipo = activeTab === 'todos' || (activeTab === 'fletes' && g.concepto_general === 'FLETE');

    const coincideEstado = estadoFiltro === 'todos' || 
                           (estadoFiltro === 'pagado' && g.estado_pago === 'PAGADO') ||
                           (estadoFiltro === 'pendiente' && g.estado_pago === 'PENDIENTE');

    return coincideTexto && coincideTipo && coincideEstado;
  });

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gastos y Egresos</h1>
          <p className="text-gray-500">Control de recibos de dinero.</p>
        </div>
        <Link href="/gastos/nuevo" passHref>
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors shadow-sm">
            <Plus size={20} /> Nuevo Gasto
          </button>
        </Link>
      </header>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <Tabs.List className="flex border-b border-gray-200">
          <Tabs.Trigger value="todos" className="px-4 py-2 text-gray-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-medium">
            Todos los Gastos
          </Tabs.Trigger>
          <Tabs.Trigger value="fletes" className="px-4 py-2 text-gray-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-medium flex items-center gap-2">
            <Truck size={16} /> Fletes
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="bg-white p-2.5 rounded-xl shadow-sm flex items-center gap-2 border flex-1">
          <Search className="text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por beneficiario o concepto..." 
            className="flex-1 outline-none text-gray-700"
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
        </div>

        <div className="bg-white p-2.5 rounded-xl shadow-sm flex items-center gap-2 border w-full md:w-auto">
          <Filter className="text-gray-400" size={20} />
          <select 
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="outline-none text-gray-700 bg-transparent cursor-pointer"
          >
            <option value="todos">Todos los Estados</option>
            <option value="pendiente">⏳ Pendientes</option>
            <option value="pagado">✅ Pagados</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? <div className="p-8 text-center">Cargando...</div> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Beneficiario</th>
                <th className="px-6 py-3">Concepto</th>
                <th className="px-6 py-3">Monto</th>
                <th className="px-6 py-3 text-center">Estado</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gastosFiltrados.map((g) => (
                <tr key={g.id_recibo_gasto} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-600">{new Date(g.fecha_emision).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{g.beneficiario.nombre_completo}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={`w-fit px-2 py-0.5 rounded-full text-xs font-bold ${
                        g.concepto_general === 'FLETE' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {g.concepto_general}
                      </span>
                      {g.documento_asociado_id && (
                        <span className="text-xs text-gray-400 mt-1">Ref: #{g.documento_asociado_id}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-red-600">
                    ${Number(g.monto).toFixed(2)}
                  </td>
                  
                  {/* COLUMNA ESTADO DE PAGO - LIMPIA */}
                  <td className="px-6 py-4 text-center">
                    {g.concepto_general === 'FLETE' ? (
                      // Si es FLETE, mostramos el botón interactivo
                      <button
                        onClick={() => toggleEstadoPago(g)}
                        className={`flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all hover:scale-105 ${
                          g.estado_pago === 'PAGADO' 
                            ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200' 
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-200'
                        }`}
                        title="Clic para cambiar estado"
                      >
                        {g.estado_pago === 'PAGADO' ? (
                          <><CheckCircle size={14} /> PAGADO</>
                        ) : (
                          <><Clock size={14} /> PENDIENTE</>
                        )}
                      </button>
                    ) : (
                      // Si NO es Flete, mostramos vacío o un guión simple
                      <span className="text-gray-300 text-xs">-</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setGastoParaImprimir(g)}
                      className="text-gray-500 hover:text-blue-600 transition-colors"
                      title="Ver Recibo"
                    >
                      <Printer size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {!loading && gastosFiltrados.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            No se encontraron gastos con los filtros seleccionados.
          </div>
        )}
      </div>

      <ImprimirReciboModal 
        isOpen={!!gastoParaImprimir} 
        onClose={() => setGastoParaImprimir(null)} 
        gasto={gastoParaImprimir} 
      />
    </div>
  );
}