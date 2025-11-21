// src/app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth'; // Reutilizamos nuestro helper

export async function GET(req: Request) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload) {
    return NextResponse.json({ message: 'Token inválido o expirado' }, { status: 401 });
  }

  try {
    const userId = authPayload.userId;

    // Buscamos las asignaciones del usuario en la tabla intermedia
    const asignaciones = await prisma.usuarioAserradero.findMany({
      where: { id_usuario: userId },
      include: {
        // Incluimos los datos completos de cada aserradero asignado
        aserradero: true,
      },
    });
    
    // Devolvemos solo la lista de aserraderos
    const aserraderos = asignaciones.map(a => a.aserradero);

    if (aserraderos.length === 0) {
        return NextResponse.json({ message: 'El usuario no tiene aserraderos asignados.' }, { status: 403 });
    }

    return NextResponse.json({ aserraderos });

  } catch (error) {
    console.error("Error al obtener sesión:", error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}