import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload?.aserraderoId) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  try {
    const stock = await prisma.stockProductoTerminado.findMany({
      where: {
        id_aserradero: authPayload.aserraderoId,
        piezas_actuales: { gt: 0 },
        producto: { tipo_categoria: "TRIPLAY_AGLOMERADO" }
      },
      include: { 
        producto: {
            include: { atributos_triplay: true } // <--- ESTO ES LA CLAVE
        }
      }
    });

    const data = stock.map(s => ({
      id_stock: s.id_stock,
      cantidad: Number(s.piezas_actuales),
      ubicacion: s.ubicacion,
      producto: {
        nombre: s.producto.descripcion,
        sku: s.producto.sku,
        unidad_medida: s.producto.unidad_medida,
        precio_venta: Number(s.producto.precio_venta),
        // Pasamos los atributos al frontend
        atributos: s.producto.atributos_triplay 
      }
    }));

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Error al cargar stock" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload?.aserraderoId) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const { id_producto, cantidad, ubicacion } = body;
    const cantidadNum = Number(cantidad);

    const mapUbicacion: Record<string, "BODEGA" | "PRODUCCION" | "SECADO" | "ANAQUELES" | "VENTA"> = {
      "3": "BODEGA", "4": "ANAQUELES", "5": "VENTA"
    };
    
    const ubicacionEnum = mapUbicacion[String(ubicacion)] || "BODEGA";

    // 1. Buscamos si ya existe registro de este producto en esta ubicación
    const stockExistente = await prisma.stockProductoTerminado.findFirst({
        where: {
            id_aserradero: authPayload.aserraderoId,
            id_producto_catalogo: Number(id_producto),
            ubicacion: ubicacionEnum,
            // Importante: Aseguramos que sea un stock "genérico" sin orden de origen
            // para no mezclar con lotes de producción si los hubiera.
            id_orden_aserrado_origen: null 
        }
    });

    if (stockExistente) {
        // A) SI EXISTE: Actualizamos sumando la cantidad
        await prisma.stockProductoTerminado.update({
            where: { id_stock: stockExistente.id_stock },
            data: {
                piezas_actuales: { increment: cantidadNum },
                // Opcional: Actualizamos la fecha para saber que hubo movimiento reciente
                fecha_ingreso: new Date() 
            }
        });
        return NextResponse.json({ message: "Stock actualizado correctamente" });
    } else {
        // B) NO EXISTE: Creamos uno nuevo
        const stock = await prisma.stockProductoTerminado.create({
            data: {
                id_aserradero: authPayload.aserraderoId,
                id_producto_catalogo: Number(id_producto),
                piezas_actuales: cantidadNum,
                ubicacion: ubicacionEnum,
                fecha_ingreso: new Date(),
            }
        });
        return NextResponse.json(stock);
    }

  } catch (error) {
    console.error("Error en stock:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}