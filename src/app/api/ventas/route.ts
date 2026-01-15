import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';
import { CajaService } from '@/lib/caja-service';

// -----------------------------------------------------------------------------
// GET - Obtener historial de ventas
// -----------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const authPayload = await getAuthPayload(req);

  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json(
      { message: 'No autorizado' },
      { status: 401 }
    );
  }

  try {
    const ventas = await prisma.notaVenta.findMany({
      where: {
        id_aserradero: authPayload.aserraderoId,
      },
      include: {
        cliente: {
          select: {
            nombre_completo: true,
            domicilio_poblacion: true,
            rfc: true,
          },
        },
        usuario: {
          select: {
            nombre_completo: true,
          },
        },
        detalles: {
          include: {
            producto: {
              include: {
                atributos_madera: true,
                atributos_triplay: true,
              },
            },
          },
        },
        vehiculo: true,
      },
      orderBy: {
        folio_nota: 'desc',
      },
    });

    return NextResponse.json(ventas);
  } catch (error) {
    console.error('Error al obtener historial de ventas:', error);
    return NextResponse.json(
      { message: 'Error al obtener ventas' },
      { status: 500 }
    );
  }
}

// -----------------------------------------------------------------------------
// POST - Crear venta (con lógica de caja)
// -----------------------------------------------------------------------------

export async function POST(req: Request) {
  const authPayload = await getAuthPayload(req);

  if (!authPayload || !authPayload.aserraderoId || !authPayload.userId) {
    return NextResponse.json(
      { message: 'No autorizado' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    const {
      id_cliente,
      fecha_salida,
      tipo_pago,
      cuenta_destino,
      id_reembarque,
      productos_venta,
      total_venta,
      id_vehiculo,
      // nombre_quien_expide, // No se usa en la lógica actual, pero viene del body
    } = body;

    if (!id_cliente || !productos_venta || productos_venta.length === 0) {
      return NextResponse.json(
        { message: 'Datos incompletos para la venta' },
        { status: 400 }
      );
    }

    const fechaISO = new Date(`${fecha_salida}T12:00:00Z`).toISOString();
    const id_aserradero = authPayload.aserraderoId;

    // -------------------------------------------------------------------------
    // Lógica de caja - Validar turno activo
    // -------------------------------------------------------------------------

    let idTurnoActivo: number | null = null;

    const turno = await CajaService.getTurnoActivo(id_aserradero);

    if (turno) {
      idTurnoActivo = turno.id_turno;
    }

    if (tipo_pago === 'Efectivo' && !turno) {
      return NextResponse.json(
        {
          message:
            'LA CAJA ESTÁ CERRADA. Debes abrir un turno para cobrar en efectivo.',
        },
        { status: 409 }
      );
    }

    const esVentaPagada = tipo_pago !== 'Crédito';

    // -------------------------------------------------------------------------
    // Transacción
    // -------------------------------------------------------------------------

    const nuevaNota = await prisma.$transaction(
      async (tx) => {
        // 1. Crear la cabecera de la nota
        const nota = await tx.notaVenta.create({
          data: {
            id_aserradero,
            id_turno: idTurnoActivo,
            folio_nota: 'PENDIENTE',
            fecha_salida: fechaISO,
            id_cliente,
            total_venta,
            tipo_pago,
            cuenta_destino_transferencia:
              tipo_pago === 'Transferencia' ? cuenta_destino : null,
            id_reembarque_asociado: id_reembarque
              ? parseInt(id_reembarque)
              : null,
            pagado: esVentaPagada,
            id_usuario: authPayload.userId,
            id_vehiculo: id_vehiculo || null,
          },
        });

        // 2. Generar Folio
        const folioGenerado = `NV-${nota.id_nota_venta
          .toString()
          .padStart(5, '0')}`;

        await tx.notaVenta.update({
          where: { id_nota_venta: nota.id_nota_venta },
          data: { folio_nota: folioGenerado },
        });

        // 3. Procesar Productos y Movimientos de Inventario
        for (const item of productos_venta) {
          // Crear detalle de venta
          await tx.detalleNotaVenta.create({
            data: {
              id_aserradero,
              id_nota_venta: nota.id_nota_venta,
              id_producto_catalogo: item.id_producto_catalogo,
              cantidad_piezas: item.cantidad_total,
              precio_unitario_venta: item.precio_unitario,
              importe_linea: item.importe,
            },
          });

          // Descontar de cada lote (origen)
          for (const origen of item.origenes) {
            const stockLote = await tx.stockProductoTerminado.findUnique({
              where: { id_stock: origen.id_stock },
            });

            if (
              !stockLote ||
              stockLote.piezas_actuales < origen.cantidad
            ) {
              throw new Error(
                `Stock insuficiente en el lote ${origen.id_stock}. Disponibles: ${stockLote?.piezas_actuales}, Solicitadas: ${origen.cantidad}`
              );
            }

            // Actualizar stock
            await tx.stockProductoTerminado.update({
              where: { id_stock: origen.id_stock },
              data: {
                piezas_actuales: {
                  decrement: origen.cantidad,
                },
              },
            });

            // Registrar movimiento histórico
            await tx.movimientoInventario.create({
              data: {
                id_aserradero,
                id_stock_afectado: origen.id_stock,
                id_responsable_usuario: authPayload.userId,
                fecha_movimiento: new Date().toISOString(),
                piezas_movidas: -origen.cantidad, // Negativo porque es salida
                ubicacion_origen: stockLote.ubicacion,
                ubicacion_destino: null,
                id_nota_venta_salida: nota.id_nota_venta,
              },
            });
          }
        }

        return {
          ...nota,
          folio_nota: folioGenerado,
        };
      },
      {
        // CONFIGURACIÓN DE TIMEOUT
        maxWait: 5000, // Tiempo máximo esperando a que se abra la transacción
        timeout: 20000, // Tiempo máximo de ejecución (20s) para evitar el error de 5s
      }
    );

    // -------------------------------------------------------------------------
    // Registrar ingreso en caja (Fuera de la transacción principal de BD para evitar bloqueos extra)
    // -------------------------------------------------------------------------

    if (tipo_pago === 'Efectivo') {
      await CajaService.registrarMovimientoEfectivo({
        id_aserradero,
        monto: total_venta,
        tipo: 'INGRESO_VENTA',
        descripcion: `Venta Nota #${nuevaNota.folio_nota}`,
        id_nota_venta: nuevaNota.id_nota_venta,
      });
    }

    return NextResponse.json(nuevaNota, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear la venta:', error);
    return NextResponse.json(
      { message: error.message || 'Error al procesar la venta' },
      { status: 500 }
    );
  }
}