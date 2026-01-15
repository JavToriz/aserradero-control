import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CajaService } from "@/lib/caja-service";
import { getAuthPayload } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id_aserradero = searchParams.get("id_aserradero");

  if (!id_aserradero) {
    return NextResponse.json({ error: "Falta id_aserradero" }, { status: 400 });
  }

  try {
    const turno = await CajaService.getTurnoActivo(Number(id_aserradero));

    if (!turno) {
      return NextResponse.json({ estado: "CERRADO" });
    }

    const resumen = await CajaService.obtenerResumenTurno(turno.id_turno);

    return NextResponse.json({
      estado: "ABIERTO",
      turno,
      ...resumen
    });

  } catch (error) {
    console.error("Error en GET /api/caja:", error);
    return NextResponse.json({ error: "Error interno al obtener caja" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { action, monto, id_aserradero } = body; 

  // --- CORRECCIÓN 1: Usamos 'userId' que es como se llama en tu auth.ts ---
  const idUsuarioActual = Number(authPayload.userId); 

  if (isNaN(idUsuarioActual)) {
     return NextResponse.json({ error: "Token inválido: No se pudo obtener el ID del usuario" }, { status: 401 });
  }

  // --- 1. ABRIR CAJA ---
  if (action === 'ABRIR') {
    if (!id_aserradero) return NextResponse.json({ error: "Falta id_aserradero" }, { status: 400 });

    const turnoActivo = await CajaService.getTurnoActivo(id_aserradero);
    if (turnoActivo) {
      return NextResponse.json({ error: "Ya existe un turno abierto para este aserradero" }, { status: 400 });
    }

    try {
      const nuevoTurno = await prisma.$transaction(async (tx) => {
        // --- CORRECCIÓN 2: Usamos 'connect' para evitar errores de Prisma ---
        return await tx.turnoCaja.create({
          data: {
            fondo_inicial_efectivo: monto,
            fecha_apertura: new Date(),
            
            // Relación explícita con Aserradero
            aserradero: {
                connect: { id_aserradero: Number(id_aserradero) }
            },
            
            // Relación explícita con Usuario
            usuario_apertura: {
                connect: { id_usuario: idUsuarioActual }
            },

            movimientos: {
              create: {
                tipo_movimiento: 'APERTURA',
                monto: monto,
                descripcion: 'Fondo Inicial de Caja'
              }
            }
          }
        });
      });
      return NextResponse.json(nuevoTurno);
    } catch (error) {
      console.error("Error al abrir caja:", error);
      return NextResponse.json({ error: "Error al abrir la caja" }, { status: 500 });
    }
  }

  // --- 2. CERRAR CAJA (CORTE) ---
  if (action === 'CERRAR') {
    const targetAserraderoId = id_aserradero || authPayload.aserraderoId;

    if (!targetAserraderoId) {
       return NextResponse.json({ error: "No se especificó el aserradero" }, { status: 400 });
    }

    const turno = await CajaService.getTurnoActivo(targetAserraderoId);
    if (!turno) {
      return NextResponse.json({ error: "No hay turno abierto para cerrar" }, { status: 400 });
    }

    try {
      const resumen = await CajaService.obtenerResumenTurno(turno.id_turno);
      const saldoSistema = resumen.saldoEnCaja; 
      const montoRealUsuario = Number(monto);
      const diferencia = montoRealUsuario - saldoSistema;

      const turnoCerrado = await prisma.turnoCaja.update({
        where: { id_turno: turno.id_turno },
        data: {
          fecha_cierre: new Date(),
          
          // Usamos connect también aquí para consistencia
          usuario_cierre: {
             connect: { id_usuario: idUsuarioActual }
          },
          
          monto_final_contado: montoRealUsuario,
          total_ventas_efectivo_calculado: resumen.saldoEnCaja - resumen.fondoInicial,
          total_gastos_calculado: resumen.balanceGlobal.gastosTotales,
          diferencia: diferencia,
        }
      });

      return NextResponse.json(turnoCerrado);

    } catch (error) {
      console.error("Error al cerrar caja:", error);
      return NextResponse.json({ error: "Error al realizar el corte de caja" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}