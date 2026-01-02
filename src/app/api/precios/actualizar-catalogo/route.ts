// app/api/precios/actualizar-catalogo/route.ts
// este endpoint es para configurar los precios por pie de cada tipo y calidad de madera

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
    const { especie, calidad } = await req.json(); // Ej: "Pino", "Primera"

    // 1. Obtener el nuevo precio base
    const precioBase = await prisma.precioBaseMadera.findFirst({
      where: {
        id_aserradero: authPayload.aserraderoId,
        especie: especie,
        calidad: calidad
      }
    });

    if (!precioBase) {
      return NextResponse.json({ message: 'No existe precio base para esta combinación' }, { status: 404 });
    }

    // 2. Buscar productos afectados
    // Deben ser de esa especie/calidad (buscando en atributos) Y tener bandera automática
    const productosAfectados = await prisma.productoCatalogo.findMany({
      where: {
        id_aserradero: authPayload.aserraderoId,
        es_precio_automatico: true,
        atributos_madera: {
          // Asumiendo que tu tabla de atributos tiene estos campos como Strings o Enums
          // Ajusta los nombres de campos según tu schema real
          genero: { equals: especie, mode: 'insensitive' }, 
          clasificacion: { equals: calidad, mode: 'insensitive' }
        }
      },
      include: {
        atributos_madera: true
      }
    });

    let actualizados = 0;

    // 3. Recalcular y actualizar uno por uno (o en transacción masiva si son muchos)
    const updatePromises = productosAfectados.map(async (prod) => {
      if (!prod.atributos_madera) return;

      const resultado = calcularPrecioPorAtributos(
        {
          grosor_pulgadas: Number(prod.atributos_madera.grosor_pulgadas),
          ancho_pulgadas: Number(prod.atributos_madera.ancho_pulgadas),
          largo_pies: Number(prod.atributos_madera.largo_pies) 
        },
        Number(precioBase.precio_por_pt),        // Base Menudeo
        Number(precioBase.precio_mayoreo_por_pt) // Base Mayoreo
      );

      if (resultado.precioSugerido > 0) {
        return prisma.productoCatalogo.update({
          where: { id_producto_catalogo: prod.id_producto_catalogo },
          data: { 
            precio_venta: resultado.precioSugerido,
            precio_mayoreo: resultado.precioMayoreoSugerido // Guardamos el segundo precio
          }
        });
      }
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ 
      message: 'Precios actualizados correctamente', 
      productos_actualizados: updatePromises.length 
    });

  } catch (error) {
    console.error("Error actualizando precios:", error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}