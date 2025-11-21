// src/app/api/productos/[id]/ajuste/route.ts
// Endpoint para ajustar el stock de un producto y ver el historial de ajustes
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth'; // Usamos el helper centralizado

/* 
interface Params {
  params: { id: string };
}

// POST: Crear un nuevo ajuste de inventario (Sumar o Restar Stock)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const productId = parseInt(params.id, 10);
    const body = await req.json();
    const { cantidad, motivo } = body;

    // 1. Verificación de propiedad: ¿Este producto pertenece al aserradero del usuario?
    const product = await prisma.productoCatalogo.findFirst({
        where: {
            id_producto_catalogo: productId,
            id_aserradero: authPayload.aserraderoId,
        }
    });

    if (!product) {
        return NextResponse.json({ message: "Producto no encontrado o no tienes permiso para modificarlo." }, { status: 404 });
    }

    // 2. Validación de la entrada
    if (typeof cantidad !== 'number' || cantidad === 0) {
      return NextResponse.json({ message: 'La cantidad debe ser un número diferente de cero.' }, { status: 400 });
    }

    // 3. Transacción para asegurar la consistencia de los datos
    const [updatedProduct, _] = await prisma.$transaction([
      prisma.productoCatalogo.update({
        where: { id_producto_catalogo: productId },
        data: { stock: { increment: cantidad } }
      }),
      prisma.ajusteInventario.create({
        data: {
          id_producto_catalogo: productId,
          cantidad: cantidad,
          motivo: motivo || 'Ajuste manual',
          id_usuario: authPayload.userId
        }
      })
    ]);

    return NextResponse.json({ 
      message: 'Stock actualizado con éxito.', 
      product: updatedProduct 
    });

  } catch (error: any) {
    console.error("Error al ajustar el stock:", error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// GET: Obtener el historial de ajustes (ahora seguro)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const productId = parseInt(params.id, 10);

    const ajustes = await prisma.ajusteInventario.findMany({
      where: {
        id_producto_catalogo: productId,
        // Verificamos a través de la relación que el producto pertenezca al aserradero del usuario
        producto: {
          id_aserradero: authPayload.aserraderoId,
        },
      },
      include: {
        usuario: { select: { nombre_completo: true } },
      },
      orderBy: { fecha_ajuste: 'desc' },
    });
    
    // No es necesario un 'if (!ajustes)' porque findMany devuelve un array vacío si no hay resultados.
    return NextResponse.json(ajustes);

  } catch (error) {
    console.error("Error al obtener el historial de ajustes:", error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
} */