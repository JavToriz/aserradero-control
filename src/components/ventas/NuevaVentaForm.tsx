// components/ventas/NuevaVentaForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchAndCreateInput } from '@/components/ui/SearchAndCreateInput';
import { PersonaFormModal } from '@/components/personas/PersonaFormModal';
import { SeleccionarInventarioModal } from './SeleccionarInventarioModal';
import { Save, Plus, Trash2, Printer, Link as LinkIcon, AlertCircle, X, Box } from 'lucide-react'; // Añadí Box icono para SKU
import { NotaVentaImprimible } from './NotaVentaImprimible'; 

// Tipos
type Cliente = { id_persona: number; nombre_completo: string; [key: string]: any };
type Vehiculo = { id_vehiculo: number; matricula: string; marca: string; modelo: string; capacidad_carga_toneladas: number };
type ReembarqueSearch = { id_reembarque: number; folio_progresivo: string; destinatario?: { nombre_completo: string } };

type ProductoCatalogo = { 
  id_producto_catalogo: number; 
  descripcion: string; 
  precio_venta: number;   
  precio_mayoreo?: number; 
  sku?: string; // Aseguramos que el SKU esté en el tipo
  tipo_categoria: 'MADERA_ASERRADA' | 'TRIPLAY_AGLOMERADO';
  atributos_madera?: { grosor_pulgadas: number; ancho_pulgadas: number; largo_pies: number } | null;
  atributos_triplay?: { espesor_mm: number; ancho_ft: number; largo_ft: number } | null;
  [key: string]: any 
};

type ProductoVenta = {
  idUnico: string;
  producto: ProductoCatalogo | null;
  nombreProducto: string;
  cantidad: number; 
  precioUnitario: number;
  tipoPrecio: 'MENUDEO' | 'MAYOREO'; 
  origenes: { id_stock: number; cantidad: number }[]; 
  inventarioValidado: boolean; 
};

export function NuevaVentaForm() {
  const router = useRouter();
  
  // Estados Generales
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [clienteNombre, setClienteNombre] = useState('');
  
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [vehiculoMatricula, setVehiculoMatricula] = useState('');
  
  const [mostrarReembarque, setMostrarReembarque] = useState(false);
  const [reembarque, setReembarque] = useState<ReembarqueSearch | null>(null);
  const [reembarqueQuery, setReembarqueQuery] = useState('');

  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [tipoPago, setTipoPago] = useState('Efectivo');
  const [cuentaDestino, setCuentaDestino] = useState(''); 
  const [quienExpide, setQuienExpide] = useState(''); 

  const [carrito, setCarrito] = useState<ProductoVenta[]>([]);
  
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [productoParaStock, setProductoParaStock] = useState<{idUnico: string, producto: any, cantidad: number} | null>(null);
  const [ventaGuardada, setVentaGuardada] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- RENDERIZADO PERSONALIZADO (Aquí está la magia UX) ---
  const renderReembarqueItem = (item: ReembarqueSearch) => (
    <div className="flex flex-col py-1">
      <span className="font-bold">Folio: {item.folio_progresivo}</span>
      <span className="text-xs text-gray-500">Dest: {item.destinatario?.nombre_completo || 'S/N'}</span>
    </div>
  );

  const renderProductoItem = (item: ProductoCatalogo) => {
    let medidas = '';

    // Lógica para formatear medidas bonito
    if (item.tipo_categoria === 'MADERA_ASERRADA' && item.atributos_madera) {
      const { grosor_pulgadas, ancho_pulgadas, largo_pies } = item.atributos_madera;
      medidas = `${grosor_pulgadas}" x ${ancho_pulgadas}" x ${largo_pies}'`;
    } else if (item.tipo_categoria === 'TRIPLAY_AGLOMERADO' && item.atributos_triplay) {
      const { espesor_mm, ancho_ft, largo_ft } = item.atributos_triplay;
      medidas = `${espesor_mm}mm x ${ancho_ft}' x ${largo_ft}'`;
    }

    return (
      <div className="flex flex-col py-1 w-full">
        {/* Fila 1: Descripción Principal */}
        <span className="font-medium text-gray-800 text-sm truncate">{item.descripcion}</span>
        
        {/* Fila 2: SKU y Medidas */}
        <div className="flex justify-between items-center mt-0.5">
          <div className="flex items-center gap-1 text-xs text-blue-600 font-mono">
             <Box size={10} /> {/* Iconito de caja */}
             <span>SKU: {item.sku || 'S/N'}</span>
          </div>
          {medidas && (
            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
              {medidas}
            </span>
          )}
        </div>
      </div>
    );
  };

  // --- Lógica Carrito ---
  const agregarFila = () => {
    setCarrito(prev => [...prev, {
      idUnico: `prod-${Date.now()}`, 
      producto: null, 
      nombreProducto: '', 
      cantidad: 0,
      precioUnitario: 0, 
      tipoPrecio: 'MENUDEO', 
      origenes: [], 
      inventarioValidado: false
    }]);
  };

  const actualizarFila = (idUnico: string, campo: keyof ProductoVenta, valor: any) => {
    setCarrito(prev => prev.map(item => {
      if (item.idUnico === idUnico) {
        const nuevoItem = { ...item, [campo]: valor };
        
        if (campo === 'producto' && valor) {
          const p = valor as ProductoCatalogo;
          const precioBase = nuevoItem.tipoPrecio === 'MAYOREO' && Number(p.precio_mayoreo) > 0
            ? Number(p.precio_mayoreo) 
            : Number(p.precio_venta);
            
          nuevoItem.precioUnitario = precioBase;
          nuevoItem.inventarioValidado = false;
          nuevoItem.origenes = [];
        }

        if (campo === 'cantidad') {
          nuevoItem.inventarioValidado = false;
          nuevoItem.origenes = [];
        }
        return nuevoItem;
      }
      return item;
    }));
  };

  const cambiarTipoPrecio = (idUnico: string, nuevoTipo: 'MENUDEO' | 'MAYOREO') => {
    setCarrito(prev => prev.map(item => {
      if (item.idUnico === idUnico && item.producto) {
        let nuevoPrecio = 0;
        if (nuevoTipo === 'MAYOREO') {
           nuevoPrecio = Number(item.producto.precio_mayoreo) > 0 
             ? Number(item.producto.precio_mayoreo) 
             : Number(item.producto.precio_venta);
        } else {
           nuevoPrecio = Number(item.producto.precio_venta);
        }
        return { ...item, tipoPrecio: nuevoTipo, precioUnitario: nuevoPrecio };
      }
      return item;
    }));
  };

  const eliminarFila = (idUnico: string) => {
    setCarrito(prev => prev.filter(p => p.idUnico !== idUnico));
  };

  const abrirModalStock = (item: ProductoVenta) => {
    if (!item.producto || item.cantidad <= 0) return alert("Selecciona producto y cantidad > 0");
    setProductoParaStock({
      idUnico: item.idUnico,
      producto: { id: item.producto.id_producto_catalogo, nombre: item.producto.descripcion },
      cantidad: item.cantidad
    });
    setIsStockModalOpen(true);
  };

  const confirmarStock = (origenes: { id_stock: number; cantidad: number }[]) => {
    if (productoParaStock) {
      actualizarFila(productoParaStock.idUnico, 'origenes', origenes);
      actualizarFila(productoParaStock.idUnico, 'inventarioValidado', true);
      setIsStockModalOpen(false);
      setProductoParaStock(null);
    }
  };

  const ocultarReembarque = () => {
    setReembarque(null);
    setReembarqueQuery('');
    setMostrarReembarque(false);
  };

  const totalVenta = carrito.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return alert("Selecciona un cliente");
    if (carrito.length === 0) return alert("Añade productos");
    if (carrito.some(p => !p.inventarioValidado)) return alert("Hay productos sin asignar stock.");
    if (tipoPago === 'Transferencia' && !cuentaDestino.trim()) return alert("Ingresa el nombre de la cuenta destino.");

    setIsSaving(true);
    const token = localStorage.getItem('sessionToken');

    const payload = {
      id_cliente: cliente.id_persona,
      fecha_salida: fecha,
      tipo_pago: tipoPago,
      cuenta_destino: tipoPago === 'Transferencia' ? cuentaDestino : null, 
      id_reembarque: reembarque?.id_reembarque, 
      id_vehiculo: vehiculo?.id_vehiculo,
      nombre_quien_expide: quienExpide,
      total_venta: totalVenta,
      productos_venta: carrito.map(p => ({
        id_producto_catalogo: p.producto!.id_producto_catalogo,
        cantidad_total: p.cantidad,
        precio_unitario: p.precioUnitario,
        importe: p.cantidad * p.precioUnitario,
        origenes: p.origenes
      }))
    };

    try {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setVentaGuardada({
        ...data,
        cliente,
        vehiculo,
        detalles: carrito.map(p => ({
          producto: p.producto,
          cantidad: p.cantidad,
          precio_unitario: p.precioUnitario,
          importe: p.cantidad * p.precioUnitario,
          genero: p.producto?.atributos_madera?.genero || '',
          medidas: p.producto?.descripcion 
        })),
        quien_expide: quienExpide
      });

    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (ventaGuardada) {
    return (
      <div className="text-center animate-in fade-in duration-300">
        <div className="mb-4 bg-green-100 p-4 rounded text-green-800 shadow-sm">
          ✅ Venta registrada exitosamente. Folio: <strong>{ventaGuardada.folio_nota}</strong>
        </div>
        <div className="border rounded bg-white shadow-lg mx-auto p-2 mb-6 max-w-4xl overflow-auto h-[600px]">
           <NotaVentaImprimible datos={ventaGuardada} />
        </div>
        <div className="mt-6 flex justify-center gap-4">
          <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded flex items-center gap-2 shadow transition-colors">
            <Printer size={20} /> Imprimir Nota
          </button>
          <button onClick={() => router.refresh()} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded border transition-colors">
            Nueva Venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20 max-w-7xl mx-auto">
      
      {/* 1. Cliente */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-2 gap-2">
            <h2 className="text-lg font-bold text-gray-800">1. Datos Generales</h2>
            
            <div className="w-full md:w-auto">
                {!mostrarReembarque ? (
                    <button 
                        type="button" 
                        onClick={() => setMostrarReembarque(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors"
                    >
                        <LinkIcon size={16} /> 
                        Vincular con Reembarque (Opcional)
                    </button>
                ) : (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="w-64 md:w-80">
                            <SearchAndCreateInput<ReembarqueSearch>
                                label=""
                                placeholder="Buscar folio (Ej: RE-2025-001)"
                                searchApiUrl="/api/reembarques" 
                                displayField="folio_progresivo"
                                inputValue={reembarqueQuery}
                                onInputChange={(v) => { setReembarqueQuery(v); setReembarque(null); }}
                                onSelect={(r) => { setReembarque(r); setReembarqueQuery(r.folio_progresivo); }}
                                onCreateNew={() => {}}
                                renderItem={renderReembarqueItem}
                            />
                        </div>
                        <button 
                            type="button"
                            onClick={ocultarReembarque}
                            className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}
                {reembarque && !mostrarReembarque && (
                   <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                        🔗 Vinculado: <strong>{reembarque.folio_progresivo}</strong>
                      </span>
                      <button type="button" onClick={ocultarReembarque} className="text-xs text-red-500 underline">Quitar</button>
                   </div>
                )}
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SearchAndCreateInput<Cliente>
            label="Cliente"
            placeholder="Buscar cliente..."
            searchApiUrl="/api/personas"
            displayField="nombre_completo"
            inputValue={clienteNombre}
            onInputChange={(v) => { setClienteNombre(v); setCliente(null); }}
            onSelect={(c) => { setCliente(c); setClienteNombre(c.nombre_completo); }}
            onCreateNew={() => setIsClienteModalOpen(true)}
          />
          <SearchAndCreateInput<Vehiculo>
            label="Vehículo (Opcional)"
            placeholder="Buscar placas..."
            searchApiUrl="/api/vehiculos"
            displayField="matricula"
            inputValue={vehiculoMatricula}
            onInputChange={(v) => { setVehiculoMatricula(v); setVehiculo(null); }}
            onSelect={(v) => { setVehiculo(v); setVehiculoMatricula(v.matricula); }}
            onCreateNew={() => alert("Modal Vehículo pendiente")}
          />
        </div>
      </div>

      {/* 2. Productos */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-gray-100 pb-6">
           <div>
             <h2 className="text-xl font-bold text-gray-800 mb-1">2. Productos y Pago</h2>
             <p className="text-sm text-gray-500">Agrega productos buscando por Nombre o SKU.</p>
           </div>
           
           <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-3 rounded-xl border border-gray-100 w-full lg:w-auto">
             <div>
               <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Fecha</label>
               <input 
                 type="date" 
                 className="border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 text-sm py-2 px-3" 
                 value={fecha} 
                 onChange={e => setFecha(e.target.value)} 
               />
             </div>
             <div className="flex-1 min-w-[150px]">
               <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Método Pago</label>
               <select 
                 className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 text-sm py-2 px-3"
                 value={tipoPago}
                 onChange={e => setTipoPago(e.target.value)}
               >
                 <option>Efectivo</option>
                 <option>Transferencia</option>
                 <option>Tarjeta</option>
                 <option>Cheque</option>
                 <option>Crédito</option>
               </select>
             </div>
           </div>
        </div>

        {tipoPago === 'Transferencia' && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
               <AlertCircle size={24} />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Cuenta Destino (Titular Receptor)</label>
              <input 
                type="text" 
                placeholder="Nombre de la cuenta destino..." 
                className="w-full border-0 border-b-2 border-blue-200 bg-transparent px-0 py-2 text-sm focus:ring-0 focus:border-blue-600 text-blue-900 placeholder-blue-300 font-medium"
                value={cuentaDestino}
                onChange={(e) => setCuentaDestino(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Tabla de Carrito */}
        <div className="min-h-auto">
          <table className="w-full text-sm text-left border-collapse ">
            <thead className="bg-gray-100 text-gray-600 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-4 py-4 rounded-l-lg w-[35%]">Producto</th>
                <th className="px-2 py-4 w-[10%] text-center">Cant.</th>
                <th className="px-4 py-4 w-[25%]">Precio U.</th>
                <th className="px-4 py-4 w-[15%] text-right">Importe</th>
                <th className="px-4 py-4 text-center w-[15%]">Stock</th>
                <th className="px-2 py-4 rounded-r-lg w-[5%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {carrito.map((item, index) => (
                <tr key={item.idUnico} className="hover:bg-blue-50/40 relative group transition-colors">
                  <td className="px-4 py-3 align-top">
                    {/* INPUT DE BÚSQUEDA CON RENDER PERSONALIZADO */}
                    <SearchAndCreateInput<ProductoCatalogo>
                      label="" 
                      placeholder="Buscar por Nombre o SKU..."
                      searchApiUrl="/api/productos"
                      displayField="descripcion"
                      inputValue={item.nombreProducto}
                      onInputChange={(v) => actualizarFila(item.idUnico, 'nombreProducto', v)}
                      onSelect={(p) => {
                        actualizarFila(item.idUnico, 'producto', p);
                        actualizarFila(item.idUnico, 'nombreProducto', p.descripcion);
                      }}
                      onCreateNew={() => alert("Crear prod rápido (Pendiente)")}
                      renderItem={renderProductoItem} // <-- AQUÍ PASAMOS EL RENDERIZADOR NUEVO
                    />
                  </td>
                  <td className="px-2 py-3 align-top text-center">
                    <input 
                      type="number" 
                      className="w-full min-w-[4rem] border-gray-300 rounded-lg py-2 text-center font-bold text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                      value={item.cantidad === 0 ? '' : item.cantidad}
                      onChange={e => actualizarFila(item.idUnico, 'cantidad', Number(e.target.value))}
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-2">
                       {/* Switch Precio */}
                       {item.producto && (
                         <div className="flex bg-gray-100 rounded-lg p-1 w-full max-w-[200px]">
                           <button
                             type="button"
                             onClick={() => cambiarTipoPrecio(item.idUnico, 'MENUDEO')}
                             className={`flex-1 text-[10px] py-1 rounded-md font-bold transition-all ${
                               item.tipoPrecio === 'MENUDEO' 
                               ? 'bg-white text-gray-800 shadow-sm' 
                               : 'text-gray-400 hover:text-gray-600'
                             }`}
                           >
                             Público
                           </button>
                           <button
                             type="button"
                             onClick={() => cambiarTipoPrecio(item.idUnico, 'MAYOREO')}
                             className={`flex-1 text-[10px] py-1 rounded-md font-bold transition-all ${
                               item.tipoPrecio === 'MAYOREO' 
                               ? 'bg-green-100 text-green-700 shadow-sm' 
                               : 'text-gray-400 hover:text-gray-600'
                             }`}
                           >
                             Mayoreo
                           </button>
                         </div>
                       )}

                       <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-400 text-xs">$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            className={`w-full border rounded-lg pl-6 pr-3 py-1.5 transition-colors focus:ring-2 focus:ring-offset-1 ${
                              item.tipoPrecio === 'MAYOREO' 
                                ? 'border-green-300 bg-green-50 text-green-800 font-bold focus:ring-green-500' 
                                : 'border-gray-300 text-gray-800 focus:ring-blue-500'
                            }`}
                            value={item.precioUnitario === 0 ? '' : item.precioUnitario}
                            onChange={e => actualizarFila(item.idUnico, 'precioUnitario', Number(e.target.value))}
                          />
                       </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-700 align-middle text-right text-lg">
                    ${(item.cantidad * item.precioUnitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center align-middle">
                    <button
                      type="button"
                      onClick={() => abrirModalStock(item)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors w-full flex items-center justify-center gap-1 ${
                        item.inventarioValidado 
                          ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200' 
                          : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {item.inventarioValidado ? 'Listo' : 'Asignar'}
                    </button>
                  </td>
                  <td className="px-2 py-3 text-center align-middle">
                    <button 
                      type="button" 
                      onClick={() => eliminarFila(item.idUnico)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={agregarFila}
          className="flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 px-5 py-2.5 rounded-lg transition-colors border border-dashed border-blue-200 hover:border-blue-300 mt-2"
        >
          <Plus size={20} /> Añadir Producto
        </button>

        <div className="flex justify-end border-t border-gray-100 pt-6">
          <div className="w-64 space-y-2">
            <div className="flex justify-between items-center text-xl font-bold text-gray-800">
              <span>TOTAL</span>
              <span>${totalVenta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex-1 w-full md:w-auto">
           <label className="block text-sm text-gray-600 mb-1 font-medium">Nombre y Firma de quien expide</label>
           <input 
             className="border-gray-300 rounded-lg px-4 py-2.5 w-full md:w-80 focus:ring-blue-500 focus:border-blue-500" 
             placeholder="Escribe el nombre completo..."
             value={quienExpide}
             onChange={e => setQuienExpide(e.target.value)}
           />
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="bg-blue-600 text-white px-10 py-3.5 rounded-xl shadow-lg hover:bg-blue-700 transition-all transform active:scale-[0.98] flex items-center gap-3 font-bold text-lg w-full md:w-auto justify-center"
        >
          <Save size={24} /> {isSaving ? 'Guardando...' : 'Generar Nota de Venta'}
        </button>
      </div>

      <PersonaFormModal 
        isOpen={isClienteModalOpen}
        onClose={() => setIsClienteModalOpen(false)}
        onSaveSuccess={(c) => { setCliente(c); setClienteNombre(c.nombre_completo); setIsClienteModalOpen(false); }}
      />

      <SeleccionarInventarioModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        producto={productoParaStock?.producto}
        cantidadRequerida={productoParaStock?.cantidad || 0}
        onConfirm={confirmarStock}
      />

    </form>
  );
}