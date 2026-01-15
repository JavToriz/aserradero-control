// app/api/gastos/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';
import { CajaService } from "@/lib/caja-service"; // <--- 1. IMPORTAR SERVICIO

// --- GET (Sin cambios importantes, solo importaciones) ---
export async function GET(req: NextRequest) {
  // ... (Tu código GET existente se queda EXACTAMENTE IGUAL) ...
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const gastos = await prisma.reciboGasto.findMany({
      where: { id_aserradero: authPayload.aserraderoId },
      include: {
        beneficiario: { select: { nombre_completo: true } },
        responsable_entrega: { select: { nombre_completo: true } }
      },
      orderBy: { id_recibo_gasto: 'desc' },
    });

    const remisionIds = Array.from(new Set(
      gastos
        .filter(g => g.documento_asociado_tipo === 'REMISION' && g.documento_asociado_id)
        .map(g => g.documento_asociado_id as number)
    ));

    const remisiones = await prisma.remision.findMany({
      where: { id_remision: { in: remisionIds } },
      select: { id_remision: true, folio_progresivo: true }
    });

    const folioMap = new Map(remisiones.map(r => [r.id_remision, r.folio_progresivo]));

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


// --- POST (Modificado para Caja) ---
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
      estado_pago,
      metodo_pago // <--- Leemos esto (o asumimos Efectivo)
    } = body;

    if (!id_beneficiario || !monto || !concepto_general) {
      return NextResponse.json({ message: 'Faltan datos requeridos' }, { status: 400 });
    }

    const fechaISO = new Date(`${fecha_emision}T12:00:00Z`).toISOString();
    const montoNumerico = parseFloat(monto);
    const id_aserradero = authPayload.aserraderoId;

    const estadoFinal = estado_pago || 'PAGADO';
    // Si no envían metodo_pago, asumimos EFECTIVO por seguridad, o ajústalo según tu UI.
    const metodoPagoFinal = metodo_pago || 'EFECTIVO'; 

    // --- 2. LÓGICA DE CAJA: Validar Turno ---
    let idTurnoActivo = null;
    const turno = await CajaService.getTurnoActivo(id_aserradero);
    
    if (turno) idTurnoActivo = turno.id_turno;

    // Si pagamos en EFECTIVO ahora mismo, necesitamos caja abierta
    if (metodoPagoFinal === 'EFECTIVO' && estadoFinal === 'PAGADO' && !turno) {
      return NextResponse.json({ 
        message: '⚠️ CAJA CERRADA. Abre un turno para registrar gastos pagados en efectivo.' 
      }, { status: 409 });
    }

    // --- LÓGICA DE ACUMULADOS (Tu código original) ---
    let infoAcumulado = null;
    if (concepto_general === 'PAGO DE MADERA' && documento_asociado_id && documento_asociado_tipo === 'REMISION') {
      const idRemision = parseInt(documento_asociado_id);
      const historialPagos = await prisma.reciboGasto.aggregate({
        _sum: { monto: true },
        where: {
          id_aserradero: id_aserradero,
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

    // --- CREACIÓN DEL GASTO ---
    const nuevoGasto = await prisma.reciboGasto.create({
      data: {
        id_aserradero: id_aserradero,
        id_turno: idTurnoActivo, // <--- Guardamos el turno real
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
        metodo_pago: metodoPagoFinal // <--- Guardamos método de pago
      },
    });

    // --- 3. LÓGICA DE CAJA: Registrar Salida ---
    if (metodoPagoFinal === 'EFECTIVO' && estadoFinal === 'PAGADO') {
      await CajaService.registrarMovimientoEfectivo({
        id_aserradero: id_aserradero,
        monto: montoNumerico,
        tipo: 'EGRESO_GASTO',
        descripcion: `${concepto_general}: ${concepto_detalle || 'Sin detalle'}`,
        id_recibo_gasto: nuevoGasto.id_recibo_gasto
      });
    }

    return NextResponse.json({
      ...nuevoGasto,
      meta_acumulado: infoAcumulado
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error al crear gasto:", error);
    return NextResponse.json({ message: error.message || 'Error al crear el recibo de gasto' }, { status: 500 });
  }
}