// components/ventas/NuevaVentaForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchAndCreateInput } from '@/components/ui/SearchAndCreateInput';
import { PersonaFormModal } from '@/components/personas/PersonaFormModal';
import { SeleccionarInventarioModal } from './SeleccionarInventarioModal';
import { Save, Ban, Plus, Trash2, Printer } from 'lucide-react';
import { NotaVentaImprimible } from './NotaVentaImprimible'; // Ver Paso 4

// Tipos
type Cliente = { id_persona: number; nombre_completo: string; [key: string]: any };
type Vehiculo = { id_vehiculo: number; matricula: string; marca: string; modelo: string; capacidad_carga_toneladas: number };
type ProductoCatalogo = { 
  id_producto_catalogo: number; 
  descripcion: string; 
  precio_venta: number;
  [key: string]: any 
};

// Tipo para la fila de producto en el carrito
type ProductoVenta = {
  idUnico: string;
  producto: ProductoCatalogo | null;
  nombreProducto: string;
  cantidad: number; // Cantidad total a vender
  precioUnitario: number;
  origenes: { id_stock: number; cantidad: number }[]; // De dónde sale
  inventarioValidado: boolean; // ¿Ya seleccionó el stock?
};

export function NuevaVentaForm() {
  const router = useRouter();
  
  // Estados del Formulario
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [clienteNombre, setClienteNombre] = useState('');
  
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [vehiculoMatricula, setVehiculoMatricula] = useState('');
  
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [tipoPago, setTipoPago] = useState('Efectivo');
  const [quienExpide, setQuienExpide] = useState(''); // Nombre libre

  const [carrito, setCarrito] = useState<ProductoVenta[]>([]);
  
  // Estados de Modales
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  
  // Estado para controlar qué producto se está configurando en el modal de stock
  const [productoParaStock, setProductoParaStock] = useState<{idUnico: string, producto: any, cantidad: number} | null>(null);

  // Estado para la vista previa de impresión
  const [ventaGuardada, setVentaGuardada] = useState<any | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // --- Lógica del Carrito ---

  const agregarFila = () => {
    setCarrito(prev => [
      ...prev,
      {
        idUnico: `prod-${Date.now()}`,
        producto: null,
        nombreProducto: '',
        cantidad: 0,
        precioUnitario: 0,
        origenes: [],
        inventarioValidado: false
      }
    ]);
  };

  const actualizarFila = (idUnico: string, campo: keyof ProductoVenta, valor: any) => {
    setCarrito(prev => prev.map(item => {
      if (item.idUnico === idUnico) {
        const nuevoItem = { ...item, [campo]: valor };
        
        // Si cambia producto o cantidad, invalidar la selección de stock
        if (campo === 'producto' || campo === 'cantidad') {
          nuevoItem.inventarioValidado = false;
          nuevoItem.origenes = [];
          if (campo === 'producto' && valor) {
             nuevoItem.precioUnitario = valor.precio_venta || 0;
          }
        }
        return nuevoItem;
      }
      return item;
    }));
  };

  const eliminarFila = (idUnico: string) => {
    setCarrito(prev => prev.filter(p => p.idUnico !== idUnico));
  };

  const abrirModalStock = (item: ProductoVenta) => {
    if (!item.producto || item.cantidad <= 0) {
      alert("Selecciona un producto y una cantidad mayor a 0 primero.");
      return;
    }
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

  // Cálculos
  const totalVenta = carrito.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);

  // --- Guardar Venta ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return alert("Selecciona un cliente");
    if (carrito.length === 0) return alert("Añade productos");
    if (carrito.some(p => !p.inventarioValidado)) {
      return alert("Hay productos sin asignación de inventario. Haz clic en 'Seleccionar Stock' en las filas rojas.");
    }

    setIsSaving(true);
    const token = localStorage.getItem('sessionToken');

    const payload = {
      id_cliente: cliente.id_persona,
      fecha_salida: fecha,
      tipo_pago: tipoPago,
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Éxito: Guardamos los datos completos (con cliente y vehiculo) para la impresión
      setVentaGuardada({
        ...data, // datos de la venta guardada (folio, id, etc)
        cliente,
        vehiculo,
        detalles: carrito.map(p => ({
          producto: p.producto,
          cantidad: p.cantidad,
          precio_unitario: p.precioUnitario,
          importe: p.cantidad * p.precioUnitario,
          // Mock de atributos para la impresión si no vienen en el producto seleccionado
          genero: p.producto?.atributos_madera?.genero || '',
          medidas: p.producto?.descripcion // O lógica de formateo de medidas
        })),
        quien_expide: quienExpide
      });

    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Si ya se guardó, mostrar vista de impresión
  if (ventaGuardada) {
    return (
      <div className="text-center">
        <div className="mb-4 bg-green-100 p-4 rounded text-green-800">
          ✅ Venta registrada exitosamente. Folio: <strong>{ventaGuardada.folio_nota}</strong>
        </div>
        <NotaVentaImprimible datos={ventaGuardada} />
        <div className="mt-6 flex justify-center gap-4">
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2">
            <Printer size={20} /> Imprimir Nota
          </button>
          <button onClick={() => router.refresh()} className="bg-gray-200 text-gray-800 px-6 py-2 rounded">
            Nueva Venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      
      {/* 1. Cliente y Vehículo */}
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
        <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">1. Datos del Cliente y Transporte</h2>
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {/* Campos informativos solo lectura */}
           <div className="bg-gray-50 p-2 rounded">
             <label className="text-xs text-gray-500">Dirección</label>
             <p className="text-sm font-medium">{cliente?.domicilio_poblacion || '-'}</p>
           </div>
           <div className="bg-gray-50 p-2 rounded">
             <label className="text-xs text-gray-500">Marca/Modelo</label>
             <p className="text-sm font-medium">{vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}` : '-'}</p>
           </div>
           <div className="bg-gray-50 p-2 rounded">
             <label className="text-xs text-gray-500">Capacidad</label>
             <p className="text-sm font-medium">{vehiculo?.capacidad_carga_toneladas || '-'} Ton</p>
           </div>
        </div>
      </div>

      {/* 2. Detalles de Venta */}
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
        <div className="flex justify-between items-center border-b pb-2">
           <h2 className="text-lg font-semibold text-gray-700">2. Productos</h2>
           <div className="flex gap-4">
             <input 
               type="date" 
               className="border rounded px-2 py-1 text-sm" 
               value={fecha} 
               onChange={e => setFecha(e.target.value)} 
             />
             <select 
               className="border rounded px-2 py-1 text-sm"
               value={tipoPago}
               onChange={e => setTipoPago(e.target.value)}
             >
               <option>Efectivo</option>
               <option>Transferencia</option>
               <option>Crédito</option>
             </select>
           </div>
        </div>

        {/* Tabla de Carrito */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 uppercase">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Producto</th>
                <th className="px-4 py-3 w-24">Cant.</th>
                <th className="px-4 py-3 w-32">Precio U.</th>
                <th className="px-4 py-3 w-32">Importe</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 rounded-r-lg w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {carrito.map((item) => (
                <tr key={item.idUnico} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <SearchAndCreateInput<ProductoCatalogo>
                      label="" // Sin label dentro de la tabla
                      placeholder="Buscar producto..."
                      searchApiUrl="/api/productos"
                      displayField="descripcion"
                      inputValue={item.nombreProducto}
                      onInputChange={(v) => actualizarFila(item.idUnico, 'nombreProducto', v)}
                      onSelect={(p) => {
                        actualizarFila(item.idUnico, 'producto', p);
                        actualizarFila(item.idUnico, 'nombreProducto', p.descripcion);
                      }}
                      onCreateNew={() => alert("Crear prod rápido")}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="number" 
                      className="w-full border rounded px-2 py-1"
                      value={item.cantidad === 0 ? '' : item.cantidad}
                      onChange={e => actualizarFila(item.idUnico, 'cantidad', Number(e.target.value))}
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1 text-gray-500">$</span>
                      <input 
                        type="number" 
                        className="w-full border rounded pl-5 pr-2 py-1"
                        value={item.precioUnitario === 0 ? '' : item.precioUnitario}
                        onChange={e => actualizarFila(item.idUnico, 'precioUnitario', Number(e.target.value))}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2 font-bold text-gray-700">
                    ${(item.cantidad * item.precioUnitario).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => abrirModalStock(item)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        item.inventarioValidado 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-red-100 text-red-700 border border-red-200 animate-pulse'
                      }`}
                    >
                      {item.inventarioValidado ? 'Listo ✅' : 'Seleccionar Stock'}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button 
                      type="button" 
                      onClick={() => eliminarFila(item.idUnico)}
                      className="text-red-500 hover:bg-red-50 p-1 rounded"
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
          className="flex items-center gap-2 text-blue-600 font-medium hover:bg-blue-50 px-4 py-2 rounded transition-colors"
        >
          <Plus size={18} /> Añadir Fila
        </button>

        {/* Totales */}
        <div className="flex justify-end border-t pt-4">
          <div className="w-64 space-y-2">
            <div className="flex justify-between items-center text-lg font-bold text-gray-800">
              <span>TOTAL</span>
              <span>${totalVenta.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center">
        <div className="flex-1">
           <label className="block text-sm text-gray-600 mb-1">Nombre y Firma de quien expide</label>
           <input 
             className="border rounded px-3 py-2 w-64" 
             placeholder="Nombre completo"
             value={quienExpide}
             onChange={e => setQuienExpide(e.target.value)}
           />
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="bg-blue-700 text-white px-8 py-3 rounded-lg shadow-lg hover:bg-blue-800 transition-transform transform active:scale-95 flex items-center gap-2 font-bold text-lg"
        >
          <Save size={24} /> {isSaving ? 'Procesando...' : 'Generar Nota de Venta'}
        </button>
      </div>

      {/* Modales */}
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