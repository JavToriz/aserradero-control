//src/app/api/inventario/balance-volumen/route.ts
//Endpoint de Balance (Medido vs Documentado)
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const id_aserradero = authPayload.aserraderoId;

  try {
    // 1. OBTENER DATOS DE FLUJO NORMAL (Lo que ya teníamos)
    const entradasDoc = await prisma.remision.aggregate({
      _sum: { volumen_total_m3: true }, where: { id_aserradero }
    });
    const salidasDoc = await prisma.reembarque.aggregate({
      _sum: { volumen_total_m3: true }, where: { id_aserradero }
    });

    const entradasReales = await prisma.remision.aggregate({
      _sum: { m3_recibidos_aserradero: true }, where: { id_aserradero }
    });
    const consumoProduccion = await prisma.ordenAserrado.aggregate({
        _sum: { total_m3_rollo_consumido: true }, where: { id_aserradero }
    });

    // 2. OBTENER AJUSTES MANUALES (NUEVO)
    const ajustesFisicos = await prisma.ajustePatio.aggregate({
      _sum: { volumen: true },
      where: { id_aserradero, tipo_balance: 'FISICO' }
    });

    const ajustesDocumentados = await prisma.ajustePatio.aggregate({
      _sum: { volumen: true },
      where: { id_aserradero, tipo_balance: 'DOCUMENTADO' }
    });

    // 3. CÁLCULOS FINALES
    // Convertimos null a 0
    const valEntradasDoc = entradasDoc._sum.volumen_total_m3?.toNumber() || 0;
    const valSalidasDoc = salidasDoc._sum.volumen_total_m3?.toNumber() || 0;
    const valAjustesDoc = ajustesDocumentados._sum.volumen?.toNumber() || 0;
    
    // Formula Documentada: Entradas - Salidas + Ajustes
    const stockDocumentado = valEntradasDoc - valSalidasDoc + valAjustesDoc;

    const valEntradasFis = entradasReales._sum.m3_recibidos_aserradero?.toNumber() || 0;
    const valSalidasFis = consumoProduccion._sum.total_m3_rollo_consumido?.toNumber() || 0;
    const valAjustesFis = ajustesFisicos._sum.volumen?.toNumber() || 0;

    // Formula Física: Entradas Reales - Consumo + Ajustes
    const stockFisico = valEntradasFis - valSalidasFis + valAjustesFis;
    
    const diferencia = stockFisico - stockDocumentado;

    return NextResponse.json({
      documentado: {
        entradas: valEntradasDoc,
        salidas: valSalidasDoc,
        ajustes: valAjustesDoc, // Dato útil para mostrar
        stock_actual: stockDocumentado
      },
      fisico: {
        entradas: valEntradasFis,
        salidas: valSalidasFis,
        ajustes: valAjustesFis, // Dato útil para mostrar
        stock_actual: stockFisico
      },
      diferencia: diferencia
    });

  } catch (error) {
    console.error("Error calculando balance:", error);
    return NextResponse.json({ message: 'Error interno al calcular balance' }, { status: 500 });
  }
}