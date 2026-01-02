// app/api/precios/calcular/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';
import { calcularPrecioPorAtributos } from '@/lib/pricing-engine';

export async function POST(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { genero, clasificacion, grosor, ancho, largo } = body;

    // Buscar precio base
    const precioBase = await prisma.precioBaseMadera.findFirst({
      where: {
        id_aserradero: authPayload.aserraderoId,
        // Búsqueda flexible (contiene) o exacta según tu preferencia
        especie: { equals: genero, mode: 'insensitive' },
        calidad: { contains: clasificacion, mode: 'insensitive' }
      }
    });

    if (!precioBase) {
      return NextResponse.json({ 
        precio_venta: 0, 
        precio_mayoreo: 0,
        found: false 
      });
    }

    const resultado = calcularPrecioPorAtributos(
      {
        grosor_pulgadas: Number(grosor),
        ancho_pulgadas: Number(ancho),
        largo_pies: Number(largo)
      },
      Number(precioBase.precio_por_pt),
      Number(precioBase.precio_mayoreo_por_pt || 0)
    );

    return NextResponse.json({
      precio_venta: resultado.precioSugerido,
      precio_mayoreo: resultado.precioMayoreoSugerido,
      found: true
    });

  } catch (error) {
    console.error("Error calculando:", error);
    return NextResponse.json({ message: 'Error de cálculo' }, { status: 500 });
  }
}