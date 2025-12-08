// app/(dashboard)/reportes/semarnat/page.tsx
'use client';

import { useState } from 'react';
import { Search, Calendar, Printer, Loader2 } from 'lucide-react';

export default function LibroSemarnatPage() {
  // Estados de Filtros
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [genero, setGenero] = useState('TODOS');
  const [existenciaInicial, setExistenciaInicial] = useState<string>('0');

  // Estados de Datos
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generarReporte = async () => {
    if (!fechaInicio || !fechaFin) return alert("Selecciona las fechas");
    
    setLoading(true);
    const token = localStorage.getItem('sessionToken');
    
    try {
      const res = await fetch(
        `/api/reportes/libro-semarnat?inicio=${fechaInicio}&fin=${fechaFin}&genero=${genero}`, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Cálculo Final en Cliente para reactividad con 'Existencia Inicial'
  const calcExistenciaFinal = () => {
    if (!data) return 0;
    const inicial = parseFloat(existenciaInicial) || 0;
    const entradasTransformadas = data.totales.entradaTransformada; // Ya viene con el 50%
    const salidas = data.totales.salidaTotal;
    return inicial + entradasTransformadas - salidas;
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="mb-6 flex justify-between items-end print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Libro de Registro SEMARNAT</h1>
          <p className="text-gray-500">Generación de reporte de Entradas y Salidas (Materias Primas).</p>
        </div>
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded flex gap-2 hover:bg-blue-700">
          <Printer size={20} /> Imprimir Libro
        </button>
      </header>

      {/* Filtros (Ocultos al imprimir) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex flex-wrap gap-4 items-end print:hidden">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Fecha Inicio</label>
          <input type="date" className="border rounded px-3 py-2" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Fecha Fin</label>
          <input type="date" className="border rounded px-3 py-2" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Género</label>
          <select className="border rounded px-3 py-2 w-40" value={genero} onChange={e => setGenero(e.target.value)}>
            <option value="TODOS">Todos</option>
            <option value="PINO">Pino</option>
            <option value="ENCINO">Encino</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-blue-600 mb-1">Existencia Inicial (m³)</label>
          <input 
            type="number" 
            className="border border-blue-300 bg-blue-50 rounded px-3 py-2 w-32 font-bold" 
            value={existenciaInicial} 
            onChange={e => setExistenciaInicial(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <button 
          onClick={generarReporte} 
          disabled={loading}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
          Generar
        </button>
      </div>

      {/* VISTA DEL REPORTE (Diseño SEMARNAT) */}
      {data && (
        <div className="bg-white p-8 shadow-lg print:shadow-none print:p-0 max-w-5xl mx-auto border print:border-0">
          
          {/* Encabezado Oficial */}
          <div className="text-center mb-6 border-b-2 border-black pb-4">
            <h2 className="text-xl font-bold uppercase">Secretaría de Medio Ambiente y Recursos Naturales</h2>
            <h3 className="text-sm">Subsecretaría de Gestión para la Protección Ambiental</h3>
            <h3 className="text-sm font-bold mt-2">VII Cuadro 2 Registro de existencias</h3>
            
            <div className="flex justify-between text-xs mt-4 text-left">
              <div>
                <p><strong>Titular:</strong> ASERRADERO PUENTE DE DORIA (HERMENEGILDO BADILLO CRUZ)</p>
                <p><strong>Producto:</strong> MADERA ASERRADA ({genero})</p>
              </div>
              <div className="text-right">
                <p><strong>Periodo:</strong> {fechaInicio} al {fechaFin}</p>
              </div>
            </div>
          </div>

          {/* Tabla de Datos */}
          <table className="w-full text-xs border-collapse border border-black mb-6">
            <thead>
              <tr className="bg-gray-200 text-center font-bold print:bg-gray-300">
                <th className="border border-black p-1">Fecha</th>
                <th className="border border-black p-1">Tipo Doc</th>
                <th className="border border-black p-1">Folio</th>
                <th className="border border-black p-1">Remitente / Procedencia</th>
                <th className="border border-black p-1">Código Ident.</th>
                <th className="border border-black p-1 w-24">Entrada (m³)</th>
                <th className="border border-black p-1 w-24">Salida (m³)</th>
              </tr>
            </thead>
            <tbody>
              {data.filas.map((fila: any, idx: number) => (
                <tr key={idx} className="text-center">
                  <td className="border border-black p-1">{new Date(fila.fecha).toLocaleDateString()}</td>
                  <td className="border border-black p-1">{fila.documento}</td>
                  <td className="border border-black p-1">{fila.folio}</td>
                  <td className="border border-black p-1 text-left">{fila.procedencia_destino}</td>
                  <td className="border border-black p-1">{fila.codigo_identificacion}</td>
                  <td className="border border-black p-1">{fila.entrada > 0 ? fila.entrada.toFixed(3) : '-'}</td>
                  <td className="border border-black p-1">{fila.salida > 0 ? fila.salida.toFixed(3) : '-'}</td>
                </tr>
              ))}
              {/* Rellenar filas vacías si es necesario para estética impresa */}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-gray-100 print:bg-gray-200">
                <td colSpan={5} className="border border-black p-1 text-right">TOTALES PERIODO:</td>
                <td className="border border-black p-1 text-center">{data.totales.entradaBruta.toFixed(3)}</td>
                <td className="border border-black p-1 text-center">{data.totales.salidaTotal.toFixed(3)}</td>
              </tr>
            </tfoot>
          </table>

          {/* BALANCE FINAL (La Fórmula) */}
          <div className="border-2 border-black p-4 bg-gray-50 print:bg-white">
            <h4 className="font-bold text-sm mb-2 underline">BALANCE DE EXISTENCIAS (Fórmula Oficial)</h4>
            <div className="grid grid-cols-4 gap-4 text-sm text-center items-center">
              <div>
                <p className="text-gray-500 text-xs">Existencia Inicial</p>
                <p className="font-bold text-lg">{parseFloat(existenciaInicial).toFixed(3)}</p>
              </div>
              
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl text-gray-400">+</span>
                <div>
                  <p className="text-gray-500 text-xs">Entradas x 0.50</p>
                  <p className="font-bold text-lg text-blue-700">{data.totales.entradaTransformada.toFixed(3)}</p>
                  <p className="text-[10px] text-gray-400">(Bruto: {data.totales.entradaBruta.toFixed(3)})</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl text-gray-400">-</span>
                <div>
                  <p className="text-gray-500 text-xs">Salidas Totales</p>
                  <p className="font-bold text-lg text-red-700">{data.totales.salidaTotal.toFixed(3)}</p>
                </div>
              </div>

              <div className="border-l-2 border-gray-300 pl-4 text-left bg-yellow-50 p-2 rounded print:bg-transparent print:border-l-black">
                <p className="text-gray-500 text-xs font-bold">EXISTENCIA FINAL:</p>
                <p className="font-mono text-2xl font-bold">{calcExistenciaFinal().toFixed(3)} m³</p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}