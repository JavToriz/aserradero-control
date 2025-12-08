// app/api/gastos/route.ts
// Endpoint API para gestionar los recibos y gastos del aserradero
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

// GET: Listar historial de gastos
export async function GET(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
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

    return NextResponse.json(gastos);
  } catch (error) {
    console.error("Error al obtener gastos:", error);
    return NextResponse.json({ message: 'Error al obtener gastos' }, { status: 500 });
  }
}

// POST: Crear nuevo recibo de gasto
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
      documento_asociado_tipo
    } = body;

    if (!id_beneficiario || !monto || !concepto_general) {
      return NextResponse.json({ message: 'Faltan datos requeridos' }, { status: 400 });
    }

    const fechaISO = new Date(`${fecha_emision}T12:00:00Z`).toISOString();

    // --- LÓGICA DE ESTADO INTELIGENTE ---
    // Si es FLETE, nace como PENDIENTE (deuda).
    // Si es cualquier otro gasto (nómina, insumos), asumimos que se paga al momento (PAGADO).
    const estadoInicial = concepto_general === 'FLETE' ? 'PENDIENTE' : 'PAGADO';

    const nuevoGasto = await prisma.reciboGasto.create({
      data: {
        id_aserradero: authPayload.aserraderoId,
        id_turno: null, 
        fecha_emision: fechaISO,
        id_beneficiario: parseInt(id_beneficiario),
        id_responsable_usuario: authPayload.userId,
        monto: parseFloat(monto),
        monto_letra: monto_letra,
        concepto_general: concepto_general,
        concepto_detalle: concepto_detalle || null,
        documento_asociado_id: documento_asociado_id ? parseInt(documento_asociado_id) : null,
        documento_asociado_tipo: documento_asociado_tipo || null,
        estado_pago: estadoInicial, // <-- Aquí aplicamos la lógica
      },
    });

    return NextResponse.json(nuevoGasto, { status: 201 });

  } catch (error: any) {
    console.error("Error al crear gasto:", error);
    return NextResponse.json({ message: 'Error al crear el recibo de gasto' }, { status: 500 });
  }
}