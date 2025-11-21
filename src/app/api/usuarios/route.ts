// app/api/usuarios/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET: Obtener todos los usuarios
export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      // Excluimos el hash de la contraseña de la respuesta por seguridad
      select: {
        id_usuario: true,
        nombre_usuario: true,
        nombre_completo: true,
        activo: true,
        fecha_creacion: true,
        id_aserradero_predeterminado: true,
        roles: {
          select: {
            rol: {
              select: {
                id_rol: true,
                nombre_rol: true,
              }
            }
          }
        }
      },
    });
    return NextResponse.json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

// POST: Crear un nuevo usuario
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre_usuario, hash_contrasena, nombre_completo, roles, ...rest } = body;

    if (!nombre_usuario || !hash_contrasena) {
      return NextResponse.json({ message: 'El nombre de usuario y la contraseña son requeridos' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(hash_contrasena, 10);

    const newUser = await prisma.usuario.create({
      data: {
        nombre_usuario,
        hash_contrasena: hashedPassword,
        nombre_completo,
        ...rest,
        // Conectar los roles si se proporciona un array de IDs [1, 2, ...]
        roles: roles && roles.length > 0 ? {
          create: roles.map((id_rol: number) => ({
            rol: {
              connect: { id_rol },
            },
          })),
        } : undefined,
      },
    });
    
    // Ocultar el hash de la contraseña en la respuesta
    const { hash_contrasena: _, ...userToReturn } = newUser;

    return NextResponse.json(userToReturn, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear usuario:", error);
    if (error.code === 'P2002') { // Error de restricción única de Prisma
        return NextResponse.json({ message: 'El nombre de usuario ya existe' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}