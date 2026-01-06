//src/components/produccion/BalanceCard.tsx
'use client';

import { useEffect, useState } from 'react';
import { FileText, Trees, AlertTriangle, ArrowRight } from 'lucide-react';

interface BalanceData {
  documentado: {
    entradas: number;
    salidas: number;
    stock_actual: number;
  };
  fisico: {
    entradas: number;
    salidas: number;
    stock_actual: number;
  };
  diferencia: number;
}

export function BalanceCard() {
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
      try {
        const token = localStorage.getItem('sessionToken');
        const res = await fetch('/api/inventario/balance-volumen', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const json = await res.json();
            setData(json);
        }
      } catch (error) {
          console.error(error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="h-48 bg-gray-100 animate-pulse rounded-xl w-full"></div>;

  if (!data) return <div className="p-4 text-red-500">No se pudo cargar el balance.</div>;

  const esDiferenciaNegativa = data.diferencia < 0; // Faltante físico vs papeles

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 w-full mb-8">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Trees className="text-green-700" size={20}/> 
        Balance de Inventario: Patio de Rollo
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUMNA 1: DOCUMENTADO (SEMARNAT) */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 relative">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-100 px-2 py-1 rounded">Documentado</span>
                    <p className="text-xs text-blue-400 mt-1">Libros SEMARNAT</p>
                </div>
                <FileText className="text-blue-500 opacity-50" size={24} />
            </div>
            
            <div className="mt-2">
                <span className="text-3xl font-bold text-blue-900">{data.documentado.stock_actual.toFixed(3)}</span>
                <span className="text-sm text-blue-600 font-medium ml-1">m³</span>
            </div>

            <div className="mt-4 text-xs text-blue-700 space-y-1">
                <div className="flex justify-between">
                    <span>Entradas (Remisiones):</span>
                    <span className="font-bold">{data.documentado.entradas.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Salidas (Reembarques):</span>
                    <span className="font-bold">{data.documentado.salidas.toFixed(2)}</span>
                </div>
            </div>
        </div>

        {/* COLUMNA 2: COMPARATIVA / DIFERENCIA */}
        <div className="flex flex-col items-center justify-center p-4">
            <div className="text-center mb-2">
                <span className="text-gray-400 text-sm">Diferencia (Medido - Documentado)</span>
            </div>
            
            <div className={`flex items-center gap-2 text-2xl font-bold ${esDiferenciaNegativa ? 'text-red-600' : 'text-green-600'}`}>
                {data.diferencia > 0 ? '+' : ''}{data.diferencia.toFixed(3)} m³
            </div>

            <div className="mt-2 text-center">
                {Math.abs(data.diferencia) > 0.1 ? (
                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${esDiferenciaNegativa ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        <AlertTriangle size={12} />
                        {esDiferenciaNegativa ? 'Faltante Real' : 'Excedente Real'}
                    </span>
                ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Balance Correcto</span>
                )}
            </div>
            <ArrowRight className="hidden md:block text-gray-300 mt-4 transform rotate-90 md:rotate-0" />
        </div>

        {/* COLUMNA 3: FÍSICO (MEDIDO) */}
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-100 px-2 py-1 rounded">Medido</span>
                    <p className="text-xs text-emerald-400 mt-1">Real en Patio</p>
                </div>
                <Trees className="text-emerald-500 opacity-50" size={24} />
            </div>

            <div className="mt-2">
                <span className="text-3xl font-bold text-emerald-900">{data.fisico.stock_actual.toFixed(3)}</span>
                <span className="text-sm text-emerald-600 font-medium ml-1">m³</span>
            </div>

             <div className="mt-4 text-xs text-emerald-700 space-y-1">
                <div className="flex justify-between">
                    <span>Entradas (Medición Real):</span>
                    <span className="font-bold">{data.fisico.entradas.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Consumo (Producción):</span>
                    <span className="font-bold">{data.fisico.salidas.toFixed(2)}</span>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}