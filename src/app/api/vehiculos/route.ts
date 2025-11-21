// app/api/vehiculos/route.ts
// Endpoint para buscar vehículos (por matrícula) y crear nuevos.

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

/**
 * GET: Buscar vehículos para autocompletado.
 * Busca por matrícula (placas) dentro del aserradero actual.
 * Query Params: ?query=ABC-123
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
    whereClause.matricula = { contains: query, mode: 'insensitive' };
  }

  try {
    const vehiculos = await prisma.vehiculo.findMany({
      where: whereClause,
      take: 10,
    });
    return NextResponse.json(vehiculos);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al buscar vehículos' }, { status: 500 });
  }
}

/**
 * POST: Crear un nuevo vehículo
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

    const nuevoVehiculo = await prisma.vehiculo.create({
      data,
    });

    return NextResponse.json(nuevoVehiculo, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: `Error: La matrícula ya existe en este aserradero.` }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ message: 'Error al crear el vehículo' }, { status: 500 });
  }
}