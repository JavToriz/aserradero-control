// app/api/stock-producto-terminado/route.ts
// Endpoint para Formulario 7.2: "Registrar Producto Transformado"
// Esto crea las "entradas" al Inventario de Producto Terminado.

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

// El 'body' esperado para este POST será:
// {
//   id_orden_aserrado_origen: 1 (opcional),
//   fecha_ingreso: '2025-11-17',
//   productos: [
//     { id_producto_catalogo: 1, piezas_actuales: 50, ubicacion: 'PRODUCCION' },
//     { id_producto_catalogo: 2, piezas_actuales: 100, ubicacion: 'PRODUCCION' }
//   ]
// }

/**
 * POST: Crear uno o más lotes de Stock de Producto Terminado (Form 7.2)
 * Esto registra la "producción" de tablas, vigas, etc.
 */
export async function POST(req: Request) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id_orden_aserrado_origen, fecha_ingreso, productos } = body;

    if (!fecha_ingreso || !productos || !Array.isArray(productos) || productos.length === 0) {
      return NextResponse.json({ message: 'Fecha y al menos un producto son requeridos' }, { status: 400 });
    }

    // Preparamos los datos para la transacción
    const createData = productos.map((producto: any) => {
      if (!producto.id_producto_catalogo || !producto.piezas_actuales || !producto.ubicacion) {
        throw new Error('Cada producto debe tener id_producto_catalogo, piezas_actuales y ubicacion');
      }
      return {
        id_aserradero: authPayload.aserraderoId,
        id_producto_catalogo: producto.id_producto_catalogo,
        id_orden_aserrado_origen: id_orden_aserrado_origen || null,
        piezas_actuales: producto.piezas_actuales,
        ubicacion: producto.ubicacion, // Ej: 'PRODUCCION'
        fecha_ingreso: new Date(fecha_ingreso).toISOString(),
      };
    });

    // Usamos una transacción para crear todos los lotes de stock
    const resultado = await prisma.stockProductoTerminado.createMany({
      data: createData,
    });

    return NextResponse.json(resultado, { status: 201 });

  } catch (error: any) {
    console.error("Error al registrar producto transformado:", error);
    return NextResponse.json({ message: error.message || 'Error al registrar producto transformado' }, { status: 500 });
  }
}