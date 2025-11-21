// components/productos/ProductoCatalogoFormModal.tsx
// Modal para Form 7.2: "Crear Nuevo Producto al instante"
'use client';

import { useState, useEffect } from 'react';
import { ModalContainer } from '@/components/ui/ModalContainer';
import { Save, Ban } from 'lucide-react';

// Tipos
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (nuevoProducto: any) => void;
}

const initialState = {
  descripcion: '',
  sku: '',
  tipo_categoria: 'MADERA_ASERRADA',
  unidad_medida: 'Pieza',
  precio_venta: 0,
  precio_compra: 0,
  // Atributos
  genero: '',
  tipo: '',
  clasificacion: 'Primera',
  grosor_pulgadas: 0,
  ancho_pulgadas: 0,
  largo_pies: 0,
  espesor_mm: 0,
  ancho_ft: 0,
  largo_ft: 0,
  procedencia: ''
};

export function ProductoCatalogoFormModal({ isOpen, onClose, onSaveSuccess }: ModalProps) {
  const [formData, setFormData] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialState); // Resetear formulario al cerrar
      setError(null);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: (e.target.type === 'number') ? parseFloat(value) || 0 : value 
    }));
  };

  const getToken = () => localStorage.getItem('sessionToken');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // 1. Preparar los datos de atributos
    let atributos: any;
    if (formData.tipo_categoria === 'MADERA_ASERRADA') {
      atributos = {
        genero: formData.genero,
        tipo: formData.tipo,
        clasificacion: formData.clasificacion,
        grosor_pulgadas: formData.grosor_pulgadas,
        ancho_pulgadas: formData.ancho_pulgadas,
        largo_pies: formData.largo_pies,
      };
    } else {
      atributos = {
        genero: formData.genero,
        tipo: formData.tipo,
        espesor_mm: formData.espesor_mm,
        ancho_ft: formData.ancho_ft,
        largo_ft: formData.largo_ft,
        procedencia: formData.procedencia,
      };
    }

    // 2. Preparar el body final para la API
    const body = {
      descripcion: formData.descripcion,
      sku: formData.sku || null,
      tipo_categoria: formData.tipo_categoria,
      unidad_medida: formData.unidad_medida,
      precio_venta: formData.precio_venta,
      precio_compra: formData.precio_compra,
      atributos: atributos,
    };

    try {
      const token = getToken();
      // Usamos el endpoint que ya existe para crear productos
      const response = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Error al guardar el producto');

      onSaveSuccess(result); // Devolver el producto recién creado

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalContainer title="Crear Nuevo Producto en Catálogo" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        
        <Select label="Tipo de Categoría" name="tipo_categoria" value={formData.tipo_categoria} onChange={handleChange}>
          <option value="MADERA_ASERRADA">🌲 Madera Aserrada</option>
          <option value="TRIPLAY_AGLOMERADO">🪵 Triplay/Aglomerado</option>
        </Select>

        <h3 className="text-md font-semibold text-gray-700 pt-4 border-t">Información General</h3>
        <Input label="Descripción" name="descripcion" value={formData.descripcion} onChange={handleChange} required />
        <Input label="SKU (Opcional)" name="sku" value={formData.sku} onChange={handleChange} />
        <Select label="Unidad de Medida" name="unidad_medida" value={formData.unidad_medida} onChange={handleChange}>
          <option value="Pieza">Pieza</option>
          <option value="Pie tablar">Pie tablar</option>
          <option value="m3">m³</option>
        </Select>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Precio Venta" name="precio_venta" type="number" step="0.01" value={formData.precio_venta} onChange={handleChange} required />
          <Input label="Precio Compra (Opcional)" name="precio_compra" type="number" step="0.01" value={formData.precio_compra} onChange={handleChange} />
        </div>

        <h3 className="text-md font-semibold text-gray-700 pt-4 border-t">Atributos Específicos</h3>
        
        {formData.tipo_categoria === 'MADERA_ASERRADA' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Género" name="genero" value={formData.genero} onChange={handleChange} placeholder="Pino" />
              <Input label="Tipo" name="tipo" value={formData.tipo} onChange={handleChange} placeholder="Tabla" />
              <Select label="Clasificación" name="clasificacion" value={formData.clasificacion} onChange={handleChange}>
                <option value="Primera">Primera</option>
                <option value="Segunda">Segunda</option>
                <option value="Tercera">Tercera</option>
                <option value="Otra">Otra</option>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Grosor (pulgadas)" name="grosor_pulgadas" type="number" step="0.01" value={formData.grosor_pulgadas} onChange={handleChange} />
              <Input label="Ancho (pulgadas)" name="ancho_pulgadas" type="number" step="0.01" value={formData.ancho_pulgadas} onChange={handleChange} />
              <Input label="Largo (pies)" name="largo_pies" type="number" step="0.01" value={formData.largo_pies} onChange={handleChange} />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Género" name="genero" value={formData.genero} onChange={handleChange} placeholder="Pino" />
              <Input label="Tipo" name="tipo" value={formData.tipo} onChange={handleChange} placeholder="Triplay" />
              <Input label="Procedencia" name="procedencia" value={formData.procedencia} onChange={handleChange} placeholder="Nacional" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Espesor (mm)" name="espesor_mm" type="number" step="0.01" value={formData.espesor_mm} onChange={handleChange} />
              <Input label="Ancho (pies)" name="ancho_ft" type="number" step="0.01" value={formData.ancho_ft} onChange={handleChange} />
              <Input label="Largo (pies)" name="largo_ft" type="number" step="0.01" value={formData.largo_ft} onChange={handleChange} />
            </div>
          </>
        )}

        {/* Botones de acción del modal */}
        <div className="border-t pt-4 flex justify-end gap-4">
          {error && <p className="text-red-600 text-sm my-auto mr-4">Error: {error}</p>}
          <button type="button" onClick={onClose} disabled={isSaving} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg ...">
            <Ban size={18} /> Cancelar
          </button>
          <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-4 py-2 rounded-lg ...">
            <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </ModalContainer>
  );
}

// --- Componentes de UI (reutilizados) ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
const Input: React.FC<InputProps> = ({ label, ...props }) => (
  <div className="w-full">
    <label htmlFor={props.name} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      id={props.name}
      {...props}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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