//app/api/gastos/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

interface Params {
  params: Promise<{ id: string }>; // Soporte para Next.js 15
}

// PUT: Actualizar un gasto existente (ej. cambiar estado de pago)
export async function PUT(req: NextRequest, { params }: Params) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const id_gasto = parseInt(id, 10);
    const body = await req.json();
    
    // Extraemos los campos que permitimos actualizar
    const { estado_pago } = body;

    // Validación básica
    if (!estado_pago) {
      return NextResponse.json({ message: 'Faltan datos para actualizar' }, { status: 400 });
    }

    const gastoActualizado = await prisma.reciboGasto.update({
      where: {
        id_recibo_gasto: id_gasto,
        id_aserradero: authPayload.aserraderoId, // Seguridad: asegurar que pertenece al aserradero
      },
      data: {
        estado_pago: estado_pago,
      },
    });

    return NextResponse.json(gastoActualizado);

  } catch (error: any) {
    // Si el registro no existe
    if (error.code === 'P2025') {
        return NextResponse.json({ message: 'Gasto no encontrado' }, { status: 404 });
    }
    console.error("Error al actualizar gasto:", error);
    return NextResponse.json({ message: 'Error al actualizar el gasto' }, { status: 500 });
  }
}