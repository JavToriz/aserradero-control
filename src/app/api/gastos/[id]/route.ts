//app/api/gastos/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

interface Params {
  params: Promise<{ id: string }>; // Soporte para Next.js 15
}

// PUT: Actualizar un gasto existente (ej. cambiar estado de pago)
export async function PUT(req: NextRequest, { params }: Params) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const id_gasto = parseInt(id, 10);
    const body = await req.json();
    
    // Extraemos los campos que permitimos actualizar
    const { estado_pago } = body;

    // Validación básica
    if (!estado_pago) {
      return NextResponse.json({ message: 'Faltan datos para actualizar' }, { status: 400 });
    }

    const gastoActualizado = await prisma.reciboGasto.update({
      where: {
        id_recibo_gasto: id_gasto,
        id_aserradero: authPayload.aserraderoId, // Seguridad: asegurar que pertenece al aserradero
      },
      data: {
        estado_pago: estado_pago,
      },
    });

    return NextResponse.json(gastoActualizado);

  } catch (error: any) {
    // Si el registro no existe
    if (error.code === 'P2025') {
        return NextResponse.json({ message: 'Gasto no encontrado' }, { status: 404 });
    }
    console.error("Error al actualizar gasto:", error);
    return NextResponse.json({ message: 'Error al actualizar el gasto' }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// DELETE: Cancelar/Eliminar Gasto (Versión Depuración)
// -----------------------------------------------------------------------------
export async function DELETE(req: NextRequest, { params }: Params) {
  // LOG 1: Verificar que entra a la función
  console.log("--> Iniciando DELETE Gasto");
  
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    // Await params por si estás en Next.js 15
    const { id } = await params;
    console.log("--> ID recibido:", id);

    const id_gasto = parseInt(id, 10);
    if (isNaN(id_gasto)) {
        return NextResponse.json({ message: 'ID de gasto inválido' }, { status: 400 });
    }

    // 1. Verificar existencia
    const gastoExistente = await prisma.reciboGasto.findUnique({
      where: { id_recibo_gasto: id_gasto },
    });

    if (!gastoExistente) {
      return NextResponse.json({ message: 'El gasto ya fue eliminado anteriormente.' }, { status: 200 });
    }

    if (gastoExistente.id_aserradero !== authPayload.aserraderoId) {
      return NextResponse.json({ message: 'Acceso denegado a este gasto' }, { status: 403 });
    }

    // 2. Transacción
    await prisma.$transaction(async (tx) => {
      
      // Acceder a metodo_pago de forma segura (por si no está en tu schema generado aún)
      // Usamos 'as any' para evitar error de TypeScript si el campo es nuevo
      const metodoPago = (gastoExistente as any).metodo_pago || 'EFECTIVO';
      const fuePagado = gastoExistente.estado_pago === 'PAGADO';

      console.log(`--> Gasto encontrado. Estado: ${gastoExistente.estado_pago}, Método: ${metodoPago}`);

      // Revertir dinero si aplica
      if (fuePagado && metodoPago === 'EFECTIVO') {
        const turnoActivo = await tx.turnoCaja.findFirst({
            where: { 
                id_aserradero: authPayload.aserraderoId, 
                fecha_cierre: null 
            },
            orderBy: { fecha_apertura: 'desc' }
        });

        if (turnoActivo) {
            console.log("--> Reembolsando a caja turno:", turnoActivo.id_turno);
            await tx.movimientoCaja.create({
                data: {
                    id_turno: turnoActivo.id_turno,
                    tipo_movimiento: 'INGRESO_CANCELACION',
                    monto: gastoExistente.monto,
                    descripcion: `Cancelación Gasto: ${gastoExistente.concepto_general}`,
                    fecha_movimiento: new Date()
                }
            });
        } else {
            console.log("--> Advertencia: No hay turno abierto para regresar el dinero, se elimina el gasto de todas formas.");
        }
      }

      // Eliminar
      await tx.reciboGasto.delete({
        where: { id_recibo_gasto: id_gasto },
      });

    }, {
        maxWait: 5000,
        timeout: 20000 
    });

    console.log("--> Gasto eliminado con éxito");
    return NextResponse.json({ message: 'Gasto eliminado correctamente' });

  } catch (error: any) {
    // LOG ERROR: Esto aparecerá en tu terminal si falla
    console.error("❌ Error CRÍTICO al eliminar gasto:", error);
    return NextResponse.json({ message: error.message || 'Error interno al eliminar' }, { status: 500 });
  }
}