import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// -----------------------------------------------------------------------------
// DELETE - Cancelar Venta (Revertir Stock y Caja)
// -----------------------------------------------------------------------------
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authPayload = await getAuthPayload(req);

  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const id_nota_venta = parseInt(id);

  try {
    // 1. Obtener la venta para validaciones
    const venta = await prisma.notaVenta.findUnique({
      where: { id_nota_venta },
      include: { detalles: true },
    });

    if (!venta) {
      return NextResponse.json({ message: 'Venta no encontrada' }, { status: 404 });
    }

    if (venta.id_aserradero !== authPayload.aserraderoId) {
      return NextResponse.json({ message: 'Acceso denegado a esta venta' }, { status: 403 });
    }

    // 2. Ejecutar la reversión en una transacción
    await prisma.$transaction(async (tx) => {
      
      // A) REVERTIR INVENTARIO
      // Buscamos los movimientos originales de salida de esta venta
      const movimientosSalida = await tx.movimientoInventario.findMany({
        where: { id_nota_venta_salida: id_nota_venta },
      });

      for (const mov of movimientosSalida) {
        if (mov.id_stock_afectado) {
            // 1. Devolver stock al lote original
            await tx.stockProductoTerminado.update({
              where: { id_stock: mov.id_stock_afectado },
              data: {
                piezas_actuales: {
                  increment: Math.abs(mov.piezas_movidas), // Sumamos lo que se restó
                },
              },
            });

            // 2. Registrar movimiento de reversión en el historial
            // IMPORTANTE: Usamos solo campos que existen en tu Schema (sin 'descripcion' ni 'tipo_movimiento')
            await tx.movimientoInventario.create({
              data: {
                id_aserradero: authPayload.aserraderoId!,
                id_stock_afectado: mov.id_stock_afectado,
                id_responsable_usuario: authPayload.userId!,
                fecha_movimiento: new Date(),
                piezas_movidas: Math.abs(mov.piezas_movidas), // Positivo = Entrada (Regreso)
                ubicacion_origen: null, // Viene "de fuera"
                ubicacion_destino: mov.ubicacion_origen, // Vuelve a su origen físico
                id_nota_venta_salida: null // No lo vinculamos porque la nota se va a borrar
              },
            });
        }
      }

      // B) ELIMINAR REGISTROS DE VENTA
      // Eliminar detalles primero (por llave foránea)
      await tx.detalleNotaVenta.deleteMany({
        where: { id_nota_venta },
      });

      // Eliminar la nota de venta
      await tx.notaVenta.delete({
        where: { id_nota_venta },
      });

      // C) REVERTIR DINERO (Solo si fue Efectivo y Pagado)
      if (venta.tipo_pago === 'Efectivo' && venta.pagado) {
        // Buscamos el turno activo directamente con 'tx' para evitar bloqueos
        const turnoActivo = await tx.turnoCaja.findFirst({
            where: { 
                id_aserradero: authPayload.aserraderoId,
                fecha_cierre: null 
            },
            orderBy: { fecha_apertura: 'desc' }
        });

        // Si hay turno abierto, registramos la salida del dinero
        if (turnoActivo) {
            await tx.movimientoCaja.create({
                data: {
                    id_turno: turnoActivo.id_turno,
                    tipo_movimiento: 'EGRESO_CANCELACION', // String descriptivo para tu reporte
                    monto: venta.total_venta, // Guardamos el monto
                    descripcion: `Cancelación Venta Folio: ${venta.folio_nota}`,
                    fecha_movimiento: new Date()
                }
            });
        }
        // Nota: Si no hay turno abierto, se asume que no se puede sacar el dinero del sistema "formalmente" 
        // o queda pendiente. Para no bloquear la cancelación, permitimos continuar.
      }

    }, {
      maxWait: 5000, // Espera máxima para iniciar
      timeout: 20000, // Tiempo máximo de ejecución
    });

    return NextResponse.json({ message: 'Venta cancelada correctamente' });

  } catch (error: any) {
    console.error('SERVER ERROR cancelling sale:', error); // Busca esto en tu terminal si falla
    return NextResponse.json(
      { message: error.message || 'Error interno al cancelar' },
      { status: 500 }
    );
  }
}

// -----------------------------------------------------------------------------
// PATCH - Editar Datos Generales
// -----------------------------------------------------------------------------
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const authPayload = await getAuthPayload(req);
    
    if (!authPayload) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    try {
        const body = await req.json();
        const { id_cliente, fecha_salida, id_vehiculo } = body;

        const updated = await prisma.notaVenta.update({
            where: { id_nota_venta: parseInt(id) },
            data: {
                id_cliente: id_cliente ? parseInt(id_cliente) : undefined,
                id_vehiculo: id_vehiculo ? parseInt(id_vehiculo) : undefined,
                fecha_salida: fecha_salida ? new Date(fecha_salida).toISOString() : undefined
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error update:", error);
        return NextResponse.json({ message: 'Error al editar venta' }, { status: 500 });
    }
}