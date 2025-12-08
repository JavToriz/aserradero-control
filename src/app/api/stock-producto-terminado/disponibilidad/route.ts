// app/api/stock-producto-terminado/disponibilidad/route.ts
// Endpoint para saber en qué ubicaciones hay stock de un producto específico.

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

export async function GET(req: NextRequest) {
  // 1. Verificación de Autenticación
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  // 2. Obtención y Validación de Parámetros
  const { searchParams } = req.nextUrl;
  const id_producto_str = searchParams.get('id_producto');

  // Validación 1: ¿Existe el parámetro?
  if (!id_producto_str || id_producto_str === 'undefined' || id_producto_str === 'null') {
    return NextResponse.json({ message: 'ID de producto requerido y válido' }, { status: 400 });
  }

  // Validación 2: ¿Es un número real?
  const id_producto = parseInt(id_producto_str, 10);

  if (isNaN(id_producto)) {
    return NextResponse.json({ message: 'El ID del producto debe ser un número válido' }, { status: 400 });
  }

  try {
    // 3. Consulta a la Base de Datos (Ahora segura)
    const stockDisponible = await prisma.stockProductoTerminado.findMany({
      where: {
        id_aserradero: authPayload.aserraderoId,
        id_producto_catalogo: id_producto, // Aquí ya estamos seguros de que es un número
        piezas_actuales: { gt: 0 },
      },
      select: {
        id_stock: true,
        ubicacion: true,
        piezas_actuales: true,
        fecha_ingreso: true,
      },
      orderBy: {
        fecha_ingreso: 'asc', // FIFO
      },
    });

    return NextResponse.json(stockDisponible);

  } catch (error: any) {
    console.error("Error CRÍTICO en API Disponibilidad:", error);
    return NextResponse.json({ 
      message: 'Error interno al consultar disponibilidad.' 
    }, { status: 500 });
  }
}