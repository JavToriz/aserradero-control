// app/api/stock-producto-terminado/kanban/route.ts
// Endpoint para Vista 7.3: "Gestión y Movimiento de Inventario"
// Obtiene todos los lotes de stock para construir el tablero Kanban.

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

/**
 * GET: Obtener todos los lotes de Stock Terminado
 * El frontend usará esto para construir las 4 columnas del Kanban.
 */
export async function GET(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const stockItems = await prisma.stockProductoTerminado.findMany({
      where: {
        id_aserradero: authPayload.aserraderoId,
        piezas_actuales: {
          gt: 0, // Solo mostrar lotes que tengan piezas
        },
      },
      include: {
        // Incluimos los datos del producto del catálogo para mostrar la tarjeta
        producto: {
          include: {
            atributos_madera: true,
            atributos_triplay: true,
          },
        },
      },
      orderBy: {
        fecha_ingreso: 'asc', // Los más antiguos primero
      },
    });

    // El frontend recibirá un array plano.
    // Deberá agrupar este array por 'ubicacion' para renderizar las columnas.
    return NextResponse.json(stockItems);

  } catch (error) {
    console.error("Error al obtener el stock para Kanban:", error);
    return NextResponse.json({ message: 'Error al obtener el stock' }, { status: 500 });
  }
}