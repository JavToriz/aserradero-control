import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  // 1. Creamos la respuesta base
  const response = NextResponse.json(
    { message: "Sesión finalizada correctamente" },
    { status: 200 }
  );

  // 2. SEGURIDAD: Limpieza agresiva de Cookies
  // Aunque uses localStorage, esto es una "Defensa en Profundidad".
  // Borramos cualquier cookie que pueda haber quedado, incluyendo las de Supabase.
  const cookieStore = await cookies();
  
  // Borramos posibles cookies de tu app
  cookieStore.delete('sessionToken');
  cookieStore.delete('token');
  
  // Borramos posibles cookies de Supabase (prefijos comunes)
  // Nota: El nombre exacto depende de tu configuración, pero esto cubre lo estándar
  cookieStore.delete('sb-access-token');
  cookieStore.delete('sb-refresh-token');
  // Reemplaza 'project-ref' con el ID de tu proyecto si Supabase usa cookies específicas
  // cookieStore.delete('sb-tu-project-id-auth-token'); 

  // 3. SEGURIDAD: Cabeceras Anti-Caché (Cache-Busting)
  // Esto es vital. Le dice al navegador: "Olvida todo lo que acabas de ver".
  // Evita que al dar clic en "Atrás" se vea información confidencial del aserradero.
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');

  return response;
}