// src/components/productos/ProductForm.tsx
'use client';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';

// Define the structure of your form data
type FormData = {
  descripcion: string;
  sku: string;
  // unidad_medida eliminado
  precio_venta: number;
  precio_mayoreo: number;
  precio_compra: number;
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
  initialData?: any; 
  onSave: () => void; 
  onCancel: () => void; 
}

export const ProductForm = ({ productType, initialData, onSave, onCancel }: ProductFormProps) => {
  const router = useRouter();
  const { register, handleSubmit, reset, setValue, control, formState: { errors, isSubmitting } } = useForm<FormData>();
  const [isCalculating, setIsCalculating] = useState(false);
  
  const isEditMode = !!initialData;

  // --- WATCHERS: Escuchamos cambios en tiempo real ---
  const watchedValues = useWatch({ control });

  // Función para generar un sufijo aleatorio corto (para unicidad del SKU)
  const generateSuffix = () => Math.random().toString(36).substring(2, 6).toUpperCase();

  // Efecto para autogenerar SKU, Descripción y Calcular Precio
  useEffect(() => {
    // Solo autogeneramos si NO estamos editando un producto existente (para no sobrescribir datos históricos)
    // O si el usuario explícitamente quiere regenerar (podríamos añadir un botón para eso)
    if (!isEditMode) {
      if (productType === 'MADERA_ASERRADA') {
        const { genero, tipo, clasificacion, grosor_pulgadas, ancho_pulgadas, largo_pies } = watchedValues;
        
        if (genero && tipo && clasificacion && grosor_pulgadas && ancho_pulgadas && largo_pies) {
          
          // 1. Generar SKU Base (Legible)
          const g = genero.substring(0, 3).toUpperCase();
          const t = tipo.substring(0, 3).toUpperCase();
          const c = clasificacion.substring(0, 3).toUpperCase();
          const dim = `${grosor_pulgadas}x${ancho_pulgadas}x${largo_pies}`;
          
          // Añadimos sufijo aleatorio para garantizar unicidad casi total sin consulta a BD
          const suffix = generateSuffix();
          const newSku = `${g}-${t}-${c}-${dim}-${suffix}`; 
          
          // Solo actualizamos si el campo está vacío o parece autogenerado (esto es opcional, aquí lo forzamos)
          setValue('sku', newSku);

          // 2. Generar Descripción
          const newDesc = `${tipo} de ${genero} ${clasificacion} ${grosor_pulgadas}" x ${ancho_pulgadas}" x ${largo_pies}'`;
          setValue('descripcion', newDesc);

          // 3. Calcular Precio
          calcularPrecio(genero, clasificacion, grosor_pulgadas, ancho_pulgadas, largo_pies);
        }
      } else if (productType === 'TRIPLAY_AGLOMERADO') {
         // Lógica similar para Triplay
         const { genero, tipo, espesor_mm, ancho_ft, largo_ft, procedencia } = watchedValues;
         if (genero && tipo && espesor_mm && ancho_ft && largo_ft) {
            const g = genero.substring(0, 3).toUpperCase();
            const t = tipo.substring(0, 3).toUpperCase();
            const dim = `${espesor_mm}MM-${ancho_ft}-${largo_ft}`;
            const suffix = generateSuffix();
            setValue('sku', `${g}-${t}-${dim}-${suffix}`);
            setValue('descripcion', `${tipo} ${genero} ${procedencia || ''} ${espesor_mm}mm ${ancho_ft}'x${largo_ft}'`);
         }
      }
    }
  }, [
    watchedValues.genero, watchedValues.tipo, watchedValues.clasificacion, 
    watchedValues.grosor_pulgadas, watchedValues.ancho_pulgadas, watchedValues.largo_pies,
    watchedValues.espesor_mm, watchedValues.ancho_ft, watchedValues.largo_ft, watchedValues.procedencia,
    productType, setValue, isEditMode
  ]);

  const calcularPrecio = async (genero: string, clasificacion: string, grosor: number, ancho: number, largo: number) => {
    setIsCalculating(true);
    try {
      const token = localStorage.getItem('sessionToken');
      const res = await fetch('/api/precios/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          genero,
          clasificacion,
          grosor,
          ancho,
          largo
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.found) {
          setValue('precio_venta', data.precio_venta);
          setValue('precio_mayoreo', data.precio_mayoreo);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculating(false);
    }
  };

  // Carga de datos iniciales (Edición)
  useEffect(() => {
    if (initialData) {
      const { atributos_madera, atributos_triplay, ...productData } = initialData;
      const attributes = productType === 'MADERA_ASERRADA' ? atributos_madera : atributos_triplay;
      // Mapeamos los datos, asegurándonos de convertir a número lo necesario
      reset({ 
        ...productData, 
        ...attributes,
        // Asegurar que precios sean números para los inputs
        precio_venta: Number(productData.precio_venta),
        precio_mayoreo: Number(productData.precio_mayoreo),
        precio_compra: Number(productData.precio_compra)
      });
    } else {
      reset({
        descripcion: '',
        sku: '',
        // unidad_medida removido
        precio_venta: 0,
        precio_mayoreo: 0,
        precio_compra: 0,
        genero: '', 
        tipo: '',
        clasificacion: 'Primera',
        ancho_pulgadas: 0,
        grosor_pulgadas: 0,
        largo_pies: 0,
        // ...triplay defaults
        espesor_mm: 0,
        ancho_ft: 0,
        largo_ft: 0
      });
    }
  }, [initialData, productType, reset]);

  const processForm = async (data: FormData) => {
    const productData: any = {
      descripcion: data.descripcion,
      sku: data.sku,
      unidad_medida: 'Pieza', // Valor por defecto interno ya que quitamos el input
      precio_venta: Number(data.precio_venta),
      precio_mayoreo: Number(data.precio_mayoreo),
      precio_compra: Number(data.precio_compra),
      tipo_categoria: productType,
      es_precio_automatico: true,
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
    const apiEndpoint = isEditMode ? `/api/productos/${initialData.id_producto_catalogo}` : '/api/productos';
    const method = isEditMode ? 'PUT' : 'POST';

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
            if (response.status === 409) {
                const errorData = await response.json();
                alert(errorData.message); 
            } else {
                throw new Error(`Error: ${response.statusText}`);
            }
            return; 
        }

        // alert(`Producto ${isEditMode ? 'actualizado' : 'creado'} con éxito!`); // Opcional si usas el SuccessModal afuera
        onSave(); 
        if (!isEditMode) {
            router.push('/productos');
        }

    } catch (error) {
        console.error("Failed to save product:", error);
        alert("Ocurrió un error al guardar el producto.");
    }
  };

  // Función para regenerar SKU manualmente si el usuario quiere otro random
  const regenerarSku = () => {
     const currentSku = watchedValues.sku || '';
     const parts = currentSku.split('-');
     if (parts.length >= 4) {
        // Mantenemos la base y cambiamos el sufijo
        const base = parts.slice(0, -1).join('-');
        setValue('sku', `${base}-${generateSuffix()}`);
     }
  };

  return (
    <form onSubmit={handleSubmit(processForm)} className="space-y-8">
      
      {/* SECCIÓN 1: ATRIBUTOS Y MEDIDAS (Arriba) */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 shadow-sm">
        <h3 className="text-lg font-bold text-blue-900 mb-4 border-b border-blue-200 pb-2 flex items-center gap-2">
          1. Características del Producto
          <span className="text-xs font-normal text-blue-600 ml-auto bg-blue-100 px-2 py-1 rounded">Define las medidas para calcular precio</span>
        </h3>
        
        {productType === 'MADERA_ASERRADA' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Género</label>
              <select {...register("genero", { required: true })} className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                <option value="Pino">Pino</option>
                <option value="Oyamel">Oyamel</option>
                <option value="Nogal">Nogal</option>
                <option value="Ayacahuite">Ayacahuite</option>
                <option value="Cedro">Cedro</option>
                <option value="Roble">Roble</option>
                <option value="Parota">Parota</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
              <select {...register("tipo", { required: true })} className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                <option value="Tabla">Tabla</option>
                <option value="Viga">Viga</option>
                <option value="Polin">Polín</option>
                <option value="Barrote">Barrote</option>
                <option value="Costera">Costera</option>
                <option value="Tablon">Tablon</option>
                <option value="Tableta">Tableta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Clasificación</label>
              <select {...register("clasificacion", { required: true })} className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                <option value="Primera">Primera</option>
                <option value="Segunda">Segunda</option>
                <option value="Tercera">Tercera</option>
              </select>
            </div>
            
            {/* Medidas con diseño destacado */}
            <div className="md:col-span-3 grid grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Grosor (in)</label>
                <input type="number" step="0.01" {...register("grosor_pulgadas", { required: true })} className="block w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-lg text-center focus:ring-blue-500 focus:border-blue-500" placeholder="0.00" />
                </div>
                <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ancho (in)</label>
                <input type="number" step="0.01" {...register("ancho_pulgadas", { required: true })} className="block w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-lg text-center focus:ring-blue-500 focus:border-blue-500" placeholder="0.00" />
                </div>
                <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Largo (ft)</label>
                <input type="number" step="0.01" {...register("largo_pies", { required: true })} className="block w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-lg text-center focus:ring-blue-500 focus:border-blue-500" placeholder="0.00" />
                </div>
            </div>
          </div>
        )}

        {productType === 'TRIPLAY_AGLOMERADO' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Género</label>
              <input {...register("genero")} placeholder="Ej: Caobilla" className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm" />
            </div>
             <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Procedencia</label>
              <input {...register("procedencia")} placeholder="Ej: Nacional" className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
              <input {...register("tipo")} placeholder="Ej: Triplay" className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm" />
            </div>
            
            <div className="md:col-span-3 grid grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Espesor (mm)</label>
                <input type="number" step="0.1" {...register("espesor_mm")} className="block w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-lg text-center" />
                </div>
                <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ancho (ft)</label>
                <input type="number" step="0.01" {...register("ancho_ft")} className="block w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-lg text-center" />
                </div>
                <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Largo (ft)</label>
                <input type="number" step="0.01" {...register("largo_ft")} className="block w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-lg text-center" />
                </div>
            </div>
           </div>
        )}
      </div>

      {/* SECCIÓN 2: DATOS GENERALES (AUTO-GENERADOS PERO EDITABLES) */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b pb-2 flex justify-between items-center">
          2. Identificación y Precios
          {isCalculating && <span className="text-xs text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full"><Loader2 className="animate-spin" size={14}/> Calculando precio...</span>}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
            <input 
              {...register("descripcion")} 
              // Eliminado readOnly, ahora es editable
              className="block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
            />
            <p className="text-xs text-gray-500 mt-1">Puedes editar este nombre si lo deseas.</p>
          </div>
          
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">SKU (Código Único)</label>
            <div className="flex gap-2">
                <input 
                {...register("sku")} 
                // Eliminado readOnly
                className="block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-800 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
                <button 
                    type="button" 
                    onClick={regenerarSku}
                    className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-600 transition-colors"
                    title="Regenerar sufijo aleatorio"
                >
                    <RefreshCw size={18} />
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Incluye un sufijo aleatorio para evitar duplicados. Puedes editarlo.</p>
          </div>

          {/* PRECIOS CALCULADOS (SOLO LECTURA) */}
          <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 mt-2">
            <div>
              <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Precio Público (Menudeo)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 font-bold text-lg">$</span>
                <input 
                  {...register("precio_venta")} 
                  
                  className="block w-full pl-8 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-lg shadow-inner text-blue-900 font-bold text-xl focus:outline-none cursor-not-allowed" 
                />
              </div>
              <p className="text-xs text-blue-400 mt-1">Calculado automáticamente</p>
            </div>

            { productType === 'TRIPLAY_AGLOMERADO' && (
              <div className="col-span-2 md:col-span-1 pt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Precio de Compra (Costo)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  <input  
                    type="number"
                    step="0.01"
                    {...register("precio_compra")} 
                    className="block w-full pl-8 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-800 focus:ring-2 focus:ring-gray-500 focus:border-gray-500" 
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Costo de adquisición por hoja/pieza.</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-green-600 uppercase mb-1">Precio Mayoreo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 font-bold text-lg">$</span>
                <input 
                  {...register("precio_mayoreo")} 
                  
                  className="block w-full pl-8 pr-4 py-3 bg-green-50 border border-green-200 rounded-lg shadow-inner text-green-900 font-bold text-xl focus:outline-none cursor-not-allowed" 
                />
              </div>
              <p className="text-xs text-green-400 mt-1">Calculado automáticamente</p>
            </div>
          </div>

        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="bg-white border border-gray-300 text-gray-700 font-medium px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white font-bold px-8 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Guardar Producto'}
        </button>
      </div>
    </form>
  );
};