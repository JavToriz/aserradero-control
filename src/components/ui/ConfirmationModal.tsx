// src/components/ui/ConfirmationModal.tsx

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Actualizamos el tipo para permitir funciones asíncronas (Promesas)
  onConfirm: () => void | Promise<void>; 
  title: string;
  message: string;
  // --- PROPS AÑADIDAS PARA CORREGIR EL ERROR ---
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'success'; 
}

export const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  // Valores por defecto para que no rompa otros componentes que usen este modal
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  variant = "danger"
}: ConfirmationModalProps) => {
  
  if (!isOpen) return null;

  // Función simple para decidir el color del botón según la variante
  const getButtonClass = () => {
    switch(variant) {
      case 'success': return 'bg-green-600 hover:bg-green-700 text-white';
      case 'primary': return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'danger': 
      default: return 'bg-red-600 hover:bg-red-700 text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm animate-in zoom-in-95 duration-200 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{message}</p>
        
        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-semibold transition-colors text-sm"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className={`px-4 py-2 rounded-md font-semibold transition-colors text-sm shadow-sm ${getButtonClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};