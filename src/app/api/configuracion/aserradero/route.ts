import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

export async function GET(req: NextRequest) {
  // 1. Validar sesión
  const authPayload = await getAuthPayload(req);
  
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
  }

  try {
    // 2. Buscar datos
    const aserradero = await prisma.aserradero.findUnique({
      where: { id_aserradero: authPayload.aserraderoId },
    });

    if (!aserradero) {
      return NextResponse.json({ message: 'Aserradero no encontrado' }, { status: 404 });
    }

    // --- LÓGICA PARA UNIR TELÉFONOS ---
    // Filtramos los que no sean nulos y los unimos con " y "
    const tels = [aserradero.telefono, aserradero.telefono2]
      .filter(t => t && t.trim() !== '') // Elimina nulos o vacíos
      .join(' y ');

    // 3. Mapear datos
    const config = {
      nombre: aserradero.nombre,
      propietario: aserradero.propietario || 'Propietario no registrado',
      rfc: aserradero.rfc || '',
      curp: aserradero.curp || '',
      rfn: aserradero.rfn || '',
      c_i: aserradero.c_i || '',
      
      telefonos: tels || '', // <--- AQUÍ PASAMOS LA CADENA YA FORMATEADA
      
      direccion_completa: aserradero.direccion || 'Dirección no registrada',
      ciudad_estado: aserradero.ciudad_estado || 'HUASCA DE OCAMPO, HGO.', 
      logo_url: aserradero.logo_url || '/images/logo-puente-de-doria.png',
    };

    return NextResponse.json(config);
    
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}