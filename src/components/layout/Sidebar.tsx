// components/layout/Sidebar.tsx
import Link from 'next/link';
// ... (importa los íconos como antes)
import { Home, ArrowUpCircle, ArrowDownCircle, Box, Users, Truck, Boxes, Store, Receipt} from 'lucide-react';
import  LogoutButton  from '../ui/LogoutButton';

const menuItems = [
  { name: 'Registrar Entrada', href: '/registrar-entrada', icon: ArrowUpCircle, color: 'text-green-500' },
  // ... (los demás items del menú)
  { name: 'Productos', href: '/productos', icon: Home },
  { name: 'Inventario', href: '/produccion', icon: Boxes },
  { name: 'Reportes', href: '/reportes/semarnat', icon: Boxes },
  { name: 'Ventas', href: '/ventas', icon: Store },
  { name: 'Gastos', href: '/gastos', icon: Receipt },
];

export function Sidebar() {
  return (
    // CAMBIO: Ancho base para móvil (solo íconos) y ancho mayor para pantallas medianas+
    <aside className="w-20 bg-white border-r border-gray-200 flex flex-col items-center md:w-64 md:items-stretch transition-all duration-300">
      <div className="h-16 flex items-center justify-center border-b border-gray-200 w-full">
        {/* CAMBIO: Mostramos un ícono en móvil y el texto completo en pantallas medianas+ */}
        <h1 className="text-xl font-bold text-gray-800">
          <span className="md:hidden">🌲</span>
          <span className="hidden md:inline">🌲 Aserradero Control</span>
        </h1>
      </div>
      <nav className="flex-grow p-2 md:p-4 mt-4">
        <ul>
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="flex items-center justify-center md:justify-start px-2 py-3 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
              >
                <item.icon className={`w-6 h-6 md:mr-3 ${item.color || ''}`} />
                {/* CAMBIO: El texto del nombre está oculto en móvil y visible en pantallas medianas+ */}
                <span className="hidden md:inline">{item.name}</span>
                
              </Link>
              
            </li>
          ))}
          <LogoutButton />
        </ul>
      </nav>
    </aside>
  );
}