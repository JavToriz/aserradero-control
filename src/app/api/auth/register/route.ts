// Este endpoint crea un nuevo usuario en la base de datos

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

//const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre_usuario, hash_contrasena, nombre_completo, roles } = body;

    if (!nombre_usuario || !hash_contrasena) {
      return NextResponse.json(
        { message: 'El nombre de usuario y la contraseña son requeridos' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(hash_contrasena, 10);

    const newUser = await prisma.usuario.create({
      data: {
        nombre_usuario,
        //hash_contrasena: hashedPassword,
        nombre_completo,
        // Conectar los roles si se proporcionan
        roles: roles && roles.length > 0 ? {
          create: roles.map((roleId: number) => ({
            rol: {
              connect: { id_rol: roleId },
            },
          })),
        } : undefined,
      },
    });
    
    // No devolver el hash de la contraseña en la respuesta
    //const { hash_contrasena: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({ message: 'usuario creado'}, { status: 201 });
  } catch (error) {
    console.error(error);
    // Manejar error de usuario duplicado
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        return NextResponse.json({ message: 'El nombre de usuario ya existe' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
