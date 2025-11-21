// src/app/api/auth/login/route.ts
// Este endpoint maneja la autenticación de usuarios y la generación de tokens JWT

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

//const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre_usuario, hash_contrasena } = body;

    if (!nombre_usuario || !hash_contrasena) {
      return NextResponse.json({ message: 'Credenciales requeridas' }, { status: 400 });
    }

    const user = await prisma.usuario.findUnique({
      where: { nombre_usuario },
      include: { roles: { include: { rol: true } } },
    });

    if (!user) {
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(hash_contrasena, user.hash_contrasena);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }


    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET no está definido en las variables de entorno");
    }

    const token = jwt.sign(
      {
        userId: user.id_usuario,
        username: user.nombre_usuario,
        //roles: user.roles.map(userRole => userRole.rol.nombre_rol),
      },
      secret,
      { expiresIn: '20m' } // EXPIRACIÓN DEL TOKEN (Un tiempo de vida corto, solo para elegir el perfil)
    );

    return NextResponse.json({ token });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}