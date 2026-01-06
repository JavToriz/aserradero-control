'use client';

import { useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';

interface AjustePatioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AjustePatioModal({ isOpen, onClose, onSuccess }: AjustePatioModalProps) {
  const [tipoBalance, setTipoBalance] = useState('FISICO');
  const [tipoAjuste, setTipoAjuste] = useState('INICIAL');
  const [volumen, setVolumen] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/inventario/ajuste-patio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('sessionToken')}` },
        body: JSON.stringify({
          tipo_balance: tipoBalance,
          tipo_ajuste: tipoAjuste,
          volumen: parseFloat(volumen), // Puede ser negativo si el usuario escribe "-"
          observaciones
        })
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert('Error al guardar el ajuste');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gray-100 px-6 py-4 flex justify-between items-center border-b">
          <h3 className="text-lg font-bold text-gray-800">Realizar Ajuste de Patio</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Alerta Informativa */}
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex gap-2 items-start">
             <AlertTriangle size={16} className="mt-0.5 shrink-0" />
             <p>Este movimiento modificará directamente el saldo de inventario sin requerir Remisión ni Orden de Producción.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Inventario a Ajustar</label>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                    type="button"
                    onClick={() => setTipoBalance('FISICO')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${tipoBalance === 'FISICO' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Medido (Real)
                </button>
                <button
                    type="button"
                    onClick={() => setTipoBalance('DOCUMENTADO')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${tipoBalance === 'DOCUMENTADO' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Documentado (Oficial)
                </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <select 
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={tipoAjuste}
                    onChange={(e) => setTipoAjuste(e.target.value)}
                >
                    <option value="INICIAL">Inventario Inicial</option>
                    <option value="AUDITORIA">Ajuste por Auditoría</option>
                    <option value="MERMA">Merma / Desperdicio</option>
                    <option value="CORRECCION">Corrección de Error</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Volumen (m³)</label>
                <input 
                    type="number" 
                    step="0.001"
                    placeholder="Ej: 12.5 o -5.0"
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                    value={volumen}
                    onChange={(e) => setVolumen(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Use negativo (-) para restar.</p>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
             <textarea 
                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                rows={2}
                placeholder="Explique la razón del ajuste..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
             />
          </div>

          <div className="pt-2 flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50"
            >
                <Save size={16} />
                {isSubmitting ? 'Guardando...' : 'Guardar Ajuste'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}