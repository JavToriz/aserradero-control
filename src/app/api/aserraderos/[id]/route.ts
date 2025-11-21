import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

//const prisma = new PrismaClient();

interface Params {
  params: { id: string };
}

// Obtener un aserradero por ID
export async function GET(req: Request, { params }: Params) {
  try {
    const aserradero = await prisma.aserradero.findUnique({
      where: { id_aserradero: parseInt(params.id, 10) },
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
export async function PUT(req: Request, { params }: Params) {
  try {
    const data = await req.json();
    const updatedAserradero = await prisma.aserradero.update({
      where: { id_aserradero: parseInt(params.id, 10) },
      data,
    });
    return NextResponse.json(updatedAserradero);
  } catch (error) {
    return NextResponse.json({ message: 'Error al actualizar' }, { status: 500 });
  }
}

// Eliminar un aserradero por ID
export async function DELETE(req: Request, { params }: Params) {
  try {
    await prisma.aserradero.delete({
      where: { id_aserradero: parseInt(params.id, 10) },
    });
    return new NextResponse(null, { status: 204 }); // Sin contenido
  } catch (error) {
    return NextResponse.json({ message: 'Error al eliminar' }, { status: 500 });
  }
}