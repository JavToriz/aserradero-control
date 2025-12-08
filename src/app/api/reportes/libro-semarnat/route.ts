// app/api/reportes/libro-semarnat/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const fechaInicio = searchParams.get('inicio');
  const fechaFin = searchParams.get('fin');
  const genero = searchParams.get('genero'); // Opcional: Filtrar por Pino, Encino, etc.

  if (!fechaInicio || !fechaFin) {
    return NextResponse.json({ message: 'Rango de fechas requerido' }, { status: 400 });
  }

  // Ajuste de fechas para incluir el día completo
  const start = new Date(`${fechaInicio}T00:00:00Z`);
  const end = new Date(`${fechaFin}T23:59:59Z`);

  try {
    const aserraderoId = authPayload.aserraderoId;

    // 1. Obtener ENTRADAS (Remisiones)
    // Usamos 'm3_recibidos_aserradero' si existe, si no 'volumen_total_m3'
    // Nota: El filtro de género se aplica si se envió
    const whereRemision: any = {
      id_aserradero: aserraderoId,
      fecha_emision: { gte: start, lte: end },
    };
    if (genero && genero !== 'TODOS') {
      whereRemision.genero_madera = { contains: genero, mode: 'insensitive' };
    }

    const remisiones = await prisma.remision.findMany({
      where: whereRemision,
      include: {
        predio_origen: { select: { nombre_predio: true, clave_rfn: true } }, // Datos del ejido
        titular: { select: { nombre_completo: true } }
      },
      orderBy: { fecha_emision: 'asc' }
    });

    // 2. Obtener SALIDAS (Reembarques y Ventas)
    // Aquí asumimos que Reembarques son salidas de materia prima o producto
    // Y Ventas son salidas de producto terminado.
    
    // Buscar Reembarques
    const reembarques = await prisma.reembarque.findMany({
      where: {
        id_aserradero: aserraderoId,
        fecha_emision: { gte: start, lte: end },
        // genero_madera: ... (si aplicara)
      },
      include: {
        destinatario: { select: { nombre_completo: true } }
      },
      orderBy: { fecha_emision: 'asc' }
    });

    // Buscar Ventas (Notas de Venta) - Opcional si solo usas Reembarques para SEMARNAT
    // Para este ejemplo, nos centraremos en Reembarques como salidas oficiales reportables
    // Si necesitas Ventas, se pueden agregar aquí.

    // 3. Procesar Datos para la Tabla Unificada
    const filas = [];

    // Procesar Entradas
    let totalVolumenEntrada = 0;
    for (const r of remisiones) {
      // Prioridad: Medida real > Medida documentada
      const cantidad = Number(r.m3_recibidos_aserradero) > 0 
        ? Number(r.m3_recibidos_aserradero) 
        : Number(r.volumen_total_m3);
      
      totalVolumenEntrada += cantidad;

      filas.push({
        tipo: 'ENTRADA',
        fecha: r.fecha_emision,
        documento: 'REMISION',
        folio: r.folio_progresivo,
        procedencia_destino: r.predio_origen?.nombre_predio || 'Desconocido',
        codigo_identificacion: r.predio_origen?.clave_rfn || 'S/N', // Clave RFN del ejido
        entrada: cantidad,
        salida: 0
      });
    }

    // Procesar Salidas
    let totalVolumenSalida = 0;
    for (const s of reembarques) {
      const cantidad = Number(s.volumen_total_m3) || 0; // O cantidad amparada
      totalVolumenSalida += cantidad;

      filas.push({
        tipo: 'SALIDA',
        fecha: s.fecha_emision,
        documento: 'REEMBARQUE',
        folio: s.folio_progresivo,
        procedencia_destino: s.destinatario?.nombre_completo || 'Público General',
        codigo_identificacion: '-', // Salidas no siempre llevan RFN de destino
        entrada: 0,
        salida: cantidad
      });
    }

    // Ordenar cronológicamente
    filas.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // 4. Cálculos Finales (La Fórmula)
    // EXISTENCIA INICIAL: Para hacerlo simple en este MVP, el usuario la ingresará manualmente en el front,
    // o podríamos calcularla si tuviéramos un "Corte de Inventario" previo.
    // Aquí devolvemos los totales calculados del periodo.
    
    const volumenTransformado = totalVolumenEntrada * 0.50; // Coeficiente 50%

    return NextResponse.json({
      filas,
      totales: {
        entradaBruta: totalVolumenEntrada,
        entradaTransformada: volumenTransformado, // Ya con el 50%
        salidaTotal: totalVolumenSalida
      }
    });

  } catch (error) {
    console.error("Error generando libro:", error);
    return NextResponse.json({ message: 'Error al generar el libro' }, { status: 500 });
  }
}