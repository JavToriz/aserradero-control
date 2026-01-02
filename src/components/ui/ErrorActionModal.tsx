// components/ui/ErrorActionModal.tsx
'use client';

import { XCircle } from 'lucide-react';
import React from 'react';

interface ErrorActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
}

export const ErrorActionModal = ({ 
  isOpen, 
  onClose, 
  title = "¡Error!", 
  message = "Ha ocurrido un problema al procesar tu solicitud.", 
  buttonText = "Cerrar"
}: ErrorActionModalProps) => {
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-transparent bg-opacity-20 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full transform transition-all scale-100 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200 border-t-4 border-red-500">
        
        {/* Icono Animado / Destacado */}
        <div className="mb-4 bg-red-100 p-4 rounded-full">
          <XCircle className="text-red-600 w-16 h-16 animate-pulse" />
        </div>

        {/* Textos */}
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          {title}
        </h3>
        <p className="text-gray-500 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Botón de Acción */}
        <button
          onClick={onClose}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-lg hover:shadow-red-500/30 active:scale-95"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};