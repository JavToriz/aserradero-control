'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Home, ArrowUpCircle, Boxes, Store, Receipt, 
  Menu, X, ChevronLeft, ChevronRight, 
  Package, CircleDollarSign, FileText, ShoppingCart, Layers
} from 'lucide-react';
import LogoutButton from '../ui/LogoutButton';

const menuItems = [
  { name: 'Productos', href: '/productos', icon: Package },
  { name: 'Precios', href: '/configuracion/precios', icon: CircleDollarSign },
  { name: 'Inventario / Madera', href: '/produccion', icon: Boxes },
  { name: 'Inventario / Triplay', href: '/inventario-comercial', icon: Layers },
  { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
  { name: 'Gastos', href: '/gastos', icon: Receipt },
  { name: 'Reportes', href: '/reportes/semarnat', icon: FileText }
];

export function Sidebar() { 
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* BOTÓN FLOTANTE (MÓVIL) */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md border border-gray-200 text-gray-700 hover:bg-gray-100"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* OVERLAY OSCURO (MÓVIL) */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`
          fixed md:static top-0 left-0 z-50 bg-white border-r border-gray-200
          flex flex-col 
          /* Altura dinámica para móviles modernos (evita que la barra de navegación del celular tape el botón) */
          h-[100dvh] md:h-screen 
          
          /* Evita scroll horizontal indeseado */
          overflow-x-hidden
          
          transition-all duration-300 ease-in-out
          
          /* Lógica de ancho y posición */
          ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:shadow-none'}
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
          w-64
        `}
      >
        
        {/* --- HEADER --- */}
        {/* flex-shrink-0 evita que el header se aplaste si falta espacio vertical */}
        <div className={`
            h-16 flex items-center flex-shrink-0 border-b border-gray-200 w-full relative 
            ${isCollapsed ? 'justify-center' : 'justify-between px-4'}
        `}>
          <h1 className="text-xl font-bold text-gray-800 whitespace-nowrap overflow-hidden">
            {isCollapsed ? (
              <span>🌲</span>
            ) : (
              <span className="flex items-center gap-2">
                🌲 Aserradero
                <button onClick={() => setIsMobileOpen(false)} className="md:hidden ml-auto p-1">
                   <X className="w-5 h-5 text-gray-500" />
                </button>
              </span>
            )}
          </h1>

          {/* Botón Colapsar (Desktop) */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:bg-gray-100 absolute -right-3 top-1/2 -translate-y-1/2 z-50"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* --- NAV (SCROLLABLE AREA) --- */}
        {/* flex-1 hace que ocupe todo el espacio disponible. overflow-y-auto permite scroll solo aquí */}
        <nav className="flex-1 p-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center px-2 py-3 text-gray-600 rounded-md hover:bg-gray-100 transition-colors group relative
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <item.icon className={`w-6 h-6 shrink-0 ${item.color || ''} ${!isCollapsed && 'mr-3'}`} />
                  
                  {/* Control estricto del ancho del texto para evitar scroll */}
                  <span className={`
                    whitespace-nowrap overflow-hidden transition-all duration-300 origin-left
                    ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
                  `}>
                    {item.name}
                  </span>

                  {/* Tooltip Desktop */}
                  {isCollapsed && (
                    <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap shadow-lg">
                      {item.name}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* --- FOOTER (LOGOUT) --- */}
        {/* flex-shrink-0 asegura que el botón de logout nunca se oculte ni se aplaste */}
        <div className="p-2 border-t border-gray-200 flex-shrink-0 bg-white">
           <div className={isCollapsed ? 'flex justify-center' : ''}>
              {/* Pasamos prop al componente para que oculte su texto si es necesario */}
              <LogoutButton isCollapsed={isCollapsed} /> 
           </div>
        </div>
      </aside>
    </>
  );
}