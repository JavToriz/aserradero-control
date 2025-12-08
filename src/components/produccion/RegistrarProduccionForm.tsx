// components/produccion/RegistrarProduccionForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Ban, Plus, Trash2 } from 'lucide-react';
import { SearchAndCreateInput } from '@/components/ui/SearchAndCreateInput';
import { calcularMetrosCubicos } from '@/lib/calculations';
import { ProductoCatalogoFormModal } from '@/components/productos/ProductoCatalogoFormModal';

// --- TIPOS ---
type OrdenAserrado = {
  id_orden_aserrado: number;
  fecha_aserrado: string;
  especie: string;
  total_m3_rollo_consumido: number;
};

type ProductoCatalogo = {
  id_producto_catalogo: number;
  descripcion: string;
  tipo_categoria: 'MADERA_ASERRADA' | 'TRIPLAY_AGLOMERADO';
  atributos_madera?: { 
    genero: string; tipo: string; clasificacion: string; 
    grosor_pulgadas: number; ancho_pulgadas: number; largo_pies: number 
  } | null;
  atributos_triplay?: { 
    genero: string; tipo: string; procedencia: string;
    espesor_mm: number; ancho_ft: number; largo_ft: number 
  } | null;
  [key: string]: any;
};

type ProductoFila = {
  idUnico: string;
  producto: ProductoCatalogo | null;
  productoNombre: string;
  piezas: number;
  total_m3: number;
  ubicacion: 'PRODUCCION' | 'SECADO' | 'BODEGA' | 'ANAQUELES';
};

interface RegistrarProduccionFormProps {
  onSaveSuccess: (resultado: any) => void;
}

const UBICACIONES_INICIALES = ['PRODUCCION', 'SECADO', 'BODEGA', 'ANAQUELES'];

export function RegistrarProduccionForm({ onSaveSuccess }: RegistrarProduccionFormProps) {
  const router = useRouter();
  const getToken = () => localStorage.getItem('sessionToken');

  const [fecha_ingreso, setFechaIngreso] = useState(new Date().toISOString().split('T')[0]);
  const [ordenAserradoId, setOrdenAserradoId] = useState<number | null>(null);
  const [listaOrdenes, setListaOrdenes] = useState<OrdenAserrado[]>([]);
  const [productos, setProductos] = useState<ProductoFila[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filaParaModal, setFilaParaModal] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrdenes = async () => {
      const token = getToken();
      try {
        const res = await fetch('/api/ordenes-aserrado', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('No se pudieron cargar las órdenes');
        const data = await res.json();
        setListaOrdenes(data);
      } catch (err: any) {
        console.error(err);
      }
    };
    fetchOrdenes();
  }, []);

  const handleAddRow = () => {
    setProductos(prev => [
      ...prev,
      {
        idUnico: `fila-${Date.now()}`,
        producto: null,
        productoNombre: '',
        piezas: 0,
        total_m3: 0,
        ubicacion: 'PRODUCCION',
      }
    ]);
  };

  const handleRemoveRow = (idUnico: string) => {
    setProductos(prev => prev.filter(p => p.idUnico !== idUnico));
  };

  const updateFila = (idUnico: string, campo: keyof ProductoFila, valor: any) => {
    setProductos(prev => 
      prev.map(fila => {
        if (fila.idUnico === idUnico) {
          const nuevaFila = { ...fila, [campo]: valor };

          if (campo === 'producto' || campo === 'piezas') {
            const piezas = (campo === 'piezas') ? (valor === '' ? 0 : Number(valor)) : fila.piezas;
            const producto = (campo === 'producto') ? (valor as ProductoCatalogo | null) : fila.producto;
            nuevaFila.total_m3 = calcularMetrosCubicos(producto, piezas);
          }
          return nuevaFila;
        }
        return fila;
      })
    );
  };

  const handleOpenModal = (idUnico: string) => {
    setFilaParaModal(idUnico);
    setIsModalOpen(true);
  };

  const handleModalSaveSuccess = (nuevoProducto: ProductoCatalogo) => {
    if (filaParaModal) {
      updateFila(filaParaModal, 'producto', nuevoProducto);
      updateFila(filaParaModal, 'productoNombre', nuevoProducto.descripcion);
    }
    setIsModalOpen(false);
    setFilaParaModal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    if (productos.length === 0) {
      setError('Debes añadir al menos un producto.');
      setIsSaving(false);
      return;
    }
    if (productos.some(p => !p.producto || p.piezas <= 0)) {
      setError('Todas las filas deben tener un producto seleccionado y piezas mayor a cero.');
      setIsSaving(false);
      return;
    }

    const datosParaApi = {
      id_orden_aserrado_origen: ordenAserradoId,
      fecha_ingreso: fecha_ingreso,
      productos: productos.map(p => ({
        id_producto_catalogo: p.producto!.id_producto_catalogo,
        piezas_actuales: p.piezas,
        ubicacion: p.ubicacion,
      }))
    };

    try {
      const token = getToken();
      const response = await fetch('/api/stock-producto-terminado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosParaApi),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Error al guardar la producción');

      onSaveSuccess(result);

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Función helper para renderizar los detalles del producto en el buscador
  const renderProductoItem = (item: ProductoCatalogo) => {
    let detalles = '';
    let medidas = '';

    if (item.tipo_categoria === 'MADERA_ASERRADA' && item.atributos_madera) {
      const { genero, clasificacion, grosor_pulgadas, ancho_pulgadas, largo_pies } = item.atributos_madera;
      detalles = `${genero || ''} - ${clasificacion || ''}`;
      medidas = `${grosor_pulgadas}" x ${ancho_pulgadas}" x ${largo_pies}'`;
    } else if (item.tipo_categoria === 'TRIPLAY_AGLOMERADO' && item.atributos_triplay) {
      const { genero, tipo, espesor_mm, ancho_ft, largo_ft } = item.atributos_triplay;
      detalles = `${genero || ''} ${tipo || ''}`;
      medidas = `${espesor_mm}mm x ${ancho_ft}' x ${largo_ft}'`;
    }

    return (
      <div className="flex flex-col py-1">
        <span className="font-medium text-gray-800">{item.descripcion}</span>
        <div className="flex justify-between text-xs text-gray-500 mt-0.5">
          <span>{detalles}</span>
          <span className="font-semibold bg-gray-100 px-1 rounded">{medidas}</span>
        </div>
      </div>
    );
  };


  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        
        <FormSection title="1. Datos Generales de Producción">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Fecha de Producción / Ingreso" 
              name="fecha_ingreso" 
              type="date" 
              value={fecha_ingreso} 
              onChange={(e) => setFechaIngreso(e.target.value)} 
              required 
            />
            <Select 
              label="Orden de Aserrado de Origen (Opcional)"
              value={ordenAserradoId || ''}
              onChange={(e) => setOrdenAserradoId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">-- No vincular --</option>
              {listaOrdenes.map(orden => (
                <option key={orden.id_orden_aserrado} value={orden.id_orden_aserrado}>
                  {new Date(orden.fecha_aserrado).toLocaleDateString()} - {orden.especie} ({orden.total_m3_rollo_consumido} m³)
                </option>
              ))}
            </Select>
          </div>
        </FormSection>

        <FormSection title="2. Productos Creados">
          <div className="space-y-4">
            {productos.map((fila, index) => (
              <div key={fila.idUnico} className="grid grid-cols-12 gap-x-4 gap-y-2 p-4 border rounded-lg bg-gray-50">
                
                <div className="col-span-12 md:col-span-5">
                  <SearchAndCreateInput<ProductoCatalogo>
                    label={`Producto #${index + 1}`}
                    placeholder="Buscar por SKU o descripción..."
                    searchApiUrl="/api/productos"
                    displayField="descripcion"
                    inputValue={fila.productoNombre}
                    onInputChange={(value) => {
                      updateFila(fila.idUnico, 'productoNombre', value);
                      if (fila.producto) updateFila(fila.idUnico, 'producto', null);
                    }}
                    onSelect={(item) => {
                      updateFila(fila.idUnico, 'producto', item);
                      updateFila(fila.idUnico, 'productoNombre', item.descripcion);
                    }}
                    onCreateNew={() => handleOpenModal(fila.idUnico)}
                    renderItem={renderProductoItem} // <-- USAMOS EL RENDERIZADO PERSONALIZADO
                  />
                </div>
                
                <div className="col-span-6 md:col-span-2">
                  <Input 
                    label="Piezas" 
                    type="number" 
                    min="0"
                    // UX Fix: Si es 0, mostramos cadena vacía para que no estorbe el 0
                    value={fila.piezas === 0 ? '' : fila.piezas} 
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                      updateFila(fila.idUnico, 'piezas', val);
                    }}
                    placeholder="0"
                  />
                </div>

                <div className="col-span-6 md:col-span-2">
                  <Input 
                    label="Total m³" 
                    type="number" 
                    value={fila.total_m3} 
                    readOnly 
                    className="bg-gray-200"
                  />
                </div>

                <div className="col-span-10 md:col-span-2">
                  <Select 
                    label="Ubicación"
                    value={fila.ubicacion}
                    onChange={(e) => updateFila(fila.idUnico, 'ubicacion', e.target.value)}
                  >
                    {UBICACIONES_INICIALES.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </Select>
                </div>
                
                <div className="col-span-2 md:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(fila.idUnico)}
                    className="p-2 text-red-500 hover:text-red-700 h-10"
                    title="Eliminar fila"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            <Plus size={16} />
            Añadir Producto
          </button>
        </FormSection>

        <div className="border-t pt-6 flex justify-end gap-4">
          {error && <p className="text-red-600 text-sm my-auto mr-4">Error: {error}</p>}
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSaving}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Ban size={18} />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? 'Registrando...' : 'Registrar Producción'}
          </button>
        </div>
      </form>

      <ProductoCatalogoFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={handleModalSaveSuccess}
      />
    </>
  );
}

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <fieldset className="space-y-4">
    <legend className="text-lg font-semibold text-gray-700 mb-4">{title}</legend>
    {children}
  </fieldset>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
const Input: React.FC<InputProps> = ({ label, className, ...props }) => (
  <div className="w-full">
    <label htmlFor={props.name} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      id={props.name}
      {...props}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: React.ReactNode;
}
const Select: React.FC<SelectProps> = ({ label, children, ...props }) => (
  <div className="w-full">
    <label htmlFor={props.name} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <select
      id={props.name}
      {...props}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </select>
  </div>
);