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
        _sum: { m3_recibidos_aserradero: true },
        where: { id_aserradero: aserraderoId },
      }),
      prisma.ordenAserrado.aggregate({
        _sum: { total_m3_rollo_consumido: true },
        where: { id_aserradero: aserraderoId },
      }),
    ]);
    
    // CORRECCIÓN: Usamos Number() porque Prisma devuelve objetos Decimal
    const m3Recibidos = Number(remisionesSum._sum.m3_recibidos_aserradero || 0);
    const m3Consumidos = Number(ordenesSum._sum.total_m3_rollo_consumido || 0);
    
    // El stock físico actual es lo que entró (medido) menos lo que ya se aserró
    const m3EnPatio = m3Recibidos - m3Consumidos;

    // 2. Calcular Total de Inventario Terminado (Piezas)
    const stockTerminadoSum = await prisma.stockProductoTerminado.aggregate({
      _sum: { piezas_actuales: true },
      where: { id_aserradero: aserraderoId },
    });
    
    // Usamos Number() por seguridad (aunque sea Int)
    const totalPiezasTerminadas = Number(stockTerminadoSum._sum.piezas_actuales || 0);

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