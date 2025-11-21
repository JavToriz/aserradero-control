// app/api/productos/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

interface Params {
  params: { id: string };
}

// GET: Obtener un solo producto por ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const productId = parseInt(params.id, 10);
    const producto = await prisma.productoCatalogo.findFirst({
      where: {
        id_producto_catalogo: productId,
        id_aserradero: authPayload.aserraderoId, // <-- solo busca en el aserradero del usuario
      },
      include: {
        atributos_madera: true,
        atributos_triplay: true,
      }
    });

    if (!producto) {
      return NextResponse.json({ message: 'Producto no encontrado' }, { status: 404 });
    }
    return NextResponse.json(producto);
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT: Actualizar un producto
export async function PUT(req: Request, { params }: { params: { id: string } } ) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const productId = parseInt(params.id, 10);
    const body = await req.json();
    const { tipo_categoria, atributos, ...productData } = body;


    const updatedProduct = await prisma.productoCatalogo.update({
      where: {
        id_producto_catalogo_id_aserradero: {
            id_producto_catalogo: productId,
            id_aserradero: authPayload.aserraderoId
        }
      },
      data: {
        ...productData,
        // Actualiza los atributos anidados dependiendo de la categoría
        atributos_madera: tipo_categoria === 'MADERA_ASERRADA' ? { update: atributos } : undefined,
        atributos_triplay: tipo_categoria === 'TRIPLAY_AGLOMERADO' ? { update: atributos } : undefined,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    if (error.code === 'P2025') { // Si no encuentra el registro que cumpla la condición
      return NextResponse.json({ message: "Producto no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE: Eliminar un producto
export async function DELETE(req: Request, { params }: Params) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const productId = parseInt(params.id, 10);
    await prisma.productoCatalogo.delete({
      where: {
        id_producto_catalogo_id_aserradero: {
            id_producto_catalogo: productId,
            id_aserradero: authPayload.aserraderoId
        }
      },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.code === 'P2025') {
        return NextResponse.json({ message: "Producto no encontrado en este aserradero" }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}