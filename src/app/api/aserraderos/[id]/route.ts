import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// En Next.js 15, params es una Promesa que debemos esperar
interface Props {
  params: Promise<{ id: string }>;
}

// Obtener un aserradero por ID
export async function GET(req: Request, props: Props) {
  try {
    // 1. AWAIT obligatorio en Next.js 15
    const params = await props.params;
    const id = parseInt(params.id, 10);

    const aserradero = await prisma.aserradero.findUnique({
      where: { id_aserradero: id },
    });
    if (!aserradero) {
      return NextResponse.json({ message: 'Aserradero no encontrado' }, { status: 404 });
    }
    return NextResponse.json(aserradero);
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Actualizar un aserradero por ID
export async function PUT(req: Request, props: Props) {
  try {
    const params = await props.params; // <--- AWAIT
    const id = parseInt(params.id, 10);

    const data = await req.json();
    const updatedAserradero = await prisma.aserradero.update({
      where: { id_aserradero: id },
      data,
    });
    return NextResponse.json(updatedAserradero);
  } catch (error) {
    return NextResponse.json({ message: 'Error al actualizar' }, { status: 500 });
  }
}

// Eliminar un aserradero por ID
export async function DELETE(req: Request, props: Props) {
  try {
    const params = await props.params; // <--- AWAIT
    const id = parseInt(params.id, 10);

    await prisma.aserradero.delete({
      where: { id_aserradero: id },
    });
    return new NextResponse(null, { status: 204 }); // Sin contenido
  } catch (error) {
    return NextResponse.json({ message: 'Error al eliminar' }, { status: 500 });
  }
}