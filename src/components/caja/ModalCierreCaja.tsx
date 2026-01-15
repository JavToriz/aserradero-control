'use client';
import { useState } from 'react';
import { X, CheckCircle, AlertOctagon } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface Props {
  saldoSistema: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalCierreCaja({ saldoSistema, onClose, onSuccess }: Props) {
  const { register, watch, handleSubmit, formState: { isSubmitting } } = useForm();
  const [paso, setPaso] = useState(1);
  const [diferencia, setDiferencia] = useState(0);
  const montoIngresado = watch('monto_final');

  const onPreSubmit = (data: any) => {
    const contado = Number(data.monto_final);
    setDiferencia(contado - Number(saldoSistema));
    setPaso(2);
  };

  const onFinalSubmit = async (data: any) => {
    const token = localStorage.getItem('sessionToken'); // <--- TU LÓGICA

    try {
      const res = await fetch('/api/caja', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // <--- HEADER MANUAL
        },
        body: JSON.stringify({
          action: 'CERRAR',
          monto: Number(data.monto_final),
          id_aserradero: 1,
        }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  // ... (El resto del renderizado es idéntico al que te di antes)
  // ...
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
       {/* ... Copia el contenido del render del componente anterior ... */}
       {/* Solo cambiamos la lógica de onFinalSubmit de arriba */}
       <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Corte de Caja</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={paso === 1 ? handleSubmit(onPreSubmit) : handleSubmit(onFinalSubmit)}>
          <div className="p-6">
            
            {paso === 1 && (
              <>
                <p className="text-gray-600 mb-4 text-sm">
                  Por favor cuenta el dinero físico en la caja e ingrésalo abajo.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Contado ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      autoFocus
                      className="block w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      {...register('monto_final', { required: true })}
                    />
                  </div>
                </div>
              </>
            )}

            {paso === 2 && (
              <div className="text-center space-y-4">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${Math.abs(diferencia) < 1 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {Math.abs(diferencia) < 1 ? <CheckCircle size={24} /> : <AlertOctagon size={24} />}
                </div>
                
                <h4 className="text-lg font-bold">
                  {Math.abs(diferencia) < 1 ? '¡Corte Perfecto!' : 'Diferencia Detectada'}
                </h4>

                <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sistema espera:</span>
                    <span className="font-medium">${Number(saldoSistema).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tú contaste:</span>
                    <span className="font-medium">${Number(montoIngresado).toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-base font-bold">
                    <span>Diferencia:</span>
                    <span className={diferencia === 0 ? 'text-green-600' : diferencia > 0 ? 'text-blue-600' : 'text-red-600'}>
                      {diferencia > 0 ? '+' : ''}{diferencia.toFixed(2)}
                    </span>
                  </div>
                </div>

                {diferencia !== 0 && (
                  <p className="text-xs text-gray-500">
                    * La diferencia se registrará en el sistema para auditoría.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
            {paso === 1 ? (
              <button 
                type="submit" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Verificar
              </button>
            ) : (
              <>
                <button 
                  type="button" 
                  onClick={() => setPaso(1)} 
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Recontar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium shadow-sm"
                >
                  {isSubmitting ? 'Cerrando...' : 'Confirmar Cierre'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}