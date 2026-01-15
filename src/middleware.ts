import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req: NextRequest) {
  // 1. OBTENCIÓN DEL TOKEN (Header para API o Cookie para Vistas)
  const token = req.cookies.get('sessionToken')?.value || req.headers.get('authorization')?.split(' ')[1];

  const { pathname } = req.nextUrl;
  const { method } = req;
  
  // Detectamos si es una llamada a la API o una navegación de usuario
  const isApiUrl = pathname.startsWith('/api');

  // 2. VALIDACIÓN DE EXISTENCIA DE TOKEN
  if (!token) {
    if (isApiUrl) {
      return NextResponse.json({ message: 'Autenticación requerida' }, { status: 401 });
    } else {
      // Si intenta ver una página sin estar logueado, al login
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const roles = (payload.roles as string[]) || []; // Obtenemos roles del token
    
    // --- LÓGICA DE ASERRADERO (Tu código original) ---
    // Permitimos acceso a rutas de selección
    if ((pathname === '/api/aserraderos' && (method === 'POST' || method === 'GET')) || pathname === '/seleccionar-aserradero') {
        return NextResponse.next();
    }
    
    // Verificamos aserraderoId
    if (typeof payload.aserraderoId !== 'number') {
        if (isApiUrl) {
            return NextResponse.json({ message: 'Selección de aserradero requerida' }, { status: 401 });
        } else {
            return NextResponse.redirect(new URL('/seleccionar-aserradero', req.url));
        }
    }

    // =========================================================================
    // 3. LÓGICA DE ROLES CENTRALIZADA
    // =========================================================================

    // --- ROL: ADMIN ---
    // Puede hacer todo. Pase directo.
    if (roles.includes('admin')) {
      return NextResponse.next();
    }

    // --- ROL: TRABAJADOR ---
    // Solo puede entrar a Producción e Inventarios. (Lista Blanca)
    if (roles.includes('trabajador')) {
      const rutasPermitidas = [
        // API Routes
        '/api/produccion',
        '/api/inventario',
        '/api/stock-producto-terminado',
        '/api/ordenes-aserradero',
        '/api/stock-producto-terminado', 
        // Page Views (Vistas)
        '/dashboard',
        '/produccion',
        '/dashboard',
        '/inventario',
        '/inventario-comercial',
        '/ordenes',
      ];

      const esPermitida = rutasPermitidas.some(ruta => pathname.startsWith(ruta));

      if (!esPermitida) {
        if (isApiUrl) {
           return NextResponse.json({ message: ' Acceso restringido, lo sentimos.' }, { status: 403 });
        } else {
           // Si intenta entrar a una vista prohibida (ej: /ventas), a la pantalla de error
           return NextResponse.redirect(new URL('/acceso-denegado', req.url));
        }
      }
      return NextResponse.next();
    }

    // --- ROL: VENDEDOR ---
    // Restricciones específicas (Lista Negra)
    if (roles.includes('vendedor')) {
      
      // A. Restricciones API (Acciones destructivas)
      if (isApiUrl) {
        // No eliminar ventas ni gastos
        if ((pathname.startsWith('/api/ventas') || pathname.startsWith('/api/gastos')) && method === 'DELETE') {
            return NextResponse.json({ message: 'No tienes permiso para eliminar registros.' }, { status: 403 });
        }
        // No editar ventas (si aplica)
        if (pathname.startsWith('/api/ventas') && (method === 'PUT' || method === 'PATCH')) {
             // Opcional: Descomenta si quieres bloquear edición
             // return NextResponse.json({ message: '⛔ No puedes editar ventas.' }, { status: 403 });
        }
        // No entrar a configuración administrativa
        if (pathname.startsWith('/api/usuarios') || pathname.startsWith('/api/roles') || pathname.startsWith('/api/configuracion')) {
            return NextResponse.json({ message: ' Área restringida.' }, { status: 403 });
        }
      } 
      // B. Restricciones Vistas (Pantallas prohibidas)
      else {
        if (pathname.startsWith('/usuarios') || pathname.startsWith('/configuracion')) {
            return NextResponse.redirect(new URL('/acceso-denegado', req.url));
        }
      }
      
      return NextResponse.next();
    }

    // Si pasa todas las validaciones (o tiene un rol no definido que no cayó en restricciones)
    return NextResponse.next();

  } catch (error) {
    console.error("Error de JWT en middleware:", error);
    if (isApiUrl) {
        return NextResponse.json({ message: 'Token inválido o expirado' }, { status: 401 });
    } else {
        return NextResponse.redirect(new URL('/login', req.url));
    }
  }
}

// 4. MATCHER ACTUALIZADO (APIs + Vistas)
export const config = {
  matcher: [
    // --- APIs (Tus rutas existentes) ---
    '/api/aserraderos/:path*',
    '/api/productos/:path*',
    '/api/usuarios/:path*',
    '/api/roles/:path*',
    '/api/ventas/:path*',
    '/api/gastos/:path*',
    '/api/produccion/:path*',
    '/api/inventario/:path*',
    '/api/inventario-comercial/:path*',
    '/api/ordenes-aserradero/:path*',
    '/api/precios/:path*',
    '/api/remisiones/:path*',
    '/api/reembarques/:path*',
    '/api/reportes/:path*',
    '/api/stock-producto-terminado/:path*',
    '/api/caja/:path*',
    '/api/configuracion/:path*',

    // --- VISTAS (NUEVO: Para proteger la navegación del navegador) ---
    '/dashboard/:path*',
    '/caja/:path*',
    '/productos/:path*',
    '/ventas/:path*',
    '/gastos/:path*',
    '/produccion/:path*',
    '/inventario/:path*',
    '/usuarios/:path*',
    '/configuracion/:path*',
    '/reportes/:path*',
    '/remisiones/:path*',
    '/reembarques/:path*',
    // Agrega aquí cualquier otra carpeta de página que quieras proteger
  ],
};