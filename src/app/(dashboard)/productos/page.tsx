'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import * as Tabs from '@radix-ui/react-tabs';
import { Plus } from 'lucide-react';
import { ProductTable } from '@/components/productos/ProductTable';
import { ProductForm } from '@/components/productos/ProductForm';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ModalContainer } from '@/components/ui/ModalContainer'; 

// 1. CORRECCIÓN DE TIPO: Renombramos id_producto a id_producto_catalogo para coincidir con ProductTable
type Producto = {
  id_producto_catalogo: number; // <--- CAMBIO CLAVE AQUÍ
  descripcion: string;
  tipo_categoria: 'MADERA_ASERRADA' | 'TRIPLAY_AGLOMERADO';
  //stock: number;
  [key: string]: any; 
};

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState('MADERA_ASERRADA');
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for modals
  const [productToEdit, setProductToEdit] = useState<Producto | null>(null);
  const [productToDelete, setProductToDelete] = useState<Producto | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('sessionToken');
    try {
      const response = await fetch(`/api/productos?tipo_categoria=${activeTab}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      
      // 2. CORRECCIÓN DE DATOS: Aseguramos que el objeto tenga el ID correcto para la tabla
      // Si la API devuelve 'id_producto', lo asignamos a 'id_producto_catalogo'
      const mappedData = Array.isArray(data) ? data.map((item: any) => ({
        ...item,
        id_producto_catalogo: item.id_producto_catalogo || item.id_producto
      })) : [];

      setProducts(mappedData);
    } catch (error) {
      console.error("Error cargando productos", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    const token = localStorage.getItem('sessionToken');
    try {
      // Ahora TypeScript no se quejará porque id_producto_catalogo existe en el tipo
      const response = await fetch(`/api/productos/${productToDelete.id_producto_catalogo}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el producto');
      }
      
      // alert('Producto eliminado con éxito.'); // Opcional: quitar alert para mejor UX
      setProductToDelete(null); 
      fetchProducts(); 
    } catch (error) {
        console.error(error);
        alert('No se pudo eliminar el producto.');
    }
  };

  const handleFormFinish = () => {
      setProductToEdit(null); 
      fetchProducts(); 
  };

  const handleFormCancel = () => {
    setProductToEdit(null); 
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Mis Productos</h1>
          <p className="text-gray-500">Gestiona tu inventario de madera y triplay.</p>
        </div>
        <Link href="/productos/nuevo" passHref>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm">
            <Plus size={20} />
            Nuevo Producto
          </button>
        </Link>
      </header>
      
      <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value)}>
        <Tabs.List className="flex border-b">
          <Tabs.Trigger value="MADERA_ASERRADA" className="px-4 py-2 text-gray-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 focus:outline-none">
            🌲 Madera Aserrada
          </Tabs.Trigger>
          <Tabs.Trigger value="TRIPLAY_AGLOMERADO" className="px-4 py-2 text-gray-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 focus:outline-none">
            🪵 Triplay y Aglomerados
          </Tabs.Trigger>
        </Tabs.List>
        <div className="pt-4">
          {loading ? (
             <p className="text-center text-gray-500 py-8">Cargando...</p> 
          ) : (
            <ProductTable 
                products={products} 
                type={activeTab === 'MADERA_ASERRADA' ? 'madera' : 'triplay'}
                onEdit={(product) => setProductToEdit(product)}
                onDelete={(product) => setProductToDelete(product)}
            />
          )}
        </div>
      </Tabs.Root>

      {/* --- MODALES --- */}

      {/* Modal de Edición */}
      {productToEdit && (
        <ModalContainer title="Editar Producto" onClose={() => setProductToEdit(null)}>
            <ProductForm 
                productType={productToEdit.tipo_categoria}
                initialData={productToEdit}
                onSave={handleFormFinish} 
                onCancel={handleFormCancel} 
            />
        </ModalContainer>
      )}

      {/* Modal de Confirmación de Borrado */}
      <ConfirmationModal
          isOpen={!!productToDelete}
          onClose={() => setProductToDelete(null)}
          onConfirm={handleDelete}
          title="Confirmar Eliminación"
          message={`¿Estás seguro de que deseas eliminar el producto "${productToDelete?.descripcion}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}