// app/api/personas/route.ts
// Endpoint para buscar personas (para autocompletado) y crear nuevas.

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

/**
 * GET: Buscar personas para autocompletado.
 * Busca por nombre o RFC dentro del aserradero actual.
 * Query Params: ?query=Juan
 */
export async function GET(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const query = searchParams.get('query');

  const whereClause: any = {
    id_aserradero: authPayload.aserraderoId,
  };

  if (query) {
    whereClause.OR = [
      { nombre_completo: { contains: query, mode: 'insensitive' } },
      { rfc: { contains: query, mode: 'insensitive' } },
    ];
  }

  try {
    const personas = await prisma.persona.findMany({
      where: whereClause,
      take: 10, // Limitamos a 10 resultados para el autocompletado
    });
    return NextResponse.json(personas);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al buscar personas' }, { status: 500 });
  }
}

/**
 * POST: Crear una nueva persona (Cliente, Titular, Chofer, etc.)
 * Se usa desde el modal "+ Añadir Nuevo Titular"
 */
export async function POST(req: Request) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Inyectamos el ID del aserradero a los datos
    const data = {
      ...body,
      id_aserradero: authPayload.aserraderoId,
    };

    // Omitir campos únicos si están vacíos (RFC, CURP)
    if (data.rfc === '') delete data.rfc;
    if (data.curp === '') delete data.curp;

    const nuevaPersona = await prisma.persona.create({
      data,
    });

    return NextResponse.json(nuevaPersona, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') { // Error de constraint único
      return NextResponse.json({ message: `Error: El RFC o CURP ya existe en este aserradero.` }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ message: 'Error al crear la persona' }, { status: 500 });
  }
}
