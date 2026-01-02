// app/api/productos/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

// Definimos el tipo correcto para Next.js 15
type Params = Promise<{ id: string }>;

// GET: Obtener un solo producto por ID
export async function GET(
  req: Request, 
  { params }: { params: Params } // 1. Cambiamos el tipado aquí
) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    // 2. AWAIT a params antes de usarlo
    const { id } = await params; 
    const productId = parseInt(id, 10);

    const producto = await prisma.productoCatalogo.findFirst({
      where: {
        id_producto_catalogo: productId,
        id_aserradero: authPayload.aserraderoId,
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
export async function PUT(
  req: Request, 
  { params }: { params: Params } // 1. Tipado actualizado
) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    // 2. AWAIT a params
    const { id } = await params;
    const productId = parseInt(id, 10);
    
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
        atributos_madera: tipo_categoria === 'MADERA_ASERRADA' ? { update: atributos } : undefined,
        atributos_triplay: tipo_categoria === 'TRIPLAY_AGLOMERADO' ? { update: atributos } : undefined,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: "Producto no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE: Soft Delete
export async function DELETE(
  req: Request, 
  { params }: { params: Params } // 1. Tipado actualizado
) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    // EN LUGAR DE delete, USAMOS update
    const productoDesactivado = await prisma.productoCatalogo.update({
      where: {
        id_producto_catalogo_id_aserradero: {
            id_producto_catalogo: productId,
            id_aserradero: authPayload.aserraderoId
        }
      },
      data: {
        activo: false 
      }
    });

    return NextResponse.json(productoDesactivado);

  } catch (error: any) {
    if (error.code === 'P2025') {
       return NextResponse.json({ message: "Producto no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}