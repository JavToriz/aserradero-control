// src/components/ventas/ImprimirTicketModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Printer, Loader2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print'; 

// Reutilizamos la interfaz de tu configuración de empresa
export interface DatosEmpresaTicket {
  nombre: string;
  propietario: string;
  rfc: string;
  telefonos: string;
  direccion_completa: string; 
  logo_url: string;
}

interface ImprimirTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  venta: any;
}

export const ImprimirTicketModal = ({ isOpen, onClose, venta }: ImprimirTicketModalProps) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  
  // --- NUEVOS ESTADOS PARA DATOS DE LA EMPRESA ---
  const [empresaConfig, setEmpresaConfig] = useState<DatosEmpresaTicket | null>(null);
  const [loading, setLoading] = useState(false);

  // --- LÓGICA DE CARGA DE CONFIGURACIÓN (Igual que en Nota de Venta) ---
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const fetchConfig = async () => {
        try {
          const token = localStorage.getItem('sessionToken'); 
          
          if (!token) {
             console.error("No se encontró sessionToken");
             setLoading(false);
             return;
          }

          const res = await fetch('/api/configuracion/aserradero', {
             headers: { 'Authorization': `Bearer ${token}` }
          });

          if (res.ok) {
            const data = await res.json();
            setEmpresaConfig(data);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };

      fetchConfig();
    }
  }, [isOpen]);

  // --- LÓGICA DE IMPRESIÓN ---
  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `Ticket_${venta?.folio_nota || 'Venta'}`,
  });

  if (!isOpen || !venta) return null;

  // Valores por defecto en caso de que la API falle (para que nunca se rompa el ticket)
  const emp = empresaConfig || {
    nombre: "Mi Aserradero",
    rfc: "XAXX010101000",
    telefonos: "Tel no configurado",
    direccion_completa: "Dirección no configurada",
    logo_url: ""
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER DEL MODAL */}
        <div className="flex justify-between items-center p-4 bg-white border-b">
          <h2 className="text-lg font-bold text-gray-800">Vista Previa de Ticket (80mm)</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* CONTENEDOR DEL TICKET (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-gray-200 min-h-[300px]">
          
          {loading ? (
             <div className="flex flex-col items-center text-gray-500">
                <Loader2 className="animate-spin w-10 h-10 text-blue-600 mb-2" />
                <p>Cargando datos del ticket...</p>
             </div>
          ) : (
            /* 👇 ESTE ES EL TICKET REAL QUE SE IMPRIMIRÁ 👇 */
            <div 
                ref={ticketRef} 
                className="bg-white text-black p-4 shadow-sm"
                // Forzamos el ancho a 80mm para la previsualización y la impresión
                style={{ width: '80mm', minHeight: '100mm', margin: '0 auto', fontFamily: 'monospace' }}
            >
                {/* CSS mágico para la impresora térmica */}
                <style type="text/css" media="print">
                {`
                    @page { size: 80mm auto; margin: 0; }
                    body { margin: 0; padding: 0; font-family: sans-serif; }
                `}
                </style>

                {/* Cabecera del Negocio (DINÁMICA) */}
                <div className="text-center mb-4">
                    {/* 👇 AQUÍ ESTÁ EL LOGO CON FILTRO BLANCO Y NEGRO 👇 */}
                    {emp.logo_url && (
                        <div className="flex justify-center items-center mb-2">
                            <img 
                              src={emp.logo_url} 
                              alt="Logo" 
                              style={{ 
                                maxHeight: '60px', 
                                maxWidth: '100%',
                                objectFit: 'contain',
                                // Este filtro asegura que la impresora térmica lo lea nítido
                                filter: 'grayscale(100%) contrast(120%)' 
                              }} 
                            />
                            <h1 className="font-bold text-xl uppercase tracking-wider mb-1 leading-tight">{emp.nombre}</h1>
                        </div>
                    )}
                    
                    <p className="text-[11px] leading-tight text-gray-800 font-medium">RFC: {emp.rfc}</p>
                    <p className="text-[11px] leading-tight text-gray-800 whitespace-pre-line my-1">{emp.direccion_completa}</p>
                    <p className="text-[11px] leading-tight text-gray-800">Tels: {emp.telefonos}</p>
                </div>

                <div className="border-b border-dashed border-gray-400 mb-3"></div>

                {/* Datos de la Venta */}
                <div className="text-[12px] mb-3">
                    <div className="flex justify-between mb-1">
                        <span className="font-bold">FOLIO:</span>
                        <span className="font-bold">{venta.folio_nota}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span className="font-bold">FECHA:</span>
                        <span>{new Date(venta.fecha_salida).toLocaleString('es-MX', { 
                            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' 
                        })}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span className="font-bold">CLIENTE:</span>
                        <span className="text-right max-w-[150px] truncate">{venta.cliente.nombre_completo}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span className="font-bold">ATENDIÓ:</span>
                        <span className="text-right max-w-[150px] truncate uppercase">{venta.quien_expide || venta.usuario?.nombre_completo || 'Administrador'}</span>
                    </div>
                </div>

                <div className="border-b border-dashed border-gray-400 mb-3"></div>

                {/* Encabezados de Tabla */}
                <div className="flex justify-between text-[10px] font-bold mb-2">
                    <span className="w-8">CANT</span>
                    <span className="flex-1 px-1">DESCRIPCIÓN</span>
                    <span className="w-16 text-right">IMPORTE</span>
                </div>

                {/* Lista de Productos */}
                <div className="text-[12px] space-y-2 mb-3">
                {venta.detalles.map((detalle: any, idx: number) => {
                    const desc = detalle.producto.descripcion;
                    // Intenta extraer medidas si no están en la descripción
                    const medidas = detalle.producto.atributos_madera 
                        ? `${detalle.producto.atributos_madera.grosor_pulgadas}"x${detalle.producto.atributos_madera.ancho_pulgadas}"x${detalle.producto.atributos_madera.largo_pies}'` 
                        : '';
                    const displayDesc = desc.includes(medidas) || !medidas ? desc : `${desc} - ${medidas}`;

                    return (
                        <div key={idx} className="flex flex-col">
                            {/* Nombre del producto ocupa toda la línea para no amontonarse */}
                            <span className="font-medium uppercase leading-tight mb-1">{displayDesc}</span>
                            <div className="flex justify-between text-[11px] text-gray-700">
                                <span className="w-8">{detalle.cantidad_piezas || detalle.cantidad} x</span>
                                <span className="flex-1 px-1">${Number(detalle.precio_unitario || detalle.precio_unitario_venta).toFixed(2)}</span>
                                <span className="w-16 text-right font-bold text-black">${Number(detalle.importe_linea || detalle.subtotal).toFixed(2)}</span>
                            </div>
                        </div>
                    );
                })}
                </div>

                <div className="border-b border-dashed border-gray-400 mb-3"></div>

                {/* Totales */}
                <div className="text-[14px] flex flex-col items-end mb-6 space-y-1">
                    <div className="flex justify-between w-full">
                        <span>SUBTOTAL:</span>
                        <span>${Number(venta.total_venta).toFixed(2)}</span>
                    </div>
                    {/* Espacio para IVA si en el futuro decides agregarlo */}
                    <div className="flex justify-between w-full font-bold text-[16px] mt-1 border-t border-black pt-1">
                        <span>TOTAL:</span>
                        <span>${Number(venta.total_venta).toFixed(2)}</span>
                    </div>
                </div>

                {/* Pie del Ticket */}
                <div className="text-center text-[11px] text-gray-800 mt-8 mb-4">
                    <p className="font-bold mb-1">¡GRACIAS POR SU COMPRA!</p>
                    <p>Conserve este ticket para cualquier aclaración o garantía.</p>
                    
                    {/* Código de barras simulado para el Folio */}
                    <div className="mt-4 flex justify-center">
                        <span className="font-mono text-xs tracking-[0.2em]">* {venta.folio_nota} *</span>
                    </div>
                </div>
                
                {/* Espacio extra al final para que el autocorte de la KINWODON no corte el texto */}
                <div className="h-8"></div>
            </div>
          )}
        </div>

        {/* FOOTER DE BOTONES */}
        <div className="p-4 bg-white border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
            Cerrar
          </button>
          <button 
            onClick={() => handlePrint()}
            disabled={loading}
            className="px-6 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            <Printer size={18} />
            Imprimir Ticket
          </button>
        </div>

      </div>
    </div>
  );
};