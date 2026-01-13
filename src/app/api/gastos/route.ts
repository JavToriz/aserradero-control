import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

// GET: Listar historial de gastos con Folios Reales
export async function GET(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    // 1. Obtener gastos
    const gastos = await prisma.reciboGasto.findMany({
      where: {
        id_aserradero: authPayload.aserraderoId,
      },
      include: {
        beneficiario: {
          select: { nombre_completo: true }
        },
        responsable_entrega: {
          select: { nombre_completo: true }
        }
      },
      orderBy: {
        fecha_emision: 'desc',
      },
    });

    // 2. ENRIQUECIMIENTO: Obtener los folios de las remisiones relacionadas
    // Filtramos los IDs de remisiones únicas para no consultar la misma 20 veces
    const remisionIds = Array.from(new Set(
      gastos
        .filter(g => g.documento_asociado_tipo === 'REMISION' && g.documento_asociado_id)
        .map(g => g.documento_asociado_id as number)
    ));

    // Consultamos solo los folios necesarios
    const remisiones = await prisma.remision.findMany({
      where: { id_remision: { in: remisionIds } },
      select: { id_remision: true, folio_progresivo: true }
    });

    // Creamos un mapa rápido para búsqueda: ID -> Folio
    const folioMap = new Map(remisiones.map(r => [r.id_remision, r.folio_progresivo]));

    // 3. Adjuntamos el folio real a cada objeto de gasto
    const gastosConFolio = gastos.map(g => ({
      ...g,
      folio_remision_asociada: (g.documento_asociado_tipo === 'REMISION' && g.documento_asociado_id)
        ? folioMap.get(g.documento_asociado_id)
        : null
    }));

    return NextResponse.json(gastosConFolio);
  } catch (error) {
    console.error("Error al obtener gastos:", error);
    return NextResponse.json({ message: 'Error al obtener gastos' }, { status: 500 });
  }
}

// POST: Crear nuevo recibo de gasto (Mantenemos la lógica de acumulados)
export async function POST(req: Request) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId || !authPayload.userId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      fecha_emision,
      id_beneficiario,
      monto,
      monto_letra,
      concepto_general,
      concepto_detalle,
      documento_asociado_id,
      documento_asociado_tipo,
      estado_pago
    } = body;

    if (!id_beneficiario || !monto || !concepto_general) {
      return NextResponse.json({ message: 'Faltan datos requeridos' }, { status: 400 });
    }

    const fechaISO = new Date(`${fecha_emision}T12:00:00Z`).toISOString();
    const montoNumerico = parseFloat(monto);

    const estadoFinal = estado_pago || 'PAGADO';

    // --- LÓGICA DE NEGOCIO: CÁLCULO DE ACUMULADOS PARA PAGO DE MADERA ---
    let infoAcumulado = null;

    if (
      concepto_general === 'PAGO DE MADERA' && 
      documento_asociado_id && 
      documento_asociado_tipo === 'REMISION'
    ) {
      const idRemision = parseInt(documento_asociado_id);

      const historialPagos = await prisma.reciboGasto.aggregate({
        _sum: { monto: true },
        where: {
          id_aserradero: authPayload.aserraderoId,
          documento_asociado_id: idRemision,
          documento_asociado_tipo: 'REMISION',
          concepto_general: 'PAGO DE MADERA',
        }
      });

      const remisionData = await prisma.remision.findUnique({
        where: { id_remision: idRemision },
        select: { folio_progresivo: true, volumen_total_m3: true }
      });

      const totalPagadoPrevio = Number(historialPagos._sum.monto || 0);
      const nuevoTotalAcumulado = totalPagadoPrevio + montoNumerico;

      infoAcumulado = {
        folio_remision: remisionData?.folio_progresivo,
        volumen_m3: Number(remisionData?.volumen_total_m3 || 0),
        pagado_previo: totalPagadoPrevio,
        nuevo_total_pagado: nuevoTotalAcumulado,
        mensaje: `Con este pago, se han abonado $${nuevoTotalAcumulado.toFixed(2)} a la Remisión ${remisionData?.folio_progresivo}`
      };
    }

    //const estadoInicial = concepto_general === 'FLETE' ? 'PENDIENTE' : 'PAGADO';

    const nuevoGasto = await prisma.reciboGasto.create({
      data: {
        id_aserradero: authPayload.aserraderoId,
        id_turno: null, 
        fecha_emision: fechaISO,
        id_beneficiario: parseInt(id_beneficiario),
        id_responsable_usuario: authPayload.userId,
        monto: montoNumerico,
        monto_letra: monto_letra,
        concepto_general: concepto_general,
        concepto_detalle: concepto_detalle || null,
        documento_asociado_id: documento_asociado_id ? parseInt(documento_asociado_id) : null,
        documento_asociado_tipo: documento_asociado_tipo || null,
        estado_pago: estadoFinal,
      },
    });

    return NextResponse.json({
      ...nuevoGasto,
      meta_acumulado: infoAcumulado
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error al crear gasto:", error);
    return NextResponse.json({ message: error.message || 'Error al crear el recibo de gasto' }, { status: 500 });
  }
}