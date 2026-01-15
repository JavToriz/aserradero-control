import Link from "next/link";
import { Trees, ArrowRight, BarChart3, Truck, Box } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-green-500 selection:text-black flex flex-col">
      
      {/* Fondo con efecto de gradiente sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black z-0 pointer-events-none" />

      {/* Navbar simple */}
      <nav className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <Trees className="text-green-500" />
          <span>ASERRADERO<span className="text-green-500">CONTROL</span></span>
        </div>
        <Link 
          href="/login" 
          className="text-sm font-medium text-zinc-400 hover:text-green-400 transition-colors"
        >
          Acceso Administrativo
        </Link>
      </nav>

      {/* Hero Section (Centro) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
        
        {/* Badge superior */}
        <div className="mb-8 inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-sm text-green-400 backdrop-blur-xl">
          <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
          Sistema de Gestión de Aserradero v1.0
        </div>

        {/* Título Principal */}
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6">
          Tu producción, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-700">
            bajo control total.
          </span>
        </h1>

        <p className="max-w-2xl text-lg sm:text-xl text-zinc-400 mb-10 leading-relaxed">
          Optimiza cada etapa de tu aserradero. Desde la recepción de madera en rollo hasta la venta del producto terminado. 
          Inventarios, ventas y reportes en tiempo real.
        </p>

        {/* BOTÓN GRANDE DE INICIO DE SESIÓN */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/login"
            className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-green-600 px-8 font-medium text-white shadow-[0_0_20px_rgba(22,163,74,0.5)] transition-all duration-300 hover:bg-green-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(22,163,74,0.7)]"
          >
            <span className="mr-2 text-lg">Iniciar Sesión</span>
            <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:animate-shine" />
          </Link>
        </div>

        {/* Grid de Características (Visual decorativo) */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left">
          <FeatureCard 
            icon={<Trees size={24} />} 
            title="Materia Prima" 
            desc="Control detallado de entradas de madera en rollo y proveedores." 
          />
          <FeatureCard 
            icon={<Box size={24} />} 
            title="Inventario Real" 
            desc="Monitoreo de stock de madera aserrada y triplay al instante." 
          />
          <FeatureCard 
            icon={<Truck size={24} />} 
            title="Logística y Ventas" 
            desc="Gestión fluida de remisiones, reembarques y ventas." 
          />
        </div>

      </main>

      {/* Footer simple */}
      <footer className="relative z-10 py-8 text-center text-zinc-600 text-sm">
        <p>&copy; {new Date().getFullYear()} Aserradero Control. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

// Componente pequeño para las tarjetas
function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="group p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-green-500/50 transition-colors backdrop-blur-sm">
      <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-900/20 text-green-400 group-hover:text-green-300 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}