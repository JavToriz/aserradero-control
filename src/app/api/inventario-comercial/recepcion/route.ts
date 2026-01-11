import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id_arrivo, cantidad, ubicacion } = body;
    const cantidadNum = Number(cantidad);

    const mapUbicacion: Record<string, "BODEGA" | "PRODUCCION" | "SECADO" | "ANAQUELES" | "VENTA"> = {
      "3": "BODEGA", "4": "ANAQUELES", "5": "VENTA"
    };
    const ubicacionEnum = mapUbicacion[String(ubicacion)] || "BODEGA";

    await prisma.$transaction(async (tx) => {
      // 1. Validar Arrivo
      const arrivo = await tx.arrivoInventario.findUniqueOrThrow({
        where: { id_arrivo: Number(id_arrivo) }
      });

      if (arrivo.id_aserradero !== authPayload.aserraderoId) {
        throw new Error("No autorizado");
      }

      // 2. Buscar Stock Existente para unificar
      const stockExistente = await tx.stockProductoTerminado.findFirst({
        where: {
            id_aserradero: authPayload.aserraderoId,
            id_producto_catalogo: arrivo.id_producto_catalogo,
            ubicacion: ubicacionEnum,
            id_orden_aserrado_origen: null 
        }
      });

      if (stockExistente) {
         // A) SUMAR al existente
         await tx.stockProductoTerminado.update({
            where: { id_stock: stockExistente.id_stock },
            data: {
                piezas_actuales: { increment: cantidadNum },
                fecha_ingreso: new Date()
            }
         });
      } else {
         // B) CREAR nuevo
         await tx.stockProductoTerminado.create({
            data: {
              id_aserradero: authPayload.aserraderoId,
              id_producto_catalogo: arrivo.id_producto_catalogo,
              piezas_actuales: cantidadNum,
              ubicacion: ubicacionEnum,
              fecha_ingreso: new Date(),
            }
         });
      }

      // 3. Cerrar el Arrivo
      await tx.arrivoInventario.update({
        where: { id_arrivo: Number(id_arrivo) },
        data: {
          estado: "RECIBIDO",
          fecha_recepcion: new Date(),
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en recepción:", error);
    return NextResponse.json({ error: "Error al procesar recepción" }, { status: 500 });
  }
}