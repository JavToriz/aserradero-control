import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  let userId: number | null = null;
  
  // 1. Intentamos obtener sesión interna
  const internalAuth = await getAuthPayload(req);

  if (internalAuth) {
    userId = internalAuth.userId;
  } else {
    // 2. Intentamos validar con Supabase
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        console.log("🟢 Supabase User ID detectado:", user.id); // <--- DEBUG

        const dbUser = await prisma.usuario.findUnique({
            where: { supabase_uid: user.id },
            select: { id_usuario: true, nombre_usuario: true } // Seleccionamos nombre para verificar
        });
        
        if (dbUser) {
            console.log("✅ Usuario encontrado en DB:", dbUser.nombre_usuario); // <--- DEBUG
            userId = dbUser.id_usuario;
        } else {
            console.log("🔴 ERROR: El UID de Supabase no coincide con ningún supabase_uid en la tabla Usuario"); // <--- DEBUG
        }
      } else {
          console.log("🔴 Error validando token con Supabase:", error?.message);
      }
    }
  }

  if (!userId) {
    return NextResponse.json({ message: 'No autenticado o usuario no vinculado' }, { status: 401 });
  }

  try {
    const asignaciones = await prisma.usuarioAserradero.findMany({
      where: { id_usuario: userId },
      include: { aserradero: true },
    });
    
    const aserraderos = asignaciones.map(a => a.aserradero);

    if (aserraderos.length === 0) {
        return NextResponse.json({ message: 'El usuario no tiene aserraderos asignados.' }, { status: 403 });
    }

    return NextResponse.json({ aserraderos });

  } catch (error) {
    console.error("Error al obtener sesión:", error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}