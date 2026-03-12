// app/(dashboard)/reportes/semarnat/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { Search, Loader2, Copy, Trash2, CheckCheck, RefreshCw, FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react';

// Tipos base para la tabla
type FilaSemarnat = {
  frontend_id: string; 
  tipo: 'ENTRADA' | 'SALIDA';
  fecha: string;
  documento: string;
  folio: string;
  procedencia_destino: string;
  codigo_identificacion: string;
  entrada: number;
  salida: number;
};

const GENEROS_SEMARNAT = ['TODOS', 'Pino', 'Oyamel', 'Nogal', 'Ayacahuite', 'Cedro', 'Roble', 'Parota'];

export default function LibroSemarnatPage() {
  // Estados de Filtros
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [genero, setGenero] = useState('TODOS');
  const [existenciaInicial, setExistenciaInicial] = useState<string>('0');

  // Estados de Datos
  const [datosOriginales, setDatosOriginales] = useState<FilaSemarnat[]>([]);
  const [filasVisibles, setFilasVisibles] = useState<FilaSemarnat[]>([]);
  const [loading, setLoading] = useState(false);
  const [filaCopiada, setFilaCopiada] = useState<string | null>(null);

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
        const data = await res.json();
        const filasConId = (data.filas || []).map((f: any, i: number) => ({
          ...f,
          frontend_id: `row-${Date.now()}-${i}`
        }));
        setDatosOriginales(filasConId);
        setFilasVisibles(filasConId);
      }
    } catch (error) {
      console.error(error);
      alert("Error cargando los datos");
    } finally {
      setLoading(false);
    }
  };

  // --- SEPARACIÓN DE TABLAS Y MATEMÁTICAS ---
  const { entradas, salidas, entradaBruta, entradaTransformada, salidaTotal, existenciaFinal } = useMemo(() => {
    const arrEntradas = filasVisibles.filter(f => f.tipo === 'ENTRADA');
    const arrSalidas = filasVisibles.filter(f => f.tipo === 'SALIDA');

    const eBruta = arrEntradas.reduce((acc, fila) => acc + (fila.entrada || 0), 0);
    const sTotal = arrSalidas.reduce((acc, fila) => acc + (fila.salida || 0), 0);
    
    const eTransformada = eBruta * 0.50; 
    
    const eInicial = parseFloat(existenciaInicial) || 0;
    const eFinal = eInicial + eTransformada - sTotal;

    return { 
      entradas: arrEntradas,
      salidas: arrSalidas,
      entradaBruta: eBruta, 
      entradaTransformada: eTransformada, 
      salidaTotal: sTotal, 
      existenciaFinal: eFinal 
    };
  }, [filasVisibles, existenciaInicial]);


  const eliminarFila = (frontend_id: string) => {
    setFilasVisibles(prev => prev.filter(f => f.frontend_id !== frontend_id));
  };

  const restaurarFilas = () => {
    setFilasVisibles(datosOriginales);
  };

  const copiarFilaParaWord = (fila: FilaSemarnat) => {
    const remitenteDestinatarioCompuesto = `${fila.procedencia_destino} (RFN: ${fila.codigo_identificacion || 'S/N'})`;
    const cantidadStr = fila.tipo === 'ENTRADA' ? fila.entrada.toFixed(3) : fila.salida.toFixed(3);

    const textoCopiado = [
      new Date(fila.fecha).toLocaleDateString('es-MX'),
      fila.documento,
      fila.folio,
      remitenteDestinatarioCompuesto,
      cantidadStr
    ].join('\t');

    navigator.clipboard.writeText(textoCopiado).then(() => {
      setFilaCopiada(fila.frontend_id);
      setTimeout(() => setFilaCopiada(null), 2000); 
    });
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Libro de SEMARNAT</h1>
          <p className="text-gray-500">Genera tu reporte, ajusta tus filas y cópialas directo a tu formato oficial (Word/Excel).</p>
        </div>
        
      </header>

      {/* FILTROS */}
      <div className="bg-white p-5 rounded-xl shadow-sm border mb-6 flex flex-wrap gap-5 items-end">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Fecha Inicio</label>
          <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Fecha Fin</label>
          <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Género</label>
          <select className="border border-gray-300 rounded-lg px-3 py-2 w-40 text-sm focus:ring-blue-500 font-medium" value={genero} onChange={e => setGenero(e.target.value)}>
            {GENEROS_SEMARNAT.map(g => (
               <option key={g} value={g === 'TODOS' ? g : g.toUpperCase()}>{g}</option>
            ))}
          </select>
        </div>
        <div className="border-l pl-5">
          <label className="block text-xs font-bold text-blue-600 mb-1 uppercase tracking-wider">Existencia Inicial (m³)</label>
          <input 
            type="number" 
            className="border border-blue-300 bg-blue-50 rounded-lg px-3 py-2 w-36 font-bold text-blue-800 focus:ring-blue-500" 
            value={existenciaInicial} 
            onChange={e => setExistenciaInicial(e.target.value)}
            placeholder="0.000"
          />
        </div>
        <button 
          onClick={generarReporte} 
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex gap-2 font-bold transition-all shadow-sm"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
          Cargar Datos
        </button>
      </div>

      {/* ÁREA DE TRABAJO */}
      {datosOriginales.length > 0 && (
        <div className="space-y-6">
          
          {/* BALANCE FLOTANTE */}
          <div className="bg-slate-800 text-white p-4 rounded-xl flex flex-wrap justify-between items-center shadow-lg border border-slate-700 sticky top-4 z-20">
            <div className="flex items-center gap-2">
               <FileText className="text-blue-400"/>
               <h3 className="font-bold hidden md:block">Balance Calculado</h3>
            </div>
            <div className="flex items-center gap-4 md:gap-8 text-sm font-mono">
               <div className="text-center">
                  <span className="block text-[10px] text-gray-400 uppercase tracking-widest">Inicial</span>
                  <span className="font-bold">{parseFloat(existenciaInicial || '0').toFixed(3)}</span>
               </div>
               <span className="text-gray-500">+</span>
               <div className="text-center">
                  <span className="block text-[10px] text-gray-400 uppercase tracking-widest">Entradas (x0.50)</span>
                  <span className="font-bold text-green-400">{entradaTransformada.toFixed(3)}</span>
               </div>
               <span className="text-gray-500">-</span>
               <div className="text-center">
                  <span className="block text-[10px] text-gray-400 uppercase tracking-widest">Salidas</span>
                  <span className="font-bold text-red-400">{salidaTotal.toFixed(3)}</span>
               </div>
               <span className="text-gray-500">=</span>
               <div className="bg-blue-600 px-4 py-1.5 rounded-lg text-center border border-blue-400 shadow-inner">
                  <span className="block text-[10px] text-blue-200 uppercase tracking-widest">Existencia Final</span>
                  <span className="font-bold text-xl">{existenciaFinal.toFixed(3)} m³</span>
               </div>
            </div>
          </div>

          {/* GRID DE TABLAS: ENTRADAS (Izquierda) / SALIDAS (Derecha) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* PANEL ENTRADAS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="bg-green-50/50 p-4 border-b border-green-100 flex justify-between items-center">
                <h3 className="font-bold text-green-800 flex items-center gap-2">
                   <ArrowDownRight size={20} className="text-green-600"/> 
                   Registro de Entradas
                </h3>
                <span className="bg-white text-green-700 font-mono text-xs px-2 py-1 rounded border border-green-200 font-bold">
                   Bruto: {entradaBruta.toFixed(3)} m³
                </span>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b">
                    <tr>
                      <th className="px-3 py-2 w-20">Fecha</th>
                      <th className="px-3 py-2">Tipo Doc</th>
                      <th className="px-3 py-2">Folio</th>
                      <th className="px-3 py-2">Remitente + Código</th>
                      <th className="px-3 py-2 text-right w-16">M³</th>
                      <th className="px-3 py-2 text-center w-16">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {entradas.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-400">No hay entradas en este periodo</td></tr>
                    ) : (
                      entradas.map((fila) => (
                        <tr key={fila.frontend_id} className="hover:bg-green-50/30 group">
                          <td className="px-3 py-2 font-mono text-gray-600">{new Date(fila.fecha).toLocaleDateString('es-MX')}</td>
                          
                          {/* 👇 AHORA DOC Y FOLIO ESTÁN SEPARADOS 👇 */}
                          <td className="px-3 py-2 text-gray-500">{fila.documento}</td>
                          <td className="px-3 py-2 font-bold text-gray-800">{fila.folio}</td>
                          
                          <td className="px-3 py-2">
                             <span className="block font-medium text-gray-800 truncate max-w-[150px]">{fila.procedencia_destino}</span>
                             <span className="text-[10px] font-mono text-gray-500">{fila.codigo_identificacion}</span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-green-700 bg-green-50/30">
                            {fila.entrada.toFixed(3)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => copiarFilaParaWord(fila)} className="p-1 rounded hover:bg-gray-200 text-gray-600" title="Copiar Fila">
                                {filaCopiada === fila.frontend_id ? <CheckCheck size={16} className="text-green-600" /> : <Copy size={16} />}
                              </button>
                              <button onClick={() => eliminarFila(fila.frontend_id)} className="p-1 rounded hover:bg-red-100 text-red-500" title="Ignorar Fila">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PANEL SALIDAS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="bg-red-50/50 p-4 border-b border-red-100 flex justify-between items-center">
                <h3 className="font-bold text-red-800 flex items-center gap-2">
                   <ArrowUpRight size={20} className="text-red-600"/> 
                   Registro de Salidas
                </h3>
                <span className="bg-white text-red-700 font-mono text-xs px-2 py-1 rounded border border-red-200 font-bold">
                   Total: {salidaTotal.toFixed(3)} m³
                </span>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b">
                    <tr>
                      <th className="px-3 py-2 w-20">Fecha</th>
                      <th className="px-3 py-2">Tipo Doc</th>
                      <th className="px-3 py-2">Folio</th>
                      <th className="px-3 py-2">Destinatario + Código</th>
                      <th className="px-3 py-2 text-right w-16">M³</th>
                      <th className="px-3 py-2 text-center w-16">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {salidas.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-400">No hay salidas en este periodo</td></tr>
                    ) : (
                      salidas.map((fila) => (
                        <tr key={fila.frontend_id} className="hover:bg-red-50/30 group">
                          <td className="px-3 py-2 font-mono text-gray-600">{new Date(fila.fecha).toLocaleDateString('es-MX')}</td>
                          
                          {/* 👇 AHORA DOC Y FOLIO ESTÁN SEPARADOS 👇 */}
                          <td className="px-3 py-2 text-gray-500">{fila.documento}</td>
                          <td className="px-3 py-2 font-bold text-gray-800">{fila.folio}</td>
                          
                          <td className="px-3 py-2">
                             <span className="block font-medium text-gray-800 truncate max-w-[150px]">{fila.procedencia_destino}</span>
                             <span className="text-[10px] font-mono text-gray-500">{fila.codigo_identificacion}</span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-red-700 bg-red-50/30">
                            {fila.salida.toFixed(3)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => copiarFilaParaWord(fila)} className="p-1 rounded hover:bg-gray-200 text-gray-600" title="Copiar Fila">
                                {filaCopiada === fila.frontend_id ? <CheckCheck size={16} className="text-green-600" /> : <Copy size={16} />}
                              </button>
                              <button onClick={() => eliminarFila(fila.frontend_id)} className="p-1 rounded hover:bg-red-100 text-red-500" title="Ignorar Fila">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>       
          </div>
          <div className="flex gap-2">
          {datosOriginales.length > 0 && filasVisibles.length !== datosOriginales.length && (
            <button onClick={restaurarFilas} className="text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg flex gap-2 hover:bg-yellow-100 font-medium transition-colors border border-yellow-200">
              <RefreshCw size={20} /> Restaurar {datosOriginales.length - filasVisibles.length} eliminados
            </button>
          )}
        </div>
        </div>
      )}
    </div>
  );
}