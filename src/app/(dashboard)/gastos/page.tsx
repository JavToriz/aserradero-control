'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
// --- AGREGADO: Import Trash2 ---
import { Plus, Printer, Search, Truck, Filter, Calendar, XCircle, Trees, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { ImprimirReciboModal } from '@/components/gastos/ImprimirReciboModal';
import * as Tabs from '@radix-ui/react-tabs';
import { Switch } from '@/components/ui/Switch2'; 
// --- AGREGADO: Import ConfirmationModal ---
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

// --- TIPOS ---
type Gasto = {
  id_recibo_gasto: number;
  fecha_emision: string;
  monto: number;
  concepto_general: string;
  estado_pago: string;
  documento_asociado_id: number | null;
  folio_remision_asociada?: string | null;
  beneficiario: { nombre_completo: string };
  // Tipado dinámico para campos extra que puedan venir de la DB
  [key: string]: any;
};

type GrupoRemision = {
  id_remision: number;
  folio_visual: string;
  proveedor: string;
  pagos: Gasto[];
  totalPagado: number;
  ultimoPago: string;
};

// --- HELPER PARA FECHAS ---
const isDateInRange = (dateString: string, filter: string): boolean => {
  const d = new Date(dateString);
  const dateToCheck = new Date(d.getFullYear(), d.getMonth(), d.getDate()); 
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case 'hoy': return dateToCheck.getTime() === today.getTime();
    case 'ayer':
      const ayer = new Date(today);
      ayer.setDate(ayer.getDate() - 1);
      return dateToCheck.getTime() === ayer.getTime();
    case 'semana':
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - today.getDay()); 
      return dateToCheck >= firstDay;
    case 'mes':
      return dateToCheck.getMonth() === today.getMonth() && dateToCheck.getFullYear() === today.getFullYear();
    case 'anio': return dateToCheck.getFullYear() === today.getFullYear();
    default: return true;
  }
};

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [dateFilter, setDateFilter] = useState('mes');
  
  const [gastoParaImprimir, setGastoParaImprimir] = useState<any | null>(null);
  const [expandedRemisiones, setExpandedRemisiones] = useState<Record<number, boolean>>({});

  // --- NUEVO: Estados para Eliminar ---
  const [gastoAEliminar, setGastoAEliminar] = useState<Gasto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // --- Manejador de Eliminación MEJORADO ---
  const handleConfirmDelete = async () => {
    if (!gastoAEliminar) return;
    setIsDeleting(true);
    const token = localStorage.getItem('sessionToken');
    
    // Guardamos datos para el mensaje de éxito antes de borrar el estado
    const monto = Number(gastoAEliminar.monto).toFixed(2);
    const concepto = gastoAEliminar.concepto_general;

    try {
      const res = await fetch(`/api/gastos/${gastoAEliminar.id_recibo_gasto}`, {
        method: 'DELETE',
        headers: { 
            'Authorization': `Bearer ${token}` 
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error desconocido en el servidor');
      }

      // 1. Éxito: Actualizamos la tabla
      setGastos(prev => prev.filter(g => g.id_recibo_gasto !== gastoAEliminar.id_recibo_gasto));
      
      // 2. Cerramos el modal de confirmación
      setGastoAEliminar(null);

      // 3. Feedback visual (Alert de éxito)
      // Usamos un pequeño timeout para que se sienta natural tras cerrar el modal
      setTimeout(() => {
        alert(`Gasto eliminado correctamente.`);
      }, 300);
      
    } catch (error: any) {
      console.error("Error capturado:", error);
      alert(`❌ No se pudo eliminar: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleEstadoPago = async (gasto: Gasto) => {
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

  const toggleAccordion = (id: number) => {
    setExpandedRemisiones(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const { datosFiltrados, totalFiltrado } = useMemo(() => {
    const filtrados = gastos.filter(g => {
      const textoBusqueda = filtroTexto.toLowerCase();
      const coincideTexto = g.beneficiario.nombre_completo.toLowerCase().includes(textoBusqueda) ||
                            g.concepto_general.toLowerCase().includes(textoBusqueda) ||
                            (g.folio_remision_asociada || '').toLowerCase().includes(textoBusqueda) ||
                            (g.documento_asociado_id?.toString() || '').includes(textoBusqueda);
      
      const coincideTipo = activeTab === 'todos' || 
                           (activeTab === 'fletes' && g.concepto_general === 'FLETE') ||
                           (activeTab === 'madera' && g.concepto_general === 'PAGO DE MADERA');

      const coincideEstado = estadoFiltro === 'todos' || 
                             (estadoFiltro === 'pagado' && g.estado_pago === 'PAGADO') ||
                             (estadoFiltro === 'pendiente' && g.estado_pago === 'PENDIENTE');

      const coincideFecha = isDateInRange(g.fecha_emision, dateFilter);

      return coincideTexto && coincideTipo && coincideEstado && coincideFecha;
    });

    const total = filtrados.reduce((acc, curr) => acc + Number(curr.monto), 0);
    return { datosFiltrados: filtrados, totalFiltrado: total };
  }, [gastos, filtroTexto, activeTab, estadoFiltro, dateFilter]);

  const gruposMadera = useMemo(() => {
    if (activeTab !== 'madera') return [];
    
    const grupos: Record<number, GrupoRemision> = {};
    
    datosFiltrados.forEach(g => {
      const idKey = g.documento_asociado_id || 0;
      if (!grupos[idKey]) {
        grupos[idKey] = {
          id_remision: idKey,
          folio_visual: g.folio_remision_asociada || (idKey > 0 ? `#${idKey} (Sin Folio)` : 'Sin Referencia'),
          proveedor: g.beneficiario.nombre_completo,
          pagos: [],
          totalPagado: 0,
          ultimoPago: g.fecha_emision
        };
      }
      grupos[idKey].pagos.push(g);
      grupos[idKey].totalPagado += Number(g.monto);
      if (new Date(g.fecha_emision) > new Date(grupos[idKey].ultimoPago)) {
          grupos[idKey].ultimoPago = g.fecha_emision;
      }
    });

    return Object.values(grupos).sort((a, b) => 
      new Date(b.ultimoPago).getTime() - new Date(a.ultimoPago).getTime()
    );
  }, [datosFiltrados, activeTab]);

  // --- RENDERIZADO TABLA GENERAL (Con botón eliminar) ---
  const renderTablaGeneral = () => (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-700 uppercase font-semibold">
            <tr>
            <th className="px-6 py-3">Fecha</th>
            <th className="px-6 py-3">Beneficiario</th>
            <th className="px-6 py-3">Concepto</th>
            <th className="px-6 py-3">Monto</th>
            <th className="px-6 py-3 text-center">Pago</th>
            <th className="px-6 py-3 text-center">Acciones</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
            {datosFiltrados.map((g) => (
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
                    {g.folio_remision_asociada && <span className="text-xs text-blue-600 font-medium mt-1">Ref: {g.folio_remision_asociada}</span>}
                </div>
                </td>
                <td className="px-6 py-4 font-bold text-red-600">${Number(g.monto).toFixed(2)}</td>
                
                <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-1">
                        <Switch 
                            checked={g.estado_pago === 'PAGADO'}
                            onChange={() => toggleEstadoPago(g)}
                        />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${g.estado_pago === 'PAGADO' ? 'text-green-600' : 'text-gray-400'}`}>
                            {g.estado_pago === 'PAGADO' ? 'Pagado' : 'Pendiente'}
                        </span>
                    </div>
                </td>

                <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <button 
                            onClick={() => setGastoParaImprimir(g)}
                            className="text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-full"
                            title="Ver Recibo"
                        >
                            <Printer size={18} />
                        </button>
                        
                        {/* BOTÓN ELIMINAR */}
                        <button 
                            onClick={() => setGastoAEliminar(g)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full"
                            title="Eliminar Gasto"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </td>
            </tr>
            ))}
        </tbody>
        </table>
        {datosFiltrados.length === 0 && (
            <div className="p-8 text-center text-gray-400">No se encontraron gastos.</div>
        )}
    </div>
  );

  // --- RENDERIZADO VISTA MADERA (Con botón eliminar) ---
  const renderVistaMadera = () => {
    if (gruposMadera.length === 0) {
        return (
            <div className="p-12 text-center text-gray-400 border-2 border-dashed rounded-xl bg-gray-50/50">
                <Trees size={48} className="mx-auto mb-2 text-gray-300" />
                <p>No hay pagos de madera en el periodo seleccionado.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {gruposMadera.map((grupo) => {
                const isExpanded = expandedRemisiones[grupo.id_remision];
                return (
                    <div key={grupo.id_remision} className="bg-white border rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                        <div 
                            onClick={() => toggleAccordion(grupo.id_remision)}
                            className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer bg-gray-50 hover:bg-white transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                                    <Trees size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {grupo.id_remision === 0 ? 'Pagos Sin Referencia' : `Remisión: ${grupo.folio_visual}`}
                                    </h3>
                                    <p className="text-sm text-gray-500 font-medium">{grupo.proveedor}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 mt-4 md:mt-0">
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase">Abonado (Periodo)</p>
                                    <p className="text-xl font-bold text-green-600">${grupo.totalPagado.toFixed(2)}</p>
                                </div>
                                <div className="text-gray-400">
                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="border-t bg-white p-4 animate-in slide-in-from-top-2 duration-200">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                    <Calendar size={14}/> Historial de Pagos (Filtrado)
                                </h4>
                                <div className="space-y-2">
                                    {grupo.pagos.map((pago, idx) => (
                                        <div key={pago.id_recibo_gasto} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-700">Abono</span>
                                                <span className="text-xs text-gray-400">{new Date(pago.fecha_emision).toLocaleDateString()}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-gray-700">${Number(pago.monto).toFixed(2)}</span>
                                                
                                                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                                                    <Switch 
                                                        checked={pago.estado_pago === 'PAGADO'}
                                                        onChange={() => toggleEstadoPago(pago)}
                                                    />
                                                    <span className={`text-[10px] font-bold uppercase w-14 ${pago.estado_pago === 'PAGADO' ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {pago.estado_pago === 'PAGADO' ? 'Pagado' : 'Pendiente'}
                                                    </span>
                                                </div>

                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setGastoParaImprimir(pago); }}
                                                    className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50"
                                                    title="Imprimir"
                                                >
                                                    <Printer size={16} />
                                                </button>

                                                {/* BOTÓN ELIMINAR (Acordeón) */}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setGastoAEliminar(pago); }}
                                                    className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gastos y Egresos</h1>
          <p className="text-gray-500">Gestión de flujo de efectivo.</p>
        </div>
        
        <div className="flex gap-3">
            <div className="bg-white px-4 py-2 rounded-lg border shadow-sm text-right hidden md:block">
                <p className="text-xs text-gray-400 uppercase font-bold">Total en Pantalla</p>
                <p className="text-lg font-normal text-gray-600">${totalFiltrado.toFixed(2)}</p>
            </div>
            <Link href="/gastos/nuevo" passHref>
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors shadow-sm h-full">
                    <Plus size={20} /> <span className="hidden sm:inline">Nuevo Gasto</span>
                </button>
            </Link>
        </div>
      </header>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <Tabs.List className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
          <Tabs.Trigger value="todos" className="px-4 py-2 text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-medium whitespace-nowrap">
            Todos los Gastos
          </Tabs.Trigger>
          <Tabs.Trigger value="fletes" className="px-4 py-2 text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-medium flex items-center gap-2 whitespace-nowrap">
            <Truck size={16} /> Fletes
          </Tabs.Trigger>
          <Tabs.Trigger value="madera" className="px-4 py-2 text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-medium flex items-center gap-2 whitespace-nowrap">
            <Trees size={16} /> Pagos de Madera
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        <div className="md:col-span-5 bg-white p-2.5 rounded-xl shadow-sm flex items-center gap-2 border">
          <Search className="text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="flex-1 outline-none text-gray-700 w-full"
            value={filtroTexto}
            onChange={e => setFiltroTexto(e.target.value)}
          />
          {filtroTexto && <button onClick={() => setFiltroTexto('')} className="text-gray-400"><XCircle size={16}/></button>}
        </div>

        <div className="md:col-span-4 bg-white p-2.5 rounded-xl shadow-sm flex items-center gap-2 border">
          <Calendar className="text-gray-400" size={20} />
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="outline-none text-gray-700 bg-transparent cursor-pointer w-full font-medium">
            <option value="hoy">Hoy</option>
            <option value="ayer">Ayer</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="anio">Este Año</option>
            <option value="todos">Todo el Historial</option>
          </select>
        </div>

        {activeTab !== 'madera' && (
            <div className="md:col-span-3 bg-white p-2.5 rounded-xl shadow-sm flex items-center gap-2 border">
            <Filter className="text-gray-400" size={20} />
            <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="outline-none text-gray-700 bg-transparent cursor-pointer w-full">
                <option value="todos">Todos los Estados</option>
                <option value="pendiente"> Pendientes</option>
                <option value="pagado">Pagados</option>
            </select>
            </div>
        )}
      </div>

      <div className="animate-in fade-in duration-300">
        {loading ? (
            <div className="p-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div><p>Cargando registros...</p></div>
        ) : (
            <>
                {activeTab === 'madera' ? renderVistaMadera() : renderTablaGeneral()}
            </>
        )}
      </div>

      <ImprimirReciboModal 
        isOpen={!!gastoParaImprimir} 
        onClose={() => setGastoParaImprimir(null)} 
        gasto={gastoParaImprimir} 
      />

      {/* --- NUEVO: Modal de Confirmación --- */}
      <ConfirmationModal
        isOpen={!!gastoAEliminar}
        onClose={() => setGastoAEliminar(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar Gasto?"
        message={`Estás a punto de eliminar el gasto de $${Number(gastoAEliminar?.monto || 0).toFixed(2)} (${gastoAEliminar?.concepto_general}). Si estaba pagado en efectivo, el dinero regresará a la caja.`}
        confirmText={isDeleting ? "Eliminando..." : "Sí, Eliminar"}
        cancelText="Volver"
        variant="danger"
      />
    </div>
  );
}