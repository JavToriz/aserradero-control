// app/api/roles/[id]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cambio necesario: params es ahora una Promesa
interface Props {
  params: Promise<{ id: string }>;
}

// GET: Obtener un rol específico
export async function GET(req: Request, props: Props) {
  try {
    const params = await props.params; // <--- Await necesario
    const id = parseInt(params.id, 10);

    const rol = await prisma.rol.findUnique({
      where: { id_rol: id },
    });
    if (!rol) {
      return NextResponse.json({ message: 'Rol no encontrado' }, { status: 404 });
    }
    return NextResponse.json(rol);
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT: Actualizar un rol
export async function PUT(req: Request, props: Props) {
  try {
    const params = await props.params; // <--- Await necesario
    const id = parseInt(params.id, 10);

    const { nombre_rol } = await req.json();
    const updatedRol = await prisma.rol.update({
      where: { id_rol: id },
      data: { nombre_rol },
    });
    return NextResponse.json(updatedRol);
  } catch (error: any) {
    if (error.code === 'P2025') {
        return NextResponse.json({ message: "Rol no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error al actualizar rol' }, { status: 500 });
  }
}

// DELETE: Eliminar un rol
export async function DELETE(req: Request, props: Props) {
  try {
    const params = await props.params; // <--- Await necesario
    const id = parseInt(params.id, 10);

    await prisma.rol.delete({
      where: { id_rol: id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.code === 'P2025') {
        return NextResponse.json({ message: "Rol no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error al eliminar rol' }, { status: 500 });
  }
}