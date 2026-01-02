// app/(dashboard)/configuracion/precios/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertTriangle, Plus, Loader2 } from 'lucide-react';
import { SuccessActionModal } from '@/components/ui/SuccessActionModal';
import { ErrorActionModal } from '@/components/ui/ErrorActionModal'; 
import { NuevoPrecioModal } from '@/components/configuracion/NuevoPrecioModal';

// Tipo actualizado con Mayoreo
type PrecioBase = {
  id_precio_base: number;
  especie: string;
  calidad: string;
  precio_por_pt: number;
  precio_mayoreo_por_pt?: number;
  fecha_actualizacion: string;
};

export default function ConfiguracionPreciosPage() {
  const [precios, setPrecios] = useState<PrecioBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingCatalog, setUpdatingCatalog] = useState(false);
  
  // Estado para modales
  const [successModal, setSuccessModal] = useState({ open: false, title: '', message: '' });
  const [errorModal, setErrorModal] = useState({ open: false, title: '', message: '' }); // <--- NUEVO
  const [isNewPriceModalOpen, setIsNewPriceModalOpen] = useState(false);

  useEffect(() => {
    fetchPrecios();
  }, []);

  const fetchPrecios = async () => {
    const token = localStorage.getItem('sessionToken');
    try {
      const res = await fetch('/api/precios', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setPrecios(await res.json());
      } else {
        throw new Error('Error al cargar precios');
      }
    } catch (error) {
      console.error(error);
      // No mostramos modal aquí para no bloquear la carga inicial, tal vez un toast
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (id: number, newValue: string) => {
    const val = parseFloat(newValue);
    if (isNaN(val)) return;
    setPrecios(prev => prev.map(p => p.id_precio_base === id ? { ...p, precio_por_pt: val } : p));
  };

  const handleMayoreoChange = (id: number, newValue: string) => {
    const val = parseFloat(newValue);
    const finalVal = isNaN(val) ? 0 : val;
    setPrecios(prev => prev.map(p => p.id_precio_base === id ? { ...p, precio_mayoreo_por_pt: finalVal } : p));
  };

  const handleSavePrices = async () => {
    setSaving(true);
    const token = localStorage.getItem('sessionToken');
    try {
      const promises = precios.map(p => 
        fetch(`/api/precios/${p.id_precio_base}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            precio_por_pt: p.precio_por_pt,
            precio_mayoreo_por_pt: p.precio_mayoreo_por_pt 
          })
        })
      );
      
      const responses = await Promise.all(promises);
      const errors = responses.filter(r => !r.ok);

      if (errors.length > 0) {
        throw new Error(`Fallaron ${errors.length} actualizaciones.`);
      }

      setSuccessModal({
        open: true,
        title: 'Precios Base Guardados',
        message: 'Se han guardado los precios de Menudeo y Mayoreo.'
      });
    } catch (error: any) {
      setErrorModal({
        open: true,
        title: 'Error al Guardar',
        message: error.message || 'No se pudieron guardar los cambios. Intenta de nuevo.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCatalog = async () => {
    if (!confirm("¿Seguro? Esto recalculará los precios de venta de todos los productos automáticos.")) return;

    setUpdatingCatalog(true);
    const token = localStorage.getItem('sessionToken');
    
    try {
      const promises = precios.map(p => 
        fetch('/api/precios/actualizar-catalogo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ especie: p.especie, calidad: p.calidad })
        })
      );

      const responses = await Promise.all(promises);
      
      // Verificar si alguna petición falló y extraer el mensaje
      for (const res of responses) {
        if (!res.ok) {
           const errData = await res.json();
           throw new Error(errData.message || 'Error en la actualización masiva');
        }
      }
      
      setSuccessModal({
        open: true,
        title: 'Catálogo Actualizado',
        message: 'Los precios de venta (Público y Mayoreo) han sido recalculados.'
      });

    } catch (error: any) {
      console.error(error);
      setErrorModal({
        open: true,
        title: 'Error de Actualización',
        message: `Hubo un problema al actualizar el catálogo: ${error.message}`
      });
    } finally {
      setUpdatingCatalog(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Lista de Precios Base</h1>
            <p className="text-gray-500 mt-1">
              Define los precios por <strong>Pie Tablar (PT)</strong> para Menudeo y Mayoreo.
            </p>
          </div>
          <button 
            onClick={() => setIsNewPriceModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 shadow-sm"
          >
            <Plus size={20} /> Nuevo Precio Base
          </button>
        </header>

        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 text-amber-700 bg-amber-50 px-4 py-3 rounded-lg border border-amber-100 flex-1">
            <AlertTriangle className="flex-shrink-0" />
            <p className="text-sm">
              Estos precios base se usan para calcular el costo final de las tablas. Usa "Aplicar a Catálogo" para actualizar.
            </p>
          </div>
          <button 
            onClick={handleUpdateCatalog}
            disabled={updatingCatalog || saving}
            className="whitespace-nowrap bg-white text-blue-700 border border-blue-200 px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-50 transition-all disabled:opacity-50"
          >
            {updatingCatalog ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />}
            Aplicar a Catálogo
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Cargando precios...</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Especie</th>
                  <th className="px-6 py-4">Calidad</th>
                  <th className="px-6 py-4 text-center bg-blue-50 border-l border-r">Base Menudeo (PT)</th>
                  <th className="px-6 py-4 text-center bg-green-50 border-r">Base Mayoreo (PT)</th>
                  <th className="px-6 py-4 text-right">Última Act.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {precios.map((p) => (
                  <tr key={p.id_precio_base} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.especie}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        p.calidad === 'Primera' ? 'bg-green-100 text-green-700' :
                        p.calidad === 'Segunda' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {p.calidad}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-center border-l border-r border-gray-100 bg-blue-50/30">
                      <div className="relative max-w-[120px] mx-auto">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                        <input 
                          type="number" 
                          step="0.01"
                          className="w-full pl-6 pr-3 py-2 border rounded-lg font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-right"
                          value={p.precio_por_pt}
                          onChange={(e) => handlePriceChange(p.id_precio_base, e.target.value)}
                        />
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center border-r border-gray-100 bg-green-50/30">
                      <div className="relative max-w-[120px] mx-auto">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                        <input 
                          type="number" 
                          step="0.01"
                          className="w-full pl-6 pr-3 py-2 border rounded-lg font-bold text-gray-800 focus:ring-2 focus:ring-green-500 outline-none text-right"
                          value={p.precio_mayoreo_por_pt || ''}
                          placeholder="0.00"
                          onChange={(e) => handleMayoreoChange(p.id_precio_base, e.target.value)}
                        />
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right text-gray-500 text-xs">
                      {new Date(p.fecha_actualizacion).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {precios.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                      No hay precios registrados. Añade uno nuevo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          
          <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
            <button 
              onClick={handleSavePrices}
              disabled={saving || updatingCatalog}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              Guardar Cambios
            </button>
          </div>
        </div>

      </div>

      <SuccessActionModal 
        isOpen={successModal.open}
        onClose={() => setSuccessModal({ ...successModal, open: false })}
        title={successModal.title}
        message={successModal.message}
      />

      <ErrorActionModal 
        isOpen={errorModal.open}
        onClose={() => setErrorModal({ ...errorModal, open: false })}
        title={errorModal.title}
        message={errorModal.message}
      />

      <NuevoPrecioModal
        isOpen={isNewPriceModalOpen}
        onClose={() => setIsNewPriceModalOpen(false)}
        onSaveSuccess={() => { fetchPrecios(); }}
      />
    </div>
  );
}