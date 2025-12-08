// app/api/ordenes-aserrado/route.ts
// Endpoint para Formulario 7.1: "Registrar Entrada a Aserrado"
// Esto representa el "Consumo" de materia prima (m³ en rollo).

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

/**
 * GET: Obtener todas las órdenes de aserrado (consumos)
 * Útil para listarlas y que el Form 7.2 pueda seleccionarlas.
 */
export async function GET(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const ordenes = await prisma.ordenAserrado.findMany({
      where: {
        id_aserradero: authPayload.aserraderoId,
      },
      include: {
        responsable: { select: { nombre_completo: true } },
      },
      orderBy: {
        fecha_aserrado: 'desc',
      },
    });
    return NextResponse.json(ordenes);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener órdenes de aserrado' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId || !authPayload.userId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { fecha_aserrado, especie, total_m3_rollo_consumido, observaciones } = body;

    if (!fecha_aserrado || !especie || !total_m3_rollo_consumido) {
      return NextResponse.json({ message: 'Fecha, especie y m³ son requeridos' }, { status: 400 });
    }

    // FIX FECHA: Agregamos T12:00:00Z para fijar la fecha a mediodía UTC
    // Esto evita que la conversión de zona horaria la mueva al día anterior
    const fechaISO = new Date(`${fecha_aserrado}T12:00:00Z`).toISOString();

    const nuevaOrden = await prisma.ordenAserrado.create({
      data: {
        id_aserradero: authPayload.aserraderoId,
        id_responsable_usuario: authPayload.userId,
        fecha_aserrado: fechaISO,
        especie: especie,
        total_m3_rollo_consumido: total_m3_rollo_consumido,
        observaciones: observaciones || null,
      },
    });

    return NextResponse.json(nuevaOrden, { status: 201 });
  } catch (error) {
    console.error("Error al crear la orden de aserrado:", error);
    return NextResponse.json({ message: 'Error al crear la orden de aserrado' }, { status: 500 });
  }
}