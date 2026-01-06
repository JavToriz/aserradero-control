// src/app/api/inventario/ajuste-patio/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tipo_balance, tipo_ajuste, volumen, observaciones } = body;

    // Validaciones
    if (!volumen || isNaN(parseFloat(volumen))) {
      return NextResponse.json({ message: 'El volumen es inválido' }, { status: 400 });
    }
    if (!['FISICO', 'DOCUMENTADO'].includes(tipo_balance)) {
      return NextResponse.json({ message: 'Tipo de balance inválido' }, { status: 400 });
    }

    const nuevoAjuste = await prisma.ajustePatio.create({
      data: {
        id_aserradero: authPayload.aserraderoId,
        id_usuario: authPayload.userId, // El usuario logueado
        tipo_balance,
        tipo_ajuste,
        volumen: parseFloat(volumen),
        observaciones: observaciones || ''
      }
    });

    return NextResponse.json(nuevoAjuste, { status: 201 });

  } catch (error) {
    console.error("Error creando ajuste de patio:", error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}