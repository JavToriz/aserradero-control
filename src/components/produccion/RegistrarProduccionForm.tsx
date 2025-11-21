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

// Tipo para el producto del catálogo (lo que buscamos)
type ProductoCatalogo = {
  id_producto_catalogo: number;
  descripcion: string;
  tipo_categoria: 'MADERA_ASERRADA' | 'TRIPLAY_AGLOMERADO';
  atributos_madera?: { grosor_pulgadas: number; ancho_pulgadas: number; largo_pies: number } | null;
  atributos_triplay?: { espesor_mm: number; ancho_ft: number; largo_ft: number } | null;
  [key: string]: any;
};

// Tipo para la fila dinámica en nuestro formulario
type ProductoFila = {
  idUnico: string; // Para el 'key' de React
  producto: ProductoCatalogo | null;
  productoNombre: string; // Para el valor del input de búsqueda
  piezas: number;
  total_m3: number;
  ubicacion: 'PRODUCCION' | 'SECADO' | 'BODEGA' | 'ANAQUELES';
};

// Prop para el callback de éxito
interface RegistrarProduccionFormProps {
  onSaveSuccess: (resultado: any) => void;
}

// Opciones de ubicación inicial (según tu schema Enum)
const UBICACIONES_INICIALES = ['PRODUCCION', 'SECADO', 'BODEGA', 'ANAQUELES'];

export function RegistrarProduccionForm({ onSaveSuccess }: RegistrarProduccionFormProps) {
  const router = useRouter();
  const getToken = () => localStorage.getItem('sessionToken');

  // --- ESTADOS ---
  const [fecha_ingreso, setFechaIngreso] = useState(new Date().toISOString().split('T')[0]);
  const [ordenAserradoId, setOrdenAserradoId] = useState<number | null>(null);
  const [listaOrdenes, setListaOrdenes] = useState<OrdenAserrado[]>([]);
  const [productos, setProductos] = useState<ProductoFila[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filaParaModal, setFilaParaModal] = useState<string | null>(null); // 'idUnico' de la fila

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar las órdenes de aserrado para el <select>
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

  // --- MANEJADORES DE LA LISTA DINÁMICA ---

  const handleAddRow = () => {
    setProductos(prev => [
      ...prev,
      {
        idUnico: `fila-${Date.now()}`,
        producto: null,
        productoNombre: '',
        piezas: 0,
        total_m3: 0,
        ubicacion: 'PRODUCCION', // Default
      }
    ]);
  };

  const handleRemoveRow = (idUnico: string) => {
    setProductos(prev => prev.filter(p => p.idUnico !== idUnico));
  };

  // Actualiza una fila
  const updateFila = (idUnico: string, campo: keyof ProductoFila, valor: any) => {
    setProductos(prev => 
      prev.map(fila => {
        if (fila.idUnico === idUnico) {
          const nuevaFila = { ...fila, [campo]: valor };

          // Recalcular m³ si cambia el producto o las piezas
          if (campo === 'producto' || campo === 'piezas') {
            const piezas = (campo === 'piezas') ? Number(valor) : fila.piezas;
            const producto = (campo === 'producto') ? (valor as ProductoCatalogo | null) : fila.producto;
            nuevaFila.total_m3 = calcularMetrosCubicos(producto, piezas);
          }
          return nuevaFila;
        }
        return fila;
      })
    );
  };

  // --- MANEJADORES DE MODAL ---

  const handleOpenModal = (idUnico: string) => {
    setFilaParaModal(idUnico); // Guardamos la fila que está siendo editada
    setIsModalOpen(true);
  };

  const handleModalSaveSuccess = (nuevoProducto: ProductoCatalogo) => {
    if (filaParaModal) {
      // Auto-seleccionar el producto recién creado en la fila
      updateFila(filaParaModal, 'producto', nuevoProducto);
      updateFila(filaParaModal, 'productoNombre', nuevoProducto.descripcion);
    }
    setIsModalOpen(false);
    setFilaParaModal(null);
  };

  // --- SUBMIT ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Validación
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

    // Formatear datos para la API
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


  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECCIÓN 1: DATOS GENERALES */}
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

        {/* SECCIÓN 2: PRODUCTOS CREADOS (LISTA DINÁMICA) */}
        <FormSection title="2. Productos Creados">
          <div className="space-y-4">
            {productos.map((fila, index) => (
              <div key={fila.idUnico} className="grid grid-cols-12 gap-x-4 gap-y-2 p-4 border rounded-lg bg-gray-50">
                
                {/* Col 1: Producto (Buscador) */}
                <div className="col-span-12 md:col-span-5">
                  <SearchAndCreateInput<ProductoCatalogo>
                    label={`Producto #${index + 1}`}
                    placeholder="Buscar por SKU o descripción..."
                    searchApiUrl="/api/productos"
                    displayField="descripcion"
                    inputValue={fila.productoNombre}
                    onInputChange={(value) => {
                      updateFila(fila.idUnico, 'productoNombre', value);
                      if (fila.producto) updateFila(fila.idUnico, 'producto', null); // Limpiar si se edita
                    }}
                    onSelect={(item) => {
                      updateFila(fila.idUnico, 'producto', item);
                      updateFila(fila.idUnico, 'productoNombre', item.descripcion);
                    }}
                    onCreateNew={() => handleOpenModal(fila.idUnico)}
                  />
                </div>
                
                {/* Col 2: Cantidad (Piezas) */}
                <div className="col-span-6 md:col-span-2">
                  <Input 
                    label="Piezas" 
                    type="number" 
                    min="0"
                    value={fila.piezas} 
                    onChange={(e) => updateFila(fila.idUnico, 'piezas', Number(e.target.value))}
                  />
                </div>

                {/* Col 3: Total m³ (Calculado) */}
                <div className="col-span-6 md:col-span-2">
                  <Input 
                    label="Total m³" 
                    type="number" 
                    value={fila.total_m3} 
                    readOnly 
                    className="bg-gray-200"
                  />
                </div>

                {/* Col 4: Ubicación */}
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
                
                {/* Col 5: Eliminar Fila */}
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

          {/* Botón para añadir nueva fila */}
          <button
            type="button"
            onClick={handleAddRow}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            <Plus size={16} />
            Añadir Producto
          </button>
        </FormSection>

        {/* BOTONES DE ACCIÓN */}
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

      {/* Modal para crear nuevo producto del catálogo */}
      <ProductoCatalogoFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={handleModalSaveSuccess}
      />
    </>
  );
}

// --- Componentes de UI genéricos (copiados del form anterior) ---
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