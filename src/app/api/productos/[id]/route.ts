// src/app/api/productos/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

type Params = Promise<{ id: string }>;

export async function GET(
  req: Request, 
  { params }: { params: Params } 
) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
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

export async function PUT(
  req: Request, 
  { params }: { params: Params } 
) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    
    const body = await req.json();
    const { tipo_categoria, atributos, codigo_barras, clave_sat, ...productData } = body;

    if (codigo_barras && codigo_barras.trim() !== '') {
        const existingBarcode = await prisma.productoCatalogo.findFirst({
            where: {
                codigo_barras: codigo_barras.trim(),
                id_aserradero: authPayload.aserraderoId,
                id_producto_catalogo: {
                    not: productId 
                }
            }
        });

        if (existingBarcode) {
            return NextResponse.json(
                { message: `El código de barras "${codigo_barras}" ya está registrado en otro producto.` },
                { status: 409 }
            );
        }
    }

    const updatedProduct = await prisma.productoCatalogo.update({
      where: {
        id_producto_catalogo_id_aserradero: {
            id_producto_catalogo: productId,
            id_aserradero: authPayload.aserraderoId
        }
      },
      data: {
        ...productData,
        codigo_barras: codigo_barras?.trim() || null, 
        clave_sat: clave_sat?.trim() || null,
        // 👇 SOLUCIÓN: Usamos UPSERT para que funcione con los productos importados del CSV
        atributos_madera: tipo_categoria === 'MADERA_ASERRADA' ? { 
            upsert: {
                create: atributos,
                update: atributos
            }
        } : undefined,
        atributos_triplay: tipo_categoria === 'TRIPLAY_AGLOMERADO' ? { 
            upsert: {
                create: atributos,
                update: atributos
            }
        } : undefined,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error("Error en PUT Producto:", error); // <-- Para ver el error real en la terminal si algo más falla
    if (error.code === 'P2025') {
      return NextResponse.json({ message: "Producto no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request, 
  { params }: { params: Params } 
) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

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