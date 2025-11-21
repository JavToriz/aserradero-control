// app/api/usuarios/[id]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

interface Params {
  params: { id: string };
}

// GET: Obtener un usuario específico
export async function GET(req: Request, { params }: Params) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: parseInt(params.id, 10) },
      select: { // Nuevamente, excluimos el hash de la contraseña
        id_usuario: true,
        nombre_usuario: true,
        nombre_completo: true,
        activo: true,
        fecha_creacion: true,
        id_aserradero_predeterminado: true
      },
    });

    if (!usuario) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }
    return NextResponse.json(usuario);
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT: Actualizar un usuario
export async function PUT(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const { hash_contrasena, ...dataToUpdate } = body;

    // Si se incluye una nueva contraseña en la petición, la hasheamos
    if (hash_contrasena) {
      dataToUpdate.hash_contrasena = await bcrypt.hash(hash_contrasena, 10);
    }

    const updatedUsuario = await prisma.usuario.update({
      where: { id_usuario: parseInt(params.id, 10) },
      data: dataToUpdate,
    });
    
    // Ocultar el hash de la contraseña en la respuesta
    const { hash_contrasena: _, ...userToReturn } = updatedUsuario;

    return NextResponse.json(userToReturn);
  } catch (error: any) {
    if (error.code === 'P2025') { // Recurso no encontrado
        return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error al actualizar usuario' }, { status: 500 });
  }
}

// DELETE: Eliminar un usuario
export async function DELETE(req: Request, { params }: Params) {
  try {
    await prisma.usuario.delete({
      where: { id_usuario: parseInt(params.id, 10) },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.code === 'P2025') {
        return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error al eliminar usuario' }, { status: 500 });
  }
}