// src/app/(dashboard)/productos/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import * as Tabs from '@radix-ui/react-tabs';
import { Plus } from 'lucide-react';
import { ProductTable } from '@/components/productos/ProductTable';
import { ProductForm } from '@/components/productos/ProductForm';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ModalContainer } from '@/components/ui/ModalContainer'; 
//import { StockAdjustmentModal } from '@/components/productos/StockAdjustmentModal';
//import { AdjustmentHistoryModal } from '@/components/productos/AdjustmentHistoryModal';


// Definimos un tipo más completo
type Producto = {
  id_producto: number;
  descripcion: string;
  tipo_categoria: 'MADERA_ASERRADA' | 'TRIPLAY_AGLOMERADO';
  //stock: number;
  [key: string]: any; // Para el resto de propiedades
};

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState('MADERA_ASERRADA');
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for modals
  const [productToEdit, setProductToEdit] = useState<Producto | null>(null);
  const [productToDelete, setProductToDelete] = useState<Producto | null>(null);
  //const [productToAdjust, setProductToAdjust] = useState<Producto | null>(null);
  //const [productForHistory, setProductForHistory] = useState<Producto | null>(null);

  
  // State for filters will go here

  // Usamos useCallback para evitar que la función se re-cree en cada render
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('sessionToken');
    // TODO: Añadir filtros a la URL
    const response = await fetch(`/api/productos?tipo_categoria=${activeTab}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    setProducts(data);
    setLoading(false);
  }, [activeTab]); // Depende del tab activo

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    const token = localStorage.getItem('sessionToken');
    try {
      const response = await fetch(`/api/productos/${productToDelete.id_producto_catalogo}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el producto');
      }
      
      alert('Producto eliminado con éxito.');
      setProductToDelete(null); // Cierra el modal
      fetchProducts(); // Recarga los datos
    } catch (error) {
        console.error(error);
        alert('No se pudo eliminar el producto.');
    }
  };

  // Esta función se llama tanto al guardar como al cancelar desde el formulario.
  const handleFormFinish = () => {
      setProductToEdit(null); // Cierra el modal de edición
      fetchProducts(); // Recarga los datos
  };

  const handleFormCancel = () => {
    setProductToEdit(null); // Simplemente cierra el modal
  };

  /* NUEVO HANDLER para cuando el ajuste de stock es exitoso
  const handleAdjustmentSuccess = () => {
    setProductToAdjust(null); // Cierra el modal de ajuste
    fetchProducts(); // Recarga la lista de productos para ver el stock actualizado
  }; */

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
      
      {/* Aquí iría el componente de filtros */}

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
                onSave={handleFormFinish} // Se ejecuta al guardar exitosamente
                onCancel={handleFormCancel} // Se ejecuta al presionar cancelar
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