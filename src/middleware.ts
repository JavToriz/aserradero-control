// Archivo clave para proteje rutas.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];

  // --- Obtenemos el path y método ---
  const { pathname } = req.nextUrl;
  const { method } = req;

  if (!token) {
    return NextResponse.json(
      { message: 'Autenticación requerida' },
      { status: 401 }
    );
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    
    // Permitimos el acceso a las rutas de selección de aserradero
    if (pathname === '/api/aserraderos' && (method === 'POST' || method === 'GET')) {
        // El token es válido, dejamos pasar la petición
        // sin verificar el aserraderoId
        return NextResponse.next();
    }
    
    // MUY IMPORTANTE: Verificamos que el token tenga el aserraderoId.
    // Esto asegura que solo los tokens de sesión finales puedan acceder a las rutas protegidas.
    if (typeof payload.aserraderoId !== 'number') {
        return NextResponse.json({ message: 'Selección de aserradero requerida' }, { status: 401 });
    }
    return NextResponse.next();
  } catch (error) {
    console.error("Error de JWT en middleware:", error);
    return NextResponse.json(
      { message: 'Token inválido o expirado' },
      { status: 401 }
    );
  }
}

// El 'matcher' especifica qué rutas serán protegidas por este middleware
export const config = {
  matcher: [
    '/api/aserraderos/:path*',
    '/api/productos/:path*',
    '/api/usuarios/:path*',
    '/api/roles/:path*',
    //'/api/productos/:path*/ajuste'
    // Agrega aquí todas las rutas que necesiten protección


    // ==== ¡NO incluir /api/auth/session ni /api/auth/select-sawmill aquí! ===
  ],
};