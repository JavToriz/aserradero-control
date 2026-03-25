//Este componente es para crear el tickek personalizado para ventas de madera aserrada.
'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Printer, Loader2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print'; 

export interface DatosEmpresaTicket {
  nombre: string;
  propietario: string;
  rfc: string;
  curp?: string;
  rfn?: string; 
  c_i?: string; 
  telefonos: string;
  direccion_completa: string; 
  logo_url: string;
}

interface ImprimirTicketMaderaModalProps {
  isOpen: boolean;
  onClose: () => void;
  venta: any;
}

// --- LOGICA NUMERO A LETRAS ---
const numeroALetras = (amount: number): string => {
  const unidades = ['', 'UN ', 'DOS ', 'TRES ', 'CUATRO ', 'CINCO ', 'SEIS ', 'SIETE ', 'OCHO ', 'NUEVE '];
  const decenas = ['DIEZ ', 'ONCE ', 'DOCE ', 'TRECE ', 'CATORCE ', 'QUINCE ', 'DIECISEIS ', 'DIECISIETE ', 'DIECIOCHO ', 'DIECINUEVE ', 'VEINTE ', 'TREINTA ', 'CUARENTA ', 'CINCUENTA ', 'SESENTA ', 'SETENTA ', 'OCHENTA ', 'NOVENTA '];
  const centenas = ['', 'CIENTO ', 'DOSCIENTOS ', 'TRESCIENTOS ', 'CUATROCIENTOS ', 'QUINIENTOS ', 'SEISCIENTOS ', 'SETECIENTOS ', 'OCHOCIENTOS ', 'NOVECIENTOS '];

  let number = parseFloat(amount.toString());
  let decimals = Math.round((number - Math.floor(number)) * 100);
  let enteros = Math.floor(number);

  function getUnidades(num: number) { let un = Math.floor(num % 10); return unidades[un]; }
  function getDecenas(num: number) {
    let dec = Math.floor(num / 10); let uni = num - (dec * 10);
    if (dec < 3) { if (dec === 0) return getUnidades(num); if (dec === 1 && uni < 10) return decenas[uni]; if (dec === 2 && uni === 0) return decenas[10]; if (dec === 2 && uni > 0) return 'VEINTI' + getUnidades(uni); } 
    let str = decenas[dec + 8]; if (uni > 0) str += 'Y ' + getUnidades(uni); return str;
  }
  function getCentenas(num: number) { if (num > 99) { if (num === 100) return 'CIEN '; let cen = Math.floor(num / 100); let resto = num - (cen * 100); return centenas[cen] + getDecenas(resto); } else { return getDecenas(num); } }
  function getMiles(num: number) { let divisor = 1000; let cientos = Math.floor(num / divisor); let resto = num - (cientos * divisor); let strMiles = ''; if (cientos > 0) { if (cientos === 1) strMiles = 'MIL '; else strMiles = getCentenas(cientos) + 'MIL '; } if (resto > 0) strMiles += getCentenas(resto); return strMiles; }
  let letras = ''; if (enteros === 0) letras = 'CERO '; else if (enteros < 1000) letras = getCentenas(enteros); else if (enteros < 1000000) letras = getMiles(enteros);
  return `${letras.trim()} PESOS ${decimals.toString().padStart(2, '0')}/100 M.N.`;
};

export const ImprimirTicketMaderaModal = ({ isOpen, onClose, venta }: ImprimirTicketMaderaModalProps) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  
  const [empresaConfig, setEmpresaConfig] = useState<DatosEmpresaTicket | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: '', 
  });

  if (!isOpen || !venta) return null;

  const emp = empresaConfig || {
    nombre: "Aserradero Puente de Doria",
    propietario: "HERMENEGILDO BADILLO CRUZ",
    rfc: "BACH780413IZA",
    curp: "BACH780413HPLDRR07",
    rfn: "HGO TI 1621",
    c_i: "T-13-024-BAC-001/21",
    telefonos: "775 124 76 57 y 775 137 2681",
    direccion_completa: "PARCELA 317 Z-1 P1/2 DEL EJIDO RIO SECO\nC.P. 43500 PUENTE DE DORIA RIO SECO,\nHUASCA DE OCAMPO, HGO.",
    logo_url: "/images/logo-puente-de-doria.png"
  };

  const direccionCliente = [
    venta.cliente?.domicilio_calle,
    venta.cliente?.domicilio_poblacion,
    venta.cliente?.domicilio_municipio,
    venta.cliente?.domicilio_entidad
  ].filter(part => part && part.trim() !== '').join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-4 bg-white border-b">
          <h2 className="text-lg font-bold text-gray-800">Vista Ticket de Madera (80mm)</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-gray-200 min-h-[300px]">
          {loading ? (
             <div className="flex flex-col items-center text-gray-500">
                <Loader2 className="animate-spin w-10 h-10 text-blue-600 mb-2" />
                <p>Cargando datos del ticket...</p>
             </div>
          ) : (
            <div 
                ref={ticketRef} 
                className="bg-white text-black text-left"
                style={{ width: '78mm', padding: '2mm', minHeight: '100mm', margin: '0 auto', fontFamily: 'monospace' }}
            >
                <style type="text/css" media="print">
                {`
                    @page { margin: 0px !important; padding: 0px !important; }
                    html, body { margin: 0px !important; padding: 0px !important; background: white !important; }
                    header, footer { display: none !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                `}
                </style>

                {/* Cabecera Empresa */}
                <div className="text-center mb-4">
                    {emp.logo_url && (
                        <div className="flex justify-center items-center mb-2">
                            <img 
                              src={emp.logo_url} 
                              alt="Logo" 
                              style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain', filter: 'grayscale(100%) contrast(120%)' }} 
                            />
                            <h1 className="font-bold text-xl uppercase tracking-wider mb-1 leading-tight">{emp.nombre}</h1>
                        </div>
                    )}
                    <p className="text-[11px] leading-tight font-bold mb-1">{emp.propietario}</p>
                    <p className="text-[10px] leading-tight text-gray-800 font-medium">RFC: {emp.rfc} &nbsp; CURP: {emp.curp}</p>
                    <p className="text-[10px] leading-tight text-gray-800 font-medium my-1">RFN: {emp.rfn} &nbsp; C.I.: {emp.c_i}</p>
                    <p className="text-[10px] leading-tight text-gray-800 whitespace-pre-line my-1">{emp.direccion_completa}</p>
                    <p className="text-[10px] leading-tight font-bold">TELS: {emp.telefonos}</p>
                </div>

                <div className="border-b-2 border-dashed border-gray-600 mb-3"></div>

                {/* Datos Venta y Cliente */}
                <div className="text-[10px] mb-3 leading-snug">
                    <div className="flex justify-between mb-1">
                        <span className="font-bold">FOLIO:</span>
                        <span className="font-bold text-[12px]">{venta.folio_nota}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span className="font-bold">FECHA:</span>
                        <span>{new Date(venta.fecha_salida).toLocaleString('es-MX', { 
                            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' 
                        })}</span>
                    </div>
                    <div className="flex flex-col mt-2">
                        <span className="font-bold mb-0.5">CLIENTE:</span>
                        <span className="uppercase">{venta.cliente?.nombre_completo}</span>
                    </div>
                    {venta.cliente?.rfc && (
                       <div className="flex justify-between mt-1">
                          <span className="font-bold">RFC:</span>
                          <span className="uppercase">{venta.cliente.rfc}</span>
                       </div>
                    )}
                    {direccionCliente && (
                       <div className="flex flex-col mt-1">
                          <span className="font-bold mb-0.5">DIRECCIÓN:</span>
                          <span className="uppercase">{direccionCliente}</span>
                       </div>
                    )}
                </div>

                <div className="border-b border-dashed border-gray-400 mb-3"></div>

                {/* Columnas Productos */}
                <div className="flex justify-between text-[10px] font-bold mb-2">
                    <span className="w-6">CANT</span>
                    <span className="flex-1 px-1">DESCRIPCIÓN</span>
                    <span className="w-16 text-right">IMPORTE</span>
                </div>

                {/* Productos */}
                <div className="text-[10px] space-y-2 mb-3">
                {venta.detalles.map((detalle: any, idx: number) => {
                    let desc = detalle.producto.descripcion || '';
                    let medidas = '';

                    if (detalle.producto.atributos_madera) {
                        const { grosor_pulgadas: g, ancho_pulgadas: a, largo_pies: l } = detalle.producto.atributos_madera;
                        medidas = `${g}" x ${a}" x ${l}'`;
                        const regex = new RegExp(`(?:\\b|(?<=\\s|^))${g}["']?\\s*[xX*]\\s*${a}["']?\\s*[xX*]\\s*${l}['"]?\\b`, 'i');
                        desc = desc.replace(regex, '').replace(/\\s*-\\s*$/, '').trim();
                        if (g === 0 && a === 0 && l === 0) medidas = '';
                    } else if (detalle.producto.atributos_triplay) {
                        const { espesor_mm: e, ancho_ft: af, largo_ft: lf } = detalle.producto.atributos_triplay;
                        medidas = `${e}mm x ${af}' x ${lf}'`;
                        const regex = new RegExp(`(?:\\b|(?<=\\s|^))${e}(?:mm)?\\s*[xX*]\\s*${af}['"ft]*\\s*[xX*]\\s*${lf}['"ft]*\\b`, 'i');
                        desc = desc.replace(regex, '').replace(/\\s*-\\s*$/, '').trim();
                        if (e === 0 && af === 0 && lf === 0) medidas = '';
                    }

                    const genero = detalle.genero || detalle.producto.atributos_madera?.genero || '';

                    return (
                        <div key={idx} className="flex flex-col mb-1 border-b border-gray-200 pb-1">
                            <span className="font-bold uppercase leading-tight mb-0.5">{desc}</span>
                            {(medidas || genero) && (
                                <div className="text-[9.5px] text-gray-600 mb-0.5 leading-tight flex flex-col">
                                   {medidas && <span>Medidas: <span className="font-medium text-gray-800">{medidas}</span></span>}
                                   {genero && <span>Género: <span className="font-medium text-gray-800 uppercase">{genero}</span></span>}
                                </div>
                            )}
                            <div className="flex justify-between text-gray-800 mt-0.5">
                                <span className="w-6 font-medium">{detalle.cantidad_piezas || detalle.cantidad}x</span>
                                <span className="flex-1 px-1">${Number(detalle.precio_unitario || detalle.precio_unitario_venta).toFixed(2)}</span>
                                <span className="w-16 text-right font-bold text-black">${Number(detalle.importe_linea || detalle.importe || detalle.subtotal || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    );
                })}
                </div>

                {/* Totales */}
                <div className="text-[12px] flex flex-col items-end mb-4 space-y-1">
                    <div className="flex justify-between w-full">
                        <span>SUBTOTAL:</span>
                        <span>${(Number(venta.total_venta) - Number(venta.impuestos || 0)).toFixed(2)}</span>
                    </div>
                    {Number(venta.impuestos) > 0 && (
                        <div className="flex justify-between w-full">
                            <span>IVA (16%):</span>
                            <span>${Number(venta.impuestos).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between w-full font-bold text-[16px] mt-1 border-t-2 border-black pt-1">
                        <span>TOTAL:</span>
                        <span>${Number(venta.total_venta).toFixed(2)}</span>
                    </div>
                </div>

                <div className="text-[10px] mb-4">
                    <span className="font-bold block mb-1">IMPORTE CON LETRA:</span>
                    <span className="uppercase text-gray-800">{numeroALetras(Number(venta.total_venta))}</span>
                </div>

                {/* Vehículo */}
                {(venta.vehiculo) && (
                  <div className="text-[10px] mb-4 border border-black p-2 bg-gray-50">
                     <p className="font-bold text-center border-b border-black pb-1 mb-1">DATOS DEL VEHÍCULO</p>
                     <div className="flex gap-2">
                        <span className="font-bold w-[50px]">MARCA:</span><span className="uppercase">{venta.vehiculo.marca}</span>
                     </div>
                     <div className="flex gap-2">
                        <span className="font-bold w-[50px]">MODELO:</span><span className="uppercase">{venta.vehiculo.modelo}</span>
                     </div>
                     <div className="flex gap-2">
                        <span className="font-bold w-[50px]">PLACAS:</span><span className="uppercase">{venta.vehiculo.matricula}</span>
                     </div>
                     <div className="flex gap-2">
                        <span className="font-bold w-[50px]">CAPAC.:</span><span className="uppercase">{venta.vehiculo.capacidad_carga_toneladas} TON</span>
                     </div>
                  </div>
                )}

                {/* Quien expide */}
                <div className="text-center text-[10px] text-gray-800 mt-6 mb-4">
                    <div className="border-t border-black pt-1 mb-4 w-3/4 mx-auto mt-8">
                       <span className="font-bold">NOMBRE Y FIRMA DE QUIEN EXPIDE</span><br/>
                       <span className="uppercase">{venta.quien_expide || venta.usuario?.nombre_completo || 'Administrador'}</span>
                    </div>
                </div>
                
                <div className="h-4"></div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
            Cerrar
          </button>
          <button 
            onClick={() => handlePrint()}
            disabled={loading}
            className="px-6 py-2 bg-green-700 text-white font-bold rounded-lg hover:bg-green-800 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            <Printer size={18} />
            Imprimir Ticket
          </button>
        </div>
      </div>
    </div>
  );
};
