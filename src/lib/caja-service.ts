import { prisma } from "@/lib/prisma";
// Necesitamos importar el tipo para la transacción si queremos evitar 'any'
import { Prisma } from "@prisma/client"; 

export const CajaService = {
  // ---------------------------------------------------------------------------
  // OBTENER TURNO ACTIVO
  // ---------------------------------------------------------------------------
  async getTurnoActivo(id_aserradero: number) {
    return await prisma.turnoCaja.findFirst({
      where: {
        id_aserradero: Number(id_aserradero),
        fecha_cierre: null,
      },
      include: {
        usuario_apertura: true,
      }
    });
  },

  // ---------------------------------------------------------------------------
  // REGISTRAR MOVIMIENTO (Helper general)
  // ---------------------------------------------------------------------------
  async registrarMovimientoEfectivo(data: {
    id_aserradero: number;
    monto: number;
    // Agregamos los tipos nuevos al tipado para evitar errores de TS si lo usas en el futuro
    tipo: 'INGRESO_VENTA' | 'EGRESO_GASTO' | 'APERTURA' | 'RETIRO' | 'CORRECCION_INGRESO' | 'CORRECCION_EGRESO' | 'INGRESO_CANCELACION' | 'EGRESO_CANCELACION';
    descripcion: string;
    id_nota_venta?: number;
    id_recibo_gasto?: number;
  }, tx?: Prisma.TransactionClient) { // Cambiado 'any' por el tipo correcto de Prisma
    
    // Si pasamos una transacción (tx), la usamos; si no, usamos 'this' para buscar turno
    // Nota: Para buscar turno dentro de una transacción se requeriría pasar tx a getTurnoActivo también,
    // pero por simplicidad, si no hay tx, buscamos normal.
    const prismaClient = tx || prisma;
    
    // Si no viene tx, buscamos el turno primero (si viene tx, asumimos que el caller ya tiene el id_turno o lo maneja diferente)
    // En tu implementación actual, las cancelaciones insertan directo en la DB, así que esto es para compatibilidad futura.
    
    // CORRECCIÓN: Usamos const porque no se reasigna abajo
    const turno = await this.getTurnoActivo(data.id_aserradero);
    if (!turno) throw new Error("Caja cerrada.");
    const id_turno = turno.id_turno;

    return await prismaClient.movimientoCaja.create({
      data: {
        id_turno: id_turno,
        monto: data.monto,
        tipo_movimiento: data.tipo,
        descripcion: data.descripcion,
        id_nota_venta: data.id_nota_venta,
        id_recibo_gasto: data.id_recibo_gasto
      }
    });
  },

  // ---------------------------------------------------------------------------
  // DASHBOARD FINANCIERO (RESUMEN DE CAJA)
  // ---------------------------------------------------------------------------
  async obtenerResumenTurno(id_turno: number) {
    const turno = await prisma.turnoCaja.findUnique({
      where: { id_turno },
      include: {
        movimientos: { orderBy: { fecha_movimiento: 'desc' } }, 
        
        // Traemos PAGADAS (Efectivo/Banco) Y CRÉDITO para el balance
        notas_venta: { 
           where: { 
             OR: [
               { pagado: true },           // Cobrado
               { tipo_pago: 'Crédito' }    // Fiado hoy
             ]
           } 
        }, 
        recibos_gasto: { where: { estado_pago: 'PAGADO' } }
      }
    });

    if (!turno) throw new Error("Turno no encontrado");

    // 1. Dinero Físico (Solo movimientos de caja)
    const efectivoEnCaja = turno.movimientos.reduce((acc, m) => {
      const monto = Number(m.monto);
      
      // Definimos explícitamente qué movimientos SUMAN dinero a la caja
      const tiposQueSuman = [
        'APERTURA', 
        'INGRESO_VENTA', 
        'CORRECCION_INGRESO', 
        'INGRESO_CANCELACION' 
      ];

      if (tiposQueSuman.includes(m.tipo_movimiento)) {
        return acc + monto;
      } else {
        // Aquí caen: EGRESO_GASTO, RETIRO, CORRECCION_EGRESO y EGRESO_CANCELACION (Devolución venta)
        return acc - monto;
      }
    }, 0);

    // 2. Clasificar Ventas
    let ventasCobranza = 0; // Efectivo + Banco
    let ventasCredito = 0;  // Solo Crédito (Por cobrar)

    turno.notas_venta.forEach(v => {
      if (v.tipo_pago === 'Crédito') {
        ventasCredito += Number(v.total_venta);
      } else {
        ventasCobranza += Number(v.total_venta);
      }
    });

    // 3. Gastos
    const gastosTotales = turno.recibos_gasto.reduce((acc, g) => acc + Number(g.monto), 0);

    // 4. Desglose detallado
    // CORRECCIÓN: Definimos el tipo del acumulador para evitar 'any'
    const desgloseVentas = turno.notas_venta.reduce((acc: Record<string, number>, v) => {
      const metodo = v.tipo_pago || 'OTRO';
      acc[metodo] = (acc[metodo] || 0) + Number(v.total_venta);
      return acc;
    }, {});

    return {
      fondoInicial: Number(turno.fondo_inicial_efectivo),
      saldoEnCaja: efectivoEnCaja, // Lo que debe haber en el cajón físicamente
      
      balanceGlobal: {
        ventasTotales: ventasCobranza + ventasCredito, // Total vendido
        ventasCobranza, // Lo que realmente entró
        ventasCredito,  // Lo que queda por cobrar
        gastosTotales,
        utilidadOperativa: ventasCobranza - gastosTotales // Cashflow simple
      },
      
      desgloseVentas, 
      historialFisico: turno.movimientos,
    };
  }
};