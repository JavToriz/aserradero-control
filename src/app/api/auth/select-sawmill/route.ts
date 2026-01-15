// src/app/api/auth/select-sawmill/route.ts
//Endpoint para seleccionar el aserradero y generar el token final
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    // 1. Obtenemos el token de Supabase y el ID del aserradero del body
    const { id_aserradero, supabase_token } = await req.json();

    if (!supabase_token || !id_aserradero) {
      return NextResponse.json({ message: 'Datos incompletos' }, { status: 400 });
    }

    // 2. Verificamos el token de Supabase para obtener el usuario real
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(supabase_token);

    if (error || !supabaseUser) {
      return NextResponse.json({ message: 'Token de Supabase inválido' }, { status: 401 });
    }

    // 3. Buscamos al usuario en NUESTRA base de datos usando el UID de Supabase
    // NOTA: Debes asegurarte que tus usuarios en DB tengan el campo supabase_uid lleno
    const dbUser = await prisma.usuario.findUnique({ 
        where: { supabase_uid: supabaseUser.id },
        include: { roles: { include: { rol: true } } }
    });

    if (!dbUser) {
        return NextResponse.json({ message: 'Usuario no registrado en el sistema interno' }, { status: 404 });
    }

    // 4. Verificamos acceso al aserradero (Lógica existente)
    const tieneAcceso = await prisma.usuarioAserradero.findUnique({
        where: {
            id_usuario_id_aserradero: {
                id_usuario: dbUser.id_usuario,
                id_aserradero: id_aserradero
            }
        }
    });

    if (!tieneAcceso) {
        return NextResponse.json({ message: 'Acceso denegado a este aserradero' }, { status: 403 });
    }

    // 5. Generamos TU token de sesión (La lógica que ya tenías)
    // Este token es el que usará el resto de la app, manteniendo tu middleware actual feliz.
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET no está definido");

    const sessionToken = jwt.sign(
      {
        userId: dbUser.id_usuario,
        username: dbUser.nombre_usuario,
        aserraderoId: id_aserradero,
        roles: dbUser.roles.map(r => r.rol.nombre_rol),
      },
      secret,
      { expiresIn: '4h' }
    );

    // 2. Guardamos la cookie desde el servidor para que el Middleware la vea
    const cookieStore = await cookies(); // await es necesario en Next 15, en 14 no, pero es seguro ponerlo
    
    cookieStore.set('sessionToken', sessionToken, {
      httpOnly: false, // False para que el JS del cliente pueda leerla si es necesario
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'lax',
      path: '/',
      maxAge: 4 * 60 * 60 // 4 horas (mismo que el token)
    });
    
    return NextResponse.json({ sessionToken });

  } catch (error) {
    console.error("Error al seleccionar aserradero:", error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}