// app/api/stock-producto-terminado/[id_stock]/mover/route.ts
// Endpoint para Vista 7.3: "Gestión y Movimiento de Inventario"
// Esta API mueve un lote de stock de una ubicación a otra.

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

interface Params {
  params: { id_stock: string };
}

/**
 * PUT: Mover una cantidad específica de un lote de stock a una nueva ubicación.
 * Body esperado: { ubicacion_destino: string, piezas_a_mover: number }
 */
export async function PUT(req: NextRequest, { params }: Params) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId || !authPayload.userId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const id_stock_origen = parseInt(params.id_stock, 10);
    const body = await req.json();
    const { ubicacion_destino, piezas_a_mover } = body;

    // --- Validación de Entrada ---
    if (!ubicacion_destino || !piezas_a_mover) {
      return NextResponse.json({ message: 'La "ubicacion_destino" y "piezas_a_mover" son requeridas' }, { status: 400 });
    }
    if (piezas_a_mover <= 0) {
      return NextResponse.json({ message: 'Las piezas a mover deben ser un número positivo' }, { status: 400 });
    }

    // --- Inicio de la Transacción ---
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Obtener el lote de stock original y bloquearlo
      const loteOrigen = await tx.stockProductoTerminado.findFirstOrThrow({
        where: {
          id_stock: id_stock_origen,
          id_aserradero: authPayload.aserraderoId,
        },
      });

      // 2. Más validaciones
      if (piezas_a_mover > loteOrigen.piezas_actuales) {
        throw new Error('No puedes mover más piezas de las que existen en el lote');
      }
      if (loteOrigen.ubicacion === ubicacion_destino) {
        throw new Error('La ubicación de destino no puede ser la misma que la de origen');
      }

      const esMovimientoCompleto = piezas_a_mover === loteOrigen.piezas_actuales;

      // 3. Buscar un lote compatible en el destino para "fusionar"
      // Un lote es compatible si tiene mismo producto, fecha de ingreso y orden de origen.
      const loteDestinoExistente = await tx.stockProductoTerminado.findFirst({
        where: {
          id_aserradero: authPayload.aserraderoId,
          id_producto_catalogo: loteOrigen.id_producto_catalogo,
          ubicacion: ubicacion_destino,
          fecha_ingreso: loteOrigen.fecha_ingreso,
          id_orden_aserrado_origen: loteOrigen.id_orden_aserrado_origen,
        },
      });

      let idLoteDestinoAfectado: number;
      let loteDestinoActualizado;

      if (loteDestinoExistente) {
        // --- CASO 1: FUSIÓN (El lote ya existe en el destino) ---
        idLoteDestinoAfectado = loteDestinoExistente.id_stock;
        
        // Aumentamos las piezas del lote de destino
        loteDestinoActualizado = await tx.stockProductoTerminado.update({
          where: { id_stock: idLoteDestinoAfectado },
          data: {
            piezas_actuales: { increment: piezas_a_mover },
          },
        });

      } else {
        // --- CASO 2: DIVISIÓN (No hay lote compatible, creamos uno nuevo) ---
        
        // Si movemos el lote *completo* a un lugar nuevo, no creamos un lote,
        // simplemente actualizamos el original (esta es la lógica V1).
        if (esMovimientoCompleto) {
          idLoteDestinoAfectado = loteOrigen.id_stock; // El lote afectado es el mismo
          
          loteDestinoActualizado = await tx.stockProductoTerminado.update({
            where: { id_stock: idLoteDestinoAfectado },
            data: { ubicacion: ubicacion_destino },
          });
          // Nota: No necesitamos restar del origen, porque es el mismo lote.
          // Salimos de esta lógica de "división".
        
        } else {
          // Es una división real: creamos un nuevo lote en el destino
          const nuevoLoteDestino = await tx.stockProductoTerminado.create({
            data: {
              id_aserradero: authPayload.aserraderoId,
              id_producto_catalogo: loteOrigen.id_producto_catalogo,
              id_orden_aserrado_origen: loteOrigen.id_orden_aserrado_origen,
              piezas_actuales: piezas_a_mover, // <-- La cantidad movida
              ubicacion: ubicacion_destino,   // <-- La nueva ubicación
              fecha_ingreso: loteOrigen.fecha_ingreso, // Mantiene la trazabilidad
            },
          });
          idLoteDestinoAfectado = nuevoLoteDestino.id_stock;
          loteDestinoActualizado = nuevoLoteDestino;
        }
      }

      // 4. Restar piezas del lote de origen (si no fue un movimiento completo)
      if (!esMovimientoCompleto) {
        await tx.stockProductoTerminado.update({
          where: { id_stock: id_stock_origen },
          data: {
            piezas_actuales: { decrement: piezas_a_mover },
          },
        });
      }

      // 5. Registrar el movimiento en el historial
      const movimiento = await tx.movimientoInventario.create({
        data: {
          id_aserradero: authPayload.aserraderoId,
          id_stock_afectado: idLoteDestinoAfectado, // Registramos contra el lote de destino
          id_responsable_usuario: authPayload.userId,
          fecha_movimiento: new Date().toISOString(),
          piezas_movidas: piezas_a_mover,
          ubicacion_origen: loteOrigen.ubicacion,
          ubicacion_destino: ubicacion_destino,
          id_nota_venta_salida: null,
        },
      });

      return {
        message: 'Movimiento realizado con éxito',
        loteDestino: loteDestinoActualizado,
        movimiento: movimiento,
      };
    });

    return NextResponse.json(resultado);

  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Lote de stock no encontrado' }, { status: 404 });
    }
    console.error("Error al mover el lote de stock:", error);
    return NextResponse.json({ message: error.message || 'Error al mover el lote' }, { status: 500 });
  }
}