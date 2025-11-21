// app/api/remisiones/route.ts
// Endpoint principal para listar y crear Remisiones.

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

/**
 * GET: Listar todas las remisiones del aserradero actual.
 */
export async function GET(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const remisiones = await prisma.remision.findMany({
      where: {
        id_aserradero: authPayload.aserraderoId,
      },
      include: {
        titular: { select: { nombre_completo: true } },
        remitente: { select: { nombre_completo: true } },
        destinatario: { select: { nombre_completo: true } },
        chofer: { select: { nombre_completo: true } },
        vehiculo: { select: { matricula: true, marca: true } },
        predio_origen: { select: { nombre_predio: true } },
      },
      orderBy: {
        fecha_emision: 'desc',
      },
    });
    return NextResponse.json(remisiones);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener remisiones' }, { status: 500 });
  }
}

/**
 * POST: Crear una nueva remisión (Capturar el documento físico).
 */
export async function POST(req: Request) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    // 1. Obtenemos el "body" completo que envía el frontend
    const body = await req.json();

    // 2. --- INICIO DE LA CORRECCIÓN ---
    // Destructuramos SÓLO los campos que existen en el modelo de Prisma.
    // Esto filtra automáticamente los campos extra (ej. 'titular_nombre')
    const {
      folio_progresivo,
      folio_autorizado,
      fecha_emision, // Este es el string "2025-11-17"
      id_titular,
      id_predio_origen,
      id_remitente,
      id_destinatario,
      id_vehiculo,
      id_chofer,
      descripcion_producto_remision,
      genero_madera,
      cantidad_amparada,
      saldo_disponible_anterior,
      volumen_total_m3
    } = body;

    // 3. Construimos el objeto 'data' limpio para Prisma
    const data = {
      folio_progresivo,
      folio_autorizado: folio_autorizado || null,
      
      // -- ESTE ES EL ARREGLO PARA LA FECHA --
      // Convertimos el string de fecha (ej: "2025-11-17") a un objeto Date de ISO
      // que Prisma pueda entender (ej: "2025-11-17T00:00:00.000Z")
      fecha_emision: fecha_emision ? new Date(fecha_emision).toISOString() : null,

      // Inyectamos el ID del aserradero desde el token
      id_aserradero: authPayload.aserraderoId,
      
      // Asignamos los IDs de las relaciones, asegurándonos de que sean 'null' si están vacíos
      id_titular: id_titular || null,
      id_predio_origen: id_predio_origen || null,
      id_remitente: id_remitente || null,
      id_destinatario: id_destinatario || null,
      id_vehiculo: id_vehiculo || null,
      id_chofer: id_chofer || null,
      
      // El resto de los datos
      descripcion_producto_remision,
      genero_madera,
      cantidad_amparada,
      saldo_disponible_anterior,
      volumen_total_m3
    };
    // --- FIN DE LA CORRECCIÓN ---

    const nuevaRemision = await prisma.remision.create({
      data: data, // Ahora le pasamos el objeto 'data' limpio
    });

    return NextResponse.json(nuevaRemision, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') { // Folio progresivo duplicado
       // Corregido: 'target' es un array, tomamos el primer elemento
       const field = error.meta?.target ? error.meta.target[0] : 'folio_progresivo';
       return NextResponse.json({ message: `Error: El campo '${field}' ya existe.` }, { status: 409 });
    }
    console.error("Error al crear la remisión:", error); // Loguea el error completo
    return NextResponse.json({ message: 'Error al crear la remisión' }, { status: 500 });
  }
}