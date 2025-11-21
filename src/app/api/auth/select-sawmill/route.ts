// src/app/api/auth/select-sawmill/route.ts
//Endpoint para seleccionar el aserradero y generar el token final
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload) {
    return NextResponse.json({ message: 'Token inválido o expirado' }, { status: 401 });
  }

  try {
    const { id_aserradero } = await req.json();
    const userId = authPayload.userId;
    
    if (!id_aserradero) {
      return NextResponse.json({ message: 'Se requiere id_aserradero' }, { status: 400 });
    }

    // Verificamos que el usuario realmente tenga acceso a este aserradero
    const tieneAcceso = await prisma.usuarioAserradero.findUnique({
        where: {
            id_usuario_id_aserradero: {
                id_usuario: userId,
                id_aserradero: id_aserradero
            }
        }
    });

    if (!tieneAcceso) {
        return NextResponse.json({ message: 'Acceso denegado a este aserradero' }, { status: 403 });
    }
    
    // Buscamos los datos completos del usuario para el token final
    const user = await prisma.usuario.findUnique({ 
        where: { id_usuario: userId },
        include: { roles: { include: { rol: true } } }
    });

    if (!user) {
        return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET no está definido");

    // Creamos el token de sesión final, que ahora SÍ incluye el aserradero
    const sessionToken = jwt.sign(
      {
        userId: user.id_usuario,
        username: user.nombre_usuario,
        aserraderoId: id_aserradero, // El aserradero seleccionado
        roles: user.roles.map(userRole => userRole.rol.nombre_rol),
      },
      secret,
      { expiresIn: '8h' } // Duración de una jornada laboral
    );
    
    return NextResponse.json({ sessionToken });

  } catch (error) {
    console.error("Error al seleccionar aserradero:", error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}