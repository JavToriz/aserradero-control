// src/components/ui/ModalContainer.tsx
// componente para envolver modales con un diseño consistente (como el form para editar)
import { X } from 'lucide-react';

interface ModalContainerProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const ModalContainer = ({ title, onClose, children }: ModalContainerProps) => {
  return (
    // Fondo semi-transparente
    <div 
      className="fixed inset-0 bg-transparent bg-opacity-10 flex justify-center items-center z-50 p-4 backdrop-filter backdrop-blur-sm"
      onClick={onClose} // Cierra el modal si se hace clic fuera de él
    >
      {/* Contenedor del modal */}
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
      >
        {/* Encabezado del modal */}
        <header className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 rounded-full p-1 transition-colors">
            <X size={24} />
          </button>
        </header>

        {/* Contenido principal del modal (el formulario va aquí) */}
        <main className="p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};