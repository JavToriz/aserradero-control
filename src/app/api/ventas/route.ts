// app/api/ventas/route.ts
// Endpoint principal para crear la Nota de Venta y descontar inventario.

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';


// --- GET para listar el historial de ventas ---
export async function GET(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const ventas = await prisma.notaVenta.findMany({
      where: {
        id_aserradero: authPayload.aserraderoId,
      },
      include: {
        cliente: {
          select: { nombre_completo: true, domicilio_poblacion: true, rfc: true }
        },
        usuario: {
          select: { nombre_completo: true } // Quién la vendió
        },
        // Incluimos detalles para poder reconstruir la nota al imprimir
        detalles: {
          include: {
            producto: {
              include: {
                atributos_madera: true,
                atributos_triplay: true
              }
            }
          }
        },
        vehiculo: true // Datos del vehículo para la nota
      },
      orderBy: {
        fecha_salida: 'desc', // Las más recientes primero
      },
    });

    return NextResponse.json(ventas);

  } catch (error) {
    console.error("Error al obtener historial de ventas:", error);
    return NextResponse.json({ message: 'Error al obtener ventas' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId || !authPayload.userId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      id_cliente, 
      fecha_salida, // Viene como string YYYY-MM-DD
      tipo_pago, 
      productos_venta, // Array con la estructura de venta + origen del stock
      total_venta,
      id_vehiculo, // Opcional
      nombre_quien_expide // Texto libre para la firma
    } = body;

    // Validación básica
    if (!id_cliente || !productos_venta || productos_venta.length === 0) {
      return NextResponse.json({ message: 'Datos incompletos para la venta' }, { status: 400 });
    }

    // FIX FECHA: Ajuste de zona horaria
    const fechaISO = new Date(`${fecha_salida}T12:00:00Z`).toISOString();

    // INICIO DE LA TRANSACCIÓN
    const nuevaNota = await prisma.$transaction(async (tx) => {
      
      // 1. Crear la Nota de Venta (Cabecera)
      // Generamos un folio simple basado en timestamp o secuencia (aquí simulado)
      // Idealmente tendrías una tabla de Folios, pero usaremos el ID incremental.
      const nota = await tx.notaVenta.create({
        data: {
          id_aserradero: authPayload.aserraderoId,
          // Nota: id_turno es requerido en tu schema, aquí pongo null temporalmente 
          // si lo hiciste opcional, o deberías buscar el turno abierto. 
          // Asumiré que lo hiciste opcional como sugerí antes, o pon un ID dummy.
          id_turno: null, 
          folio_nota: "PENDIENTE", // Se actualizará con el ID
          fecha_salida: fechaISO,
          id_cliente: id_cliente,
          total_venta: total_venta,
          tipo_pago: tipo_pago,
          pagado: tipo_pago === 'Efectivo', // Si es efectivo, asume pagado (ajustar según lógica)
          id_usuario: authPayload.userId,
          id_vehiculo: id_vehiculo || null,
        },
      });

      // Actualizamos el folio con el ID generado para que sea único y consecutivo
      const folioGenerado = `NV-${nota.id_nota_venta.toString().padStart(5, '0')}`;
      await tx.notaVenta.update({
        where: { id_nota_venta: nota.id_nota_venta },
        data: { folio_nota: folioGenerado }
      });

      // 2. Procesar cada producto vendido
      for (const item of productos_venta) {
        // a) Crear el Detalle de Nota de Venta (Línea de la factura)
        await tx.detalleNotaVenta.create({
          data: {
            id_aserradero: authPayload.aserraderoId,
            id_nota_venta: nota.id_nota_venta,
            id_producto_catalogo: item.id_producto_catalogo,
            cantidad_piezas: item.cantidad_total,
            precio_unitario_venta: item.precio_unitario,
            importe_linea: item.importe,
          },
        });

        // b) Descontar Inventario (Lógica Multi-Ubicación)
        // 'item.origenes' es un array: [{ id_stock: 1, cantidad: 5 }, { id_stock: 2, cantidad: 5 }]
        for (const origen of item.origenes) {
          // Validar existencia y cantidad (opcional, pero recomendado)
          const stockLote = await tx.stockProductoTerminado.findUnique({
            where: { id_stock: origen.id_stock }
          });

          if (!stockLote || stockLote.piezas_actuales < origen.cantidad) {
            throw new Error(`Stock insuficiente en el lote ${origen.id_stock}`);
          }

          // Restar piezas
          await tx.stockProductoTerminado.update({
            where: { id_stock: origen.id_stock },
            data: { piezas_actuales: { decrement: origen.cantidad } }
          });

          // Registrar Movimiento
          await tx.movimientoInventario.create({
            data: {
              id_aserradero: authPayload.aserraderoId,
              id_stock_afectado: origen.id_stock,
              id_responsable_usuario: authPayload.userId,
              fecha_movimiento: new Date().toISOString(),
              piezas_movidas: -origen.cantidad, // Negativo porque es salida
              ubicacion_origen: stockLote.ubicacion,
              ubicacion_destino: null, // Sale del aserradero (Venta)
              id_nota_venta_salida: nota.id_nota_venta,
            }
          });
        }
      }

      return { ...nota, folio_nota: folioGenerado };
    });

    return NextResponse.json(nuevaNota, { status: 201 });

  } catch (error: any) {
    console.error("Error al crear la venta:", error);
    return NextResponse.json({ message: error.message || 'Error al procesar la venta' }, { status: 500 });
  }
}