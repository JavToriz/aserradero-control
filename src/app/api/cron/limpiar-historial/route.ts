// Este endpoint se ejecutará automáticamente cada mes mediante un Cron Job 
// para limpiar el historial de ajustes de inventario
// Necesitará un token especial para ejecutarse, que solo nuestro Cron Job conocerá.
// Vercel llamará este endpoint 
// NOTA: NO FUNCIONANDO AÚN, HASTA PRODUCCIÓN

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  // 1. Proteger el endpoint
  // Obtenemos el token de autorización que SOLO nuestro Cron Job conocerá.
  const authHeader = request.headers.get('authorization');
  
  // Lo comparamos con una variable de entorno secreta.
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Calcular la fecha límite (hace 3 meses)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // 3. Ejecutar la eliminación en la base de datos
    const result = await prisma.ajusteInventario.deleteMany({
      where: {
        fecha_ajuste: {
          lt: threeMonthsAgo, // 'lt' significa 'less than' (menor que)
        },
      },
    });

    // Devolvemos una respuesta exitosa indicando cuántos registros se eliminaron
    return NextResponse.json({ 
      success: true, 
      message: `Limpieza completada. Se eliminaron ${result.count} registros antiguos.` 
    });

  } catch (error) {
    console.error("Error en la tarea de limpieza de historial:", error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}