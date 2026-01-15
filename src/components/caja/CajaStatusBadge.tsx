'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet } from 'lucide-react';

interface CajaStatusBadgeProps {
  isCollapsed: boolean;
  isActive?: boolean;     // Nuevo prop para saber si está seleccionado
  onClick?: () => void;   // Nuevo prop para cerrar el menú móvil al hacer click
}

export function CajaStatusBadge({ isCollapsed, isActive, onClick }: CajaStatusBadgeProps) {
  const [estado, setEstado] = useState<'LOADING' | 'ABIERTO' | 'CERRADO'>('LOADING');

  useEffect(() => {
    const token = localStorage.getItem('sessionToken');
    if (!token) {
       setEstado('CERRADO');
       return;
    }

    fetch('/api/caja?id_aserradero=1', {
      headers: { 'Authorization': `Bearer ${token}` }
    }) 
      .then(res => {
         if (res.status === 401) throw new Error('No autorizado');
         return res.json();
      })
      .then(data => {
        setEstado(data.estado === 'ABIERTO' ? 'ABIERTO' : 'CERRADO');
      })
      .catch(() => setEstado('CERRADO'));
  }, []);

  if (estado === 'LOADING') return null;

  return (
    <Link 
      href="/caja"
      onClick={onClick}
      className={`
        flex items-center px-2 py-3 rounded-md transition-colors group relative mb-1
        ${isCollapsed ? 'justify-center' : ''}
        
        /* AQUI LA MAGIA: Usamos las mismas clases que el Sidebar padre */
        ${isActive 
          ? 'bg-blue-50 text-blue-600 font-medium' 
          : 'text-gray-600 hover:bg-gray-100'
        }
      `}
    >
      <Wallet 
        className={`
          w-6 h-6 shrink-0 
          ${!isCollapsed && 'mr-3'} 
          ${isActive ? 'text-blue-600' : ''}
        `} 
      />
      
      {/* Texto con lógica de colapso idéntica al Sidebar */}
      <span className={`
        whitespace-nowrap overflow-hidden transition-all duration-300 origin-left
        ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
      `}>
        {estado === 'ABIERTO' ? 'Caja Abierta' : 'Caja Cerrada'}
      </span>

      {/* Tooltip para modo colapsado */}
      {isCollapsed && (
        <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap shadow-lg">
          {estado === 'ABIERTO' ? 'Caja Abierta' : 'Caja Cerrada'}
        </div>
      )}
    </Link>
  );
}