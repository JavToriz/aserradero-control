// app/(dashboard)/reembarques/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, FileText, Loader2 } from 'lucide-react';

export default function ReembarquesPage() {
  const [reembarques, setReembarques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('sessionToken');
    fetch('/api/reembarques', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setReembarques(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = reembarques.filter(r => 
    r.folio_progresivo.toLowerCase().includes(filtro.toLowerCase()) ||
    r.destinatario?.nombre_completo.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reembarques Forestales</h1>
          <p className="text-gray-500">Salidas de producto y documentación.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reportes/semarnat">
            <button className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 font-medium">
              <FileText size={18} /> Libro SEMARNAT
            </button>
          </Link>
          <Link href="/reembarques/nueva">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm font-medium">
              <Plus size={18} /> Nuevo Reembarque
            </button>
          </Link>
        </div>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border">
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
          <Search className="text-gray-400" size={20} />
          <input 
            placeholder="Buscar por folio o destinatario..." 
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
                <th className="px-6 py-3">Destinatario</th>
                <th className="px-6 py-3 text-right">Volumen (m³)</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(r => (
                <tr key={r.id_reembarque} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-blue-600">{r.folio_progresivo}</td>
                  <td className="px-6 py-4 text-gray-600">{new Date(r.fecha_emision).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{r.destinatario?.nombre_completo}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-700">
                    {Number(r.volumen_total_m3).toFixed(3)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs text-gray-400">Ver Detalle</span>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No se encontraron reembarques.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}