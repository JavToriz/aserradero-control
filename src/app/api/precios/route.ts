// app/api/precios/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

// GET: Listar todos los precios base
export async function GET(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const precios = await prisma.precioBaseMadera.findMany({
      where: { id_aserradero: authPayload.aserraderoId },
      orderBy: [{ especie: 'asc' }, { calidad: 'asc' }]
    });
    return NextResponse.json(precios);
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

// POST: Crear un nuevo Precio Base
export async function POST(req: Request) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    // --- CAMBIO AQUÍ: Recibimos también precio_mayoreo_por_pt ---
    const { especie, calidad, precio_por_pt, precio_mayoreo_por_pt } = await req.json();

    // Validar duplicados (la combinación Especie+Calidad debe ser única por aserradero)
    const existente = await prisma.precioBaseMadera.findFirst({
      where: {
        id_aserradero: authPayload.aserraderoId,
        especie: especie,
        calidad: calidad
      }
    });

    if (existente) {
      return NextResponse.json({ message: `Ya existe un precio para ${especie} - ${calidad}` }, { status: 409 });
    }

    const nuevoPrecio = await prisma.precioBaseMadera.create({
      data: {
        id_aserradero: authPayload.aserraderoId,
        especie,
        calidad,
        precio_por_pt: parseFloat(precio_por_pt),
        // --- CAMBIO AQUÍ: Guardamos el precio de mayoreo (opcional) ---
        // Si no viene, guardamos null o 0 según tu preferencia. Null es más limpio si no aplica.
        precio_mayoreo_por_pt: precio_mayoreo_por_pt ? parseFloat(precio_mayoreo_por_pt) : null
      }
    });

    return NextResponse.json(nuevoPrecio, { status: 201 });

  } catch (error) {
    console.error("Error creando precio:", error);
    return NextResponse.json({ message: 'Error al crear el precio' }, { status: 500 });
  }
}