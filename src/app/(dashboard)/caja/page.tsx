'use client';
import { useState, useEffect } from 'react';
import { VistaCajaAbierta } from '@/components/caja/VistaCajaAbierta';
import { VistaCajaCerrada } from '@/components/caja/VistaCajaCerrada';
import { Loader2 } from 'lucide-react';

export default function CajaPage() {
  const [loading, setLoading] = useState(true);
  const [dataCaja, setDataCaja] = useState<any>(null);
  const [error, setError] = useState('');

  const cargarCaja = async () => {
    try {
      setLoading(true);
      // 1. Obtener token
      const token = localStorage.getItem('sessionToken');
      
      // 2. Fetch manual
      const res = await fetch('/api/caja?id_aserradero=1', {
        headers: {
          'Authorization': `Bearer ${token}` // <--- HEADER MANUAL
        }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setDataCaja(data);
      } else {
        setError(data.error || 'Error al cargar caja');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCaja();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500">Cargando caja...</span>
      </div>
    );
  }

  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Gestión de Caja (Turno)
      </h1>

      {dataCaja?.estado === 'ABIERTO' ? (
        <VistaCajaAbierta 
          data={dataCaja} 
          onRefresh={cargarCaja} 
        />
      ) : (
        <VistaCajaCerrada 
          onCajaAbierta={cargarCaja} 
        />
      )}
    </div>
  );
}