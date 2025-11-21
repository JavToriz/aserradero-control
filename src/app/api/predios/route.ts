// app/api/predios/route.ts
// Endpoint para buscar predios (por nombre o clave RFN) y crear nuevos.

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

/**
 * GET: Buscar predios para autocompletado.
 * Busca por nombre o clave RFN.
 * Query Params: ?query=Ejido
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
      { nombre_predio: { contains: query, mode: 'insensitive' } },
      { clave_rfn: { contains: query, mode: 'insensitive' } },
    ];
  }

  try {
    const predios = await prisma.predio.findMany({
      where: whereClause,
      take: 10,
    });
    return NextResponse.json(predios);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al buscar predios' }, { status: 500 });
  }
}

/**
 * POST: Crear un nuevo predio
 */
export async function POST(req: Request) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = {
      ...body,
      id_aserradero: authPayload.aserraderoId,
    };
    
    // Omitir clave única si está vacía
    if (data.clave_rfn === '') delete data.clave_rfn;

    const nuevoPredio = await prisma.predio.create({
      data,
    });

    return NextResponse.json(nuevoPredio, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: `Error: La clave RFN ya existe en este aserradero.` }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ message: 'Error al crear el predio' }, { status: 500 });
  }
}