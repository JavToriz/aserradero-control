// app/(dashboard)/remisiones/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Ruler, FileText, Loader2 } from 'lucide-react';
import { ModalMedidaReal } from '@/components/remisiones/ModalMedidaReal';

export default function RemisionesPage() {
  const [remisiones, setRemisiones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [remisionParaMedir, setRemisionParaMedir] = useState<any | null>(null);

  const fetchRemisiones = async () => {
    const token = localStorage.getItem('sessionToken');
    try {
      const res = await fetch('/api/remisiones', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setRemisiones(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRemisiones();
  }, []);

  const filtradas = remisiones.filter(r => 
    r.folio_progresivo.toLowerCase().includes(filtro.toLowerCase()) ||
    r.titular?.nombre_completo.toLowerCase().includes(filtro.toLowerCase())
  );

  // Helper para formato limpio (Punto 4)
  // Quita ceros decimales innecesarios (3000 -> 3000, 25.500 -> 25.5)
  const formatVol = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return '-';
    // Intl.NumberFormat es perfecto para esto
    return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 3 }).format(num);
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Remisiones Forestales</h1>
          <p className="text-gray-500">Entradas de materia prima y documentación.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reportes/semarnat">
            <button className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 font-medium">
              <FileText size={18} /> Libro SEMARNAT
            </button>
          </Link>
          <Link href="/remisiones/nueva">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm font-medium">
              <Plus size={18} /> Nueva Remisión
            </button>
          </Link>
        </div>
      </header>

      {/* Buscador simple */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border">
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
          <Search className="text-gray-400" size={20} />
          <input 
            placeholder="Buscar por folio o titular..." 
            className="bg-transparent outline-none w-full text-gray-700"
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center flex justify-center text-gray-500">
            <Loader2 className="animate-spin mr-2" /> Cargando...
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Folio</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Titular</th>
                <th className="px-6 py-3 text-right">Vol. Doc.</th>
                <th className="px-6 py-3 text-right">Vol. Real (Patio)</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtradas.map(r => (
                <tr key={r.id_remision} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-blue-600">{r.folio_progresivo}</td>
                  <td className="px-6 py-4 text-gray-600">{new Date(r.fecha_emision).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{r.titular?.nombre_completo}</td>
                  
                  {/* Vol. Documentado */}
                  <td className="px-6 py-4 text-right text-gray-500">
                    {formatVol(r.volumen_total_m3)} <span className="text-xs">m³</span>
                  </td>
                  
                  {/* Vol. Real (Destacado) */}
                  <td className="px-6 py-4 text-right">
                    {r.m3_recibidos_aserradero && r.m3_recibidos_aserradero > 0 ? (
                      <span className="font-bold text-green-700 bg-green-50 px-2 py-1 rounded">
                        {formatVol(r.m3_recibidos_aserradero)} m³
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Pendiente</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setRemisionParaMedir(r)}
                      className="text-gray-500 hover:text-blue-600 p-2 rounded hover:bg-blue-50 transition-colors"
                      title="Registrar Medida Real"
                    >
                      <Ruler size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No se encontraron remisiones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <ModalMedidaReal 
        isOpen={!!remisionParaMedir}
        onClose={() => setRemisionParaMedir(null)}
        remision={remisionParaMedir}
        onSuccess={fetchRemisiones}
      />
    </div>
  );
}