// src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Definimos la interfaz de los datos que esperamos recibir
interface DashboardKPIs {
  m3EnPatio: string;
  totalPiezasTerminadas: number;
  lotesActivos: number;
}

// ¡AQUÍ ESTÁ LA CLAVE! Debe haber un "export default function"
export default function DashboardPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('sessionToken');
        if (!token) {
          router.push('/login');
          return;
        }

        // Decodificar rol para mostrarlo (opcional)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const roles = payload.roles || [];
            setUserRole(roles.includes('admin') ? 'Administrador' : 'Operador');
        } catch (e) {
            console.log('Error leyendo token');
        }

        // Llamada a la API de KPIs
        const res = await fetch('/api/produccion/dashboard-kpis', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setKpis(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resumen del Aserradero</h1>
          <p className="text-sm text-gray-500 mt-1">
            Bienvenido, <span className="font-medium text-indigo-600">{userRole || 'Usuario'}</span>.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/ventas/nueva" className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm">
            + Nueva Venta
          </Link>
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
          <p className="text-sm font-medium text-gray-500">Materia Prima en Patio</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? '...' : kpis?.m3EnPatio || '0.000'} <span className="text-lg text-gray-400 font-normal">m³</span>
          </h3>
          <Link href="/produccion" className="text-sm text-indigo-600 mt-4 block hover:underline">Ver inventario &rarr;</Link>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-200 transition-colors">
          <p className="text-sm font-medium text-gray-500">Producto Terminado</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? '...' : kpis?.totalPiezasTerminadas || 0} <span className="text-lg text-gray-400 font-normal">pzas</span>
          </h3>
          <Link href="/productos" className="text-sm text-emerald-600 mt-4 block hover:underline">Ver catálogo &rarr;</Link>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-amber-200 transition-colors">
          <p className="text-sm font-medium text-gray-500">Lotes Activos</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? '...' : kpis?.lotesActivos || 0}
          </h3>
          <Link href="/produccion" className="text-sm text-amber-600 mt-4 block hover:underline">Gestionar lotes &rarr;</Link>
        </div>
      </div>
    </div>
  );
}