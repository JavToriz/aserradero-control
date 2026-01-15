'use client';
import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, History, AlertTriangle } from 'lucide-react';
import { ModalCierreCaja } from './ModalCierreCaja'; // Lo creamos abajo

export function VistaCajaAbierta({ data, onRefresh }: { data: any, onRefresh: () => void }) {
  const [showCierreModal, setShowCierreModal] = useState(false);
  
  const { turno, saldoEnCaja, balanceGlobal, historialFisico, desgloseVentas } = data;

  return (
    <div className="space-y-6">
      {/* 1. KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TARJETA 1: Saldo Físico (Lo más importante para el cajero) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Efectivo en Caja (Teórico)</p>
            <h3 className="text-3xl font-bold text-gray-800">
              ${Number(saldoEnCaja).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-blue-600 bg-blue-50 w-fit px-3 py-1 rounded-full text-xs font-medium">
            <Wallet size={14} />
            Dinero Físico
          </div>
        </div>

        {/* TARJETA 2: Ventas Totales (Global) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <p className="text-sm font-medium text-gray-500 mb-1">Ventas Totales (Hoy)</p>
           <h3 className="text-2xl font-bold text-green-600">
             +${Number(balanceGlobal.ventasTotales).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
           </h3>
           <p className="text-xs text-gray-400 mt-2">Incluye Efectivo, Transferencias, etc.</p>
        </div>

        {/* TARJETA 3: Gastos Totales */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <p className="text-sm font-medium text-gray-500 mb-1">Gastos Totales (Hoy)</p>
           <h3 className="text-2xl font-bold text-red-600">
             -${Number(balanceGlobal.gastosTotales).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
           </h3>
           <p className="text-xs text-gray-400 mt-2">Salidas registradas</p>
        </div>
      </div>
        {/* --- NUEVO: BARRA DE DESGLOSE DE VENTAS --- */}
      {desgloseVentas && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-6 items-center">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Desglose de Ingresos:</span>
          
          {Object.entries(desgloseVentas).map(([metodo, monto]: any) => (
            <div key={metodo} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${metodo === 'Efectivo' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
              <span className="text-sm text-gray-600">{metodo}:</span>
              <span className="font-bold text-gray-800">${Number(monto).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}


      {/* 2. Historial de Movimientos Físicos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <History size={18} />
            Movimientos de Efectivo
          </h3>
          <span className="text-xs text-gray-500">Últimos movimientos</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 font-medium border-b bg-white">
              <tr>
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historialFisico.map((mov: any) => (
                <tr key={mov.id_movimiento} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(mov.fecha_movimiento).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{mov.descripcion || 'Sin descripción'}</td>
                  <td className="px-4 py-3">
                    <BadgeTipo tipo={mov.tipo_movimiento} />
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${
                    ['APERTURA', 'INGRESO_VENTA', 'CORRECCION_INGRESO'].includes(mov.tipo_movimiento) 
                    ? 'text-green-600' 
                    : 'text-red-600'
                  }`}>
                    {['EGRESO_GASTO', 'RETIRO', 'CORRECCION_EGRESO'].includes(mov.tipo_movimiento) ? '-' : '+'}
                    ${Number(mov.monto).toFixed(2)}
                  </td>
                </tr>
              ))}
              {historialFisico.length === 0 && (
                 <tr>
                   <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                     No hay movimientos registrados aún.
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Botón de Cierre */}
      <div className="flex justify-end pt-4">
        <button
          onClick={() => setShowCierreModal(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg shadow-sm font-medium transition-colors"
        >
          <AlertTriangle size={18} />
          Realizar Corte de Caja
        </button>
      </div>

      {/* Modal de Cierre */}
      {showCierreModal && (
        <ModalCierreCaja 
          saldoSistema={saldoEnCaja} 
          onClose={() => setShowCierreModal(false)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}

// Subcomponente simple para badges
function BadgeTipo({ tipo }: { tipo: string }) {
  const styles: any = {
    'APERTURA': 'bg-blue-100 text-blue-800',
    'INGRESO_VENTA': 'bg-green-100 text-green-800',
    'EGRESO_GASTO': 'bg-red-100 text-red-800',
    'CORRECCION_INGRESO': 'bg-purple-100 text-purple-800',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[tipo] || 'bg-gray-100 text-gray-800'}`}>
      {tipo.replace(/_/g, ' ')}
    </span>
  );
}