import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload?.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const arrivos = await prisma.arrivoInventario.findMany({
      where: {
        id_aserradero: authPayload.aserraderoId,
        estado: "PENDIENTE",
      },
      include: {
        producto: {
            // Incluimos atributos y SKU para el filtro y la tabla
            include: { atributos_triplay: true }
        }
      },
      orderBy: { fecha_creacion: 'desc' }
    });

    const data = arrivos.map(a => ({
      ...a,
      producto: {
        nombre: a.producto.descripcion,
        sku: a.producto.sku,
        unidad_medida: a.producto.unidad_medida,
        atributos: a.producto.atributos_triplay // Pasamos los atributos
      }
    }));

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Error al cargar" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload?.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id_producto, cantidad, proveedor, fecha_estimada } = body;

    const arrivo = await prisma.arrivoInventario.create({
      data: {
        id_aserradero: authPayload.aserraderoId,
        id_producto_catalogo: Number(id_producto),
        cantidad_esperada: Number(cantidad),
        proveedor: proveedor,
        fecha_estimada_llegada: fecha_estimada ? new Date(fecha_estimada) : null,
        estado: "PENDIENTE"
      }
    });

    return NextResponse.json(arrivo);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}