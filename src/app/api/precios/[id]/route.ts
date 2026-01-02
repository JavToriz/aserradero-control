// app/api/precios/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: Params) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const id_precio = parseInt(id, 10);
    
    // --- CAMBIO: Recibimos ambos precios ---
    const { precio_por_pt, precio_mayoreo_por_pt } = await req.json();

    const actualizado = await prisma.precioBaseMadera.update({
      where: { 
        id_precio_base: id_precio,
        id_aserradero: authPayload.aserraderoId 
      },
      data: { 
        // Actualizamos precio de menudeo (siempre requerido)
        precio_por_pt: parseFloat(precio_por_pt),
        
        // Actualizamos precio de mayoreo (opcional, puede ser null)
        precio_mayoreo_por_pt: precio_mayoreo_por_pt !== undefined && precio_mayoreo_por_pt !== '' 
          ? parseFloat(precio_mayoreo_por_pt) 
          : null,
          
        fecha_actualizacion: new Date()
      }
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar precio:", error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}