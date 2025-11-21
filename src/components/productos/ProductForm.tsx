// src/components/productos/ProductForm.tsx
'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

// Define the structure of your form data
type FormData = {
  //id_aserradero: number;
  descripcion: string;
  sku: string;
  unidad_medida: string;
  precio_venta: number;
  precio_compra: number;
  //stock: number;
  // Atributos de Madera
  genero?: string;
  tipo?: string;
  clasificacion?: string;
  ancho_pulgadas?: number;
  grosor_pulgadas?: number;
  largo_pies?: number;
  // Atributos de Triplay
  procedencia?: string;
  espesor_mm?: number;
  largo_ft?: number;
  ancho_ft?: number;
};

interface ProductFormProps {
  productType: 'MADERA_ASERRADA' | 'TRIPLAY_AGLOMERADO';
  initialData?: any; // Data for editing an existing product
  onSave: () => void; // Esta prop la usaremos para cerrar el modal y recargar
  onCancel: () => void; // Nueva prop para manejar la cancelación
}

export const ProductForm = ({ productType, initialData, onSave, onCancel }: ProductFormProps) => {
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>();
  
  // Determine if we are in 'edit' mode
  const isEditMode = !!initialData;

  useEffect(() => {
    // If we have initialData (i.e., we're editing), populate the form
    if (initialData) {
      const { atributos_madera, atributos_triplay, ...productData } = initialData;
      const attributes = productType === 'MADERA_ASERRADA' ? atributos_madera : atributos_triplay;
      reset({ ...productData, ...attributes });
    } else {
      // Reset to default values when creating a new product or switching tabs
      reset({
        descripcion: '',
        sku: '',
        unidad_medida: 'pieza',
        precio_venta: 0,
        precio_compra: 0,
        //stock: 0,
        genero: '',
        tipo: '',
        clasificacion: '',
        ancho_pulgadas: 0,
        grosor_pulgadas: 0,
        largo_pies: 0,
        procedencia: '',
        espesor_mm: 0,
        largo_ft: 0,
        ancho_ft: 0,
      });
    }
  }, [initialData, productType, reset]);

  const processForm = async (data: FormData) => {
    // 1. Separate product data from attributes data
    const productData: any = {
      descripcion: data.descripcion,
      sku: data.sku,
      unidad_medida: data.unidad_medida,
      precio_venta: Number(data.precio_venta),
      precio_compra: Number(data.precio_compra),
      //stock: Number(data.stock),
      //id_aserradero: 2, // IMPORTANT: Get this from user session or context
      tipo_categoria: productType,
    };

    const attributesData: any = {};
    if (productType === 'MADERA_ASERRADA') {
        attributesData.genero = data.genero;
        attributesData.tipo = data.tipo;
        attributesData.clasificacion = data.clasificacion;
        attributesData.ancho_pulgadas = Number(data.ancho_pulgadas);
        attributesData.grosor_pulgadas = Number(data.grosor_pulgadas);
        attributesData.largo_pies = Number(data.largo_pies);
    } else {
        attributesData.genero = data.genero;
        attributesData.procedencia = data.procedencia;
        attributesData.tipo = data.tipo;
        attributesData.espesor_mm = Number(data.espesor_mm);
        attributesData.largo_ft = Number(data.largo_ft);
        attributesData.ancho_ft = Number(data.ancho_ft);
    }

    const payload = { ...productData, atributos: attributesData };
    
    // 2. Determine API endpoint and method
    const apiEndpoint = isEditMode ? `/api/productos/${initialData.id_producto_catalogo}` : '/api/productos';
    const method = isEditMode ? 'PUT' : 'POST';

    // 3. Make the API call
    try {
        const token = localStorage.getItem('sessionToken');
        const response = await fetch(apiEndpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            // Si la respuesta es 409, muestra el mensaje de error del API
            if (response.status === 409) {
                const errorData = await response.json();
                alert(errorData.message); // Muestra "El SKU "..." ya existe."
            } else {
                throw new Error(`Error: ${response.statusText}`);
            }
            return; // Detiene la ejecución
        }

        alert(`Producto ${isEditMode ? 'actualizado' : 'creado'} con éxito!`);
        onSave(); // Trigger callback to close modal and refresh data
        if (!isEditMode) {
            router.push('/productos');
        }

    } catch (error) {
        console.error("Failed to save product:", error);
        alert("Ocurrió un error al guardar el producto.");
    }
  };

  return (
    <form onSubmit={handleSubmit(processForm)} className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Datos Generales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <input {...register("descripcion", { required: "La descripción es obligatoria" })} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion.message}</p>}
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">SKU: </label>
            <input {...register("sku")} placeholder="Opcional" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku.message}</p>}
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Precio de venta: </label>
            <input {...register("precio_venta",{ required: "El precio de venta es obligatorio" })}  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            {errors.precio_venta && <p className="text-red-500 text-xs mt-1">{errors.precio_venta.message}</p>}
          </div>
          {/* Add other general fields like SKU, Unidad, Precio etc. in a similar pattern */}
          { productType === 'TRIPLAY_AGLOMERADO' && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Precio de Compra: </label>
              <input  
                {...register("precio_compra")} 
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
              />
              {errors.precio_compra && <p className="text-red-500 text-xs mt-1">{errors.precio_compra.message}</p>}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Atributos y Medidas</h3>
        {productType === 'MADERA_ASERRADA' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fields for Madera */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Género</label>
              <input {...register("genero")} placeholder="Ej: Pino" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <input {...register("tipo")} placeholder="Ej: Tabla, Viga" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Clasificación</label>
              <select {...register("clasificacion")} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
                <option value="">Seleccionar...</option>
                <option value="Primera">Primera</option>
                <option value="Segunda">Segunda</option>
                <option value="Tercera">Tercera</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Grosor (pulgadas)</label>
              <input type="number" step="0.01" {...register("grosor_pulgadas")} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ancho (pulgadas)</label>
              <input type="number" step="0.01" {...register("ancho_pulgadas")} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Largo (pies)</label>
              <input type="number" step="0.01" {...register("largo_pies")} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
            </div>
          </div>
        )}

        {productType === 'TRIPLAY_AGLOMERADO' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fields for Triplay */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Género</label>
              <input {...register("genero")} placeholder="Ej: Caobilla" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Procedencia</label>
              <input {...register("procedencia")} placeholder="Ej: Nacional, Chileno" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <input {...register("tipo")} placeholder="Ej: Triplay, MDF" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Espesor (mm)</label>
              <input type="number" {...register("espesor_mm")} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Largo (ft)</label>
              <input type="number" step="0.01" {...register("largo_ft")} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ancho (ft)</label>
              <input type="number" step="0.01" {...register("ancho_ft")} className="mt-1 block w-full px-3 py-2 bg-white border border-ray-300 rounded-md shadow-sm" />
            </div>
           </div>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button type="button" onClick={onSave} className="bg-gray-200 text-gray-800 font-semibold px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center gap-2">
            {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
        </button>
      </div>
    </form>
  );
};