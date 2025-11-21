// app/api/produccion/dashboard-kpis/route.ts
// Endpoint NUEVO para calcular los indicadores clave del dashboard

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }
  const aserraderoId = authPayload.aserraderoId;

  try {
    // 1. Calcular Balance de Materia Prima (m³ en Patio)
    const [remisionesSum, ordenesSum] = await Promise.all([
      prisma.remision.aggregate({
        _sum: { volumen_total_m3: true },
        where: { id_aserradero: aserraderoId },
      }),
      prisma.ordenAserrado.aggregate({
        _sum: { total_m3_rollo_consumido: true },
        where: { id_aserradero: aserraderoId },
      }),
    ]);
    
    const m3Recibidos = remisionesSum._sum.volumen_total_m3 || 0;
    const m3Consumidos = ordenesSum._sum.total_m3_rollo_consumido || 0;
    const m3EnPatio = m3Recibidos - m3Consumidos;

    // 2. Calcular Total de Inventario Terminado (Piezas)
    const stockTerminadoSum = await prisma.stockProductoTerminado.aggregate({
      _sum: { piezas_actuales: true },
      where: { id_aserradero: aserraderoId },
    });
    
    const totalPiezasTerminadas = stockTerminadoSum._sum.piezas_actuales || 0;

    // 3. Contar Lotes de Stock Activos
    const lotesActivos = await prisma.stockProductoTerminado.count({
      where: { 
        id_aserradero: aserraderoId,
        piezas_actuales: { gt: 0 }
      },
    });

    return NextResponse.json({
      m3EnPatio: m3EnPatio.toFixed(4),
      totalPiezasTerminadas,
      lotesActivos,
      // (Aquí se podría añadir el cálculo de Rendimiento en el futuro)
    });

  } catch (error) {
    console.error("Error al calcular KPIs del dashboard:", error);
    return NextResponse.json({ message: 'Error al calcular KPIs' }, { status: 500 });
  }
}