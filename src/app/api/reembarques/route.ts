// src/app/api/reembarques/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  // --- CORRECCIÓN: Leer el parámetro de búsqueda 'q' ---
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';

  try {
    const reembarques = await prisma.reembarque.findMany({
      where: {
        id_aserradero: authPayload.aserraderoId,
        // Si hay query, filtramos por folio
        ...(query ? {
          folio_progresivo: {
            contains: query,
            mode: 'insensitive' // Búsqueda sin distinguir mayúsculas
          }
        } : {})
      },
      include: {
        destinatario: { select: { nombre_completo: true } },
        remitente: { select: { nombre_completo: true } },
        vehiculo: { select: { matricula: true, marca: true } },
      },
      orderBy: {
        fecha_emision: 'desc',
      },
      take: 20 // Limitar resultados para no saturar el select
    });
    return NextResponse.json(reembarques);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener reembarques' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      folio_progresivo,
      folio_autorizado,
      fecha_emision,
      id_remitente,
      id_destinatario,
      id_vehiculo,
      id_chofer,
      descripcion_producto_reembarque,
      genero_madera,
      cantidad_amparada,
      saldo_disponible_anterior,
      saldo_restante,
      volumen_total_m3,
      id_documento_origen,
      tipo_documento_origen
    } = body;

    // Validación básica
    if (!folio_progresivo || !fecha_emision) {
      return NextResponse.json({ message: 'Folio y fecha son requeridos' }, { status: 400 });
    }

    const fechaISO = new Date(fecha_emision).toISOString();

    const nuevoReembarque = await prisma.reembarque.create({
      data: {
        id_aserradero: authPayload.aserraderoId,
        folio_progresivo,
        folio_autorizado,
        fecha_emision: fechaISO,
        id_remitente: id_remitente ? parseInt(id_remitente) : null,
        id_destinatario: id_destinatario ? parseInt(id_destinatario) : null,
        id_vehiculo: id_vehiculo ? parseInt(id_vehiculo) : null,
        id_chofer: id_chofer ? parseInt(id_chofer) : null,
        descripcion_producto_reembarque,
        genero_madera,
        cantidad_amparada: parseFloat(cantidad_amparada || 0),
        saldo_disponible_anterior: parseFloat(saldo_disponible_anterior || 0),
        saldo_restante: parseFloat(saldo_restante || 0),
        volumen_total_m3: parseFloat(volumen_total_m3 || 0),
        id_documento_origen: id_documento_origen ? parseInt(id_documento_origen) : null,
        tipo_documento_origen: tipo_documento_origen || null,
      },
    });

    return NextResponse.json(nuevoReembarque, { status: 201 });

  } catch (error: any) {
    if (error.code === 'P2002') {
       return NextResponse.json({ message: `El folio progresivo ya existe.` }, { status: 409 });
    }
    console.error("Error al crear reembarque:", error);
    return NextResponse.json({ message: 'Error al crear el reembarque' }, { status: 500 });
  }
}