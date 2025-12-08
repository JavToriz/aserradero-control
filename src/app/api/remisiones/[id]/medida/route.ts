// app/api/remisiones/[id]/medida/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

interface Params {
  params: Promise<{ id: string }>;
}

// PUT: Actualizar solo la medida real recibida en patio
export async function PUT(req: NextRequest, { params }: Params) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const id_remision = parseInt(id, 10);
    const body = await req.json();
    const { m3_recibidos_aserradero } = body;

    // Validación
    if (m3_recibidos_aserradero === undefined || m3_recibidos_aserradero < 0) {
      return NextResponse.json({ message: 'La medida debe ser un número válido' }, { status: 400 });
    }

    const remisionActualizada = await prisma.remision.update({
      where: {
        id_remision: id_remision,
        id_aserradero: authPayload.aserraderoId,
      },
      data: {
        m3_recibidos_aserradero: parseFloat(m3_recibidos_aserradero),
      },
    });

    return NextResponse.json(remisionActualizada);

  } catch (error) {
    console.error("Error al actualizar medida:", error);
    return NextResponse.json({ message: 'Error al actualizar la medida' }, { status: 500 });
  }
}