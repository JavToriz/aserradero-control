'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Menu, X, ChevronLeft, ChevronRight, ChevronDown, Check, Loader2,
  Package, CircleDollarSign, FileText, ShoppingCart, 
  Layers, Boxes, Receipt, FolderOpen 
} from 'lucide-react'; // Agregué FolderOpen y ChevronDown
import LogoutButton from '../ui/LogoutButton';
import { CajaStatusBadge } from '../caja/CajaStatusBadge';
import { supabase } from '@/lib/supabase';

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch(e) {
    return null;
  }
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

// DEFINICIÓN DEL MENÚ CON SOPORTE PARA SUB-MENÚS
const menuItems = [
  { name: 'Productos', href: '/productos', icon: Package },
  { name: 'Precios', href: '/configuracion/precios', icon: CircleDollarSign },
  { name: 'Inventario / Madera', href: '/produccion', icon: Boxes },
  { name: 'Inventario / Productos', href: '/inventario-comercial', icon: Layers },
  
  // --- AQUÍ ESTÁ TU NUEVO GRUPO ---
  { 
    name: 'Documentos', 
    icon: FolderOpen, 
    // href lo dejamos vacío o null porque es un contenedor
    submenu: [
      { name: 'Remisiones', href: '/remisiones' },
      { name: 'Reembarques', href: '/reembarques' },
    ]
  },
  // ---------------------------------
  { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
  { name: 'Gastos', href: '/gastos', icon: Receipt },
  { name: 'Reportes', href: '/reportes/semarnat', icon: FileText }
];

export function Sidebar() { 
  const pathname = usePathname();
  const router = useRouter();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Estado para el selector de perfiles (Aserraderos)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [selectedAserradero, setSelectedAserradero] = useState({ id: 0, name: 'Cargando...' });
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [aserraderos, setAserraderos] = useState<any[]>([]);
  const [loadingAserraderos, setLoadingAserraderos] = useState(true);
  const [selectingId, setSelectingId] = useState<number | null>(null);

  // Cargar aserraderos al montar
  useEffect(() => {
    const fetchAserraderos = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch('/api/auth/session', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (res.ok) {
          const data = await res.json();
          const list = data.aserraderos || [];
          setAserraderos(list);

          // Buscar el aserradero actual desde el token
          const token = localStorage.getItem('sessionToken') || getCookie('sessionToken');
          if (token) {
             const payload = parseJwt(token);
             if (payload && payload.aserraderoId) {
                const current = list.find((a: any) => a.id_aserradero === payload.aserraderoId);
                if (current) {
                   setSelectedAserradero({ id: current.id_aserradero, name: current.nombre });
                }
             }
          } else if (list.length > 0) {
             setSelectedAserradero({ id: list[0].id_aserradero, name: list[0].nombre });
          }
        }
      } catch (err) {
        console.error('Error al cargar aserraderos:', err);
      } finally {
        setLoadingAserraderos(false);
      }
    };
    fetchAserraderos();
  }, []);

  const handleSelectSucursal = async (id_aserradero: number, nombre: string) => {
    setSelectingId(id_aserradero);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión expirada");

      const res = await fetch('/api/auth/select-sawmill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_aserradero,
          supabase_token: session.access_token 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem('sessionToken', data.sessionToken); 
      document.cookie = `sessionToken=${data.sessionToken}; path=/; max-age=14400; SameSite=Lax`;

      setSelectedAserradero({ id: id_aserradero, name: nombre });
      setIsProfileMenuOpen(false);
      
      // Recargar completamente la página para forzar que toda la app use el nuevo token y actualice su estado
      window.location.reload(); 
    } catch (err: any) {
      alert(err.message || 'Error al cambiar de sucursal');
    } finally {
      setSelectingId(null);
    }
  };

  // Cerrar menú de perfiles al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Estado para controlar qué menús están abiertos
  // Iniciamos vacío, pero podríamos checar la URL para abrir el correcto al inicio
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  
  const isCajaActive = pathname === '/caja' || pathname.startsWith('/caja');

  // EFECTO: Abrir automáticamente el menú si estoy en una ruta hija al cargar la página
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.submenu) {
        // Si alguna de las hijas es la ruta actual
        const isChildActive = item.submenu.some(sub => pathname.startsWith(sub.href));
        if (isChildActive) {
          setOpenSubmenus(prev => [...prev, item.name]);
        }
      }
    });
  }, [pathname]);

  // FUNCIÓN: Manejar el click en un grupo (Padre)
  const handleGroupClick = (itemName: string) => {
    // 1. Si está colapsado, lo abrimos para que el usuario vea qué pasa
    if (isCollapsed) setIsCollapsed(false);

    // 2. Toggle del acordeón
    setOpenSubmenus(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName) // Cerrar
        : [...prev, itemName] // Abrir
    );
  };

  return (
    <>
      {/* --- MOBILE TOGGLES (Igual que antes) --- */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md border border-gray-200 text-gray-700 hover:bg-gray-100"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside 
        className={`
          fixed md:static top-0 left-0 z-50 bg-white border-r border-gray-200
          flex flex-col h-[100dvh] md:h-screen overflow-x-hidden
          transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:shadow-none'}
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
          w-64
        `}
      >
        
        {/* HEADER */}
        <div className={`
            h-16 flex items-center flex-shrink-0 border-b border-gray-200 w-full relative 
            ${isCollapsed ? 'justify-center' : 'justify-between px-4'}
        `}>
          {isCollapsed ? (
            <span 
              className="text-xl font-bold cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => { setIsCollapsed(false); setIsProfileMenuOpen(true); }}
              title={selectedAserradero.name}
            >
              🌲
            </span>
          ) : (
            <div className="relative w-full flex items-center pr-2" ref={profileMenuRef}>
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center justify-between w-full p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-xl shrink-0">🌲</span>
                  <span className="font-bold text-gray-800 truncate select-none leading-none pt-0.5">
                    {selectedAserradero.name}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ml-1 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <button onClick={() => setIsMobileOpen(false)} className="md:hidden ml-1 p-1 flex-shrink-0">
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* Menú Desplegable de Perfiles */}
              {isProfileMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-[calc(100%+0.5rem)] min-w-[220px] bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-[60]">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Cambiar Sucursal
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {loadingAserraderos ? (
                      <div className="p-3 text-sm text-gray-500 text-center flex justify-center items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
                      </div>
                    ) : aserraderos.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500 text-center">
                        No hay sucursales
                      </div>
                    ) : (
                      aserraderos.map(aserradero => (
                        <button
                          key={aserradero.id_aserradero}
                          onClick={() => handleSelectSucursal(aserradero.id_aserradero, aserradero.nombre)}
                          disabled={selectingId !== null}
                          className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between transition-colors
                            ${selectedAserradero.id === aserradero.id_aserradero ? 'text-blue-600 bg-blue-50/50' : 'text-gray-700 hover:bg-gray-50'}
                            ${selectingId === aserradero.id_aserradero ? 'opacity-70 pointer-events-none' : ''}
                          `}
                        >
                          <span className="truncate pr-2 font-medium flex-1">{aserradero.nombre}</span>
                          {selectingId === aserradero.id_aserradero ? (
                            <Loader2 className="w-4 h-4 flex-shrink-0 text-blue-600 animate-spin" />
                          ) : selectedAserradero.id === aserradero.id_aserradero ? (
                            <Check className="w-4 h-4 flex-shrink-0 text-blue-600" />
                          ) : null}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:bg-gray-100 absolute -right-0.5 top-1/2 -translate-y-1/2 z-50"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
        
        {/* NAV */}
        <nav className="flex-1 p-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          
          <CajaStatusBadge isCollapsed={isCollapsed} isActive={isCajaActive} onClick={() => setIsMobileOpen(false)} />

          <ul className="space-y-1">
            {menuItems.map((item) => {
              
              // LÓGICA: ¿Es un item simple o un grupo?
              const isGroup = !!item.submenu;
              
              // Estado Activo
              // Si es grupo: activo si alguna hija coincide. Si es simple: activo si href coincide.
              const isActive = isGroup 
                ? item.submenu.some(sub => pathname.startsWith(sub.href))
                : pathname === item.href || (pathname.startsWith(item.href || '') && item.href !== '/');
              
              // Estado Abierto (Solo para grupos)
              const isOpen = openSubmenus.includes(item.name);

              // ------------------------------------------
              // RENDERIZADO SI ES UN GRUPO (DOCUMENTOS)
              // ------------------------------------------
              if (isGroup) {
                return (
                  <li key={item.name}>
                    {/* Botón Padre */}
                    <button
                      onClick={() => handleGroupClick(item.name)}
                      className={`
                        w-full flex items-center px-2 py-3 rounded-md transition-colors group relative
                        ${isCollapsed ? 'justify-center' : 'justify-between'}
                        ${isActive 
                          ? 'bg-blue-50 text-blue-700' // Estilo activo del padre
                          : 'text-gray-600 hover:bg-gray-100'
                        }
                      `}
                    >
                      <div className="flex items-center overflow-hidden">
                         <item.icon className={`w-6 h-6 shrink-0 ${!isCollapsed && 'mr-3'} ${isActive ? 'text-blue-600' : ''}`} />
                         <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                           {item.name}
                         </span>
                      </div>
                      
                      {/* Flechita (Solo visible si no está colapsado) */}
                      {!isCollapsed && (
                        <ChevronDown 
                          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                        />
                      )}

                      {/* Tooltip Padre (Colapsado) */}
                      {isCollapsed && (
                         <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap shadow-lg">
                           {item.name}
                         </div>
                      )}
                    </button>

                    {/* Hijos (Submenú) */}
                    {/* Renderizamos solo si está abierto Y el sidebar NO está colapsado (o si está colapsado pero lo expandimos en el click) */}
                    <div className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${isOpen && !isCollapsed ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}
                    `}>
                      <ul className="pl-11 space-y-1 border-l-2 border-gray-100 ml-4"> 
                        {item.submenu.map(subItem => {
                           const isSubActive = pathname === subItem.href;
                           return (
                             <li key={subItem.name}>
                               <Link
                                 href={subItem.href}
                                 onClick={() => setIsMobileOpen(false)}
                                 className={`
                                   block py-2 px-2 text-sm rounded-md transition-colors
                                   ${isSubActive 
                                     ? 'text-blue-600 font-medium bg-blue-50/50' 
                                     : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                   }
                                 `}
                               >
                                 {subItem.name}
                               </Link>
                             </li>
                           )
                        })}
                      </ul>
                    </div>
                  </li>
                );
              }

              // ------------------------------------------
              // RENDERIZADO SI ES ITEM SIMPLE (NORMAL)
              // ------------------------------------------
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      flex items-center px-2 py-3 rounded-md transition-colors group relative
                      ${isCollapsed ? 'justify-center' : ''}
                      ${isActive 
                        ? 'bg-blue-50 text-blue-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <item.icon className={`w-6 h-6 shrink-0 ${!isCollapsed && 'mr-3'} ${isActive ? 'text-blue-600' : ''}`} />
                    <span className={`
                      whitespace-nowrap overflow-hidden transition-all duration-300 origin-left
                      ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
                    `}>
                      {item.name}
                    </span>
                    {isCollapsed && (
                      <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap shadow-lg">
                        {item.name}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* FOOTER */}
        <div className="p-2 border-t border-gray-200 flex-shrink-0 bg-white">
           <div className={isCollapsed ? 'flex justify-center' : ''}>
              <LogoutButton isCollapsed={isCollapsed} /> 
           </div>
        </div>
      </aside>
    </>
  );
}