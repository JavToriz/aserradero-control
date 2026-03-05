// src/app/(dashboard)/productos/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import * as Tabs from '@radix-ui/react-tabs';
import { Plus, ChevronLeft, ChevronRight, Search, XCircle } from 'lucide-react';
import { ProductTable } from '@/components/productos/ProductTable';
import { ProductForm } from '@/components/productos/ProductForm';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ModalContainer } from '@/components/ui/ModalContainer'; 

type Producto = {
  id_producto_catalogo: number; 
  descripcion: string;
  tipo_categoria: 'MADERA_ASERRADA' | 'TRIPLAY_AGLOMERADO';
  sku?: string;
  codigo_barras?: string;
  [key: string]: any; 
};

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState('MADERA_ASERRADA');
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for modals
  const [productToEdit, setProductToEdit] = useState<Producto | null>(null);
  const [productToDelete, setProductToDelete] = useState<Producto | null>(null);

  // 👇 NUEVO: Estado para el buscador de productos
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para la Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('sessionToken');
    try {
      const response = await fetch(`/api/productos?tipo_categoria=${activeTab}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      
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
    setCurrentPage(1); 
    setSearchTerm(''); // Reiniciamos el buscador al cambiar de pestaña
  }, [fetchProducts, activeTab]);

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

  // 👇 NUEVA LÓGICA: Filtrar productos antes de paginarlos
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    
    const term = searchTerm.toLowerCase().trim();
    return products.filter(product => {
      return (
        product.descripcion?.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        product.codigo_barras?.toLowerCase().includes(term)
      );
    });
  }, [products, searchTerm]);

  // Lógica Matemática de Paginación (ahora usa los productos FILTRADOS)
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1; // Evita que de 0 páginas
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Efecto para regresar a la página 1 si el usuario busca algo y estaba en la pág 5
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Mis Productos</h1>
          <p className="text-gray-500">Gestiona tu inventario de madera, triplay y productos.</p>
        </div>
        <Link href="/productos/nuevo" passHref className="w-full md:w-auto">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-sm font-medium w-full md:w-auto">
            <Plus size={20} />
            Nuevo Producto
          </button>
        </Link>
      </header>

      <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value)}>
        <Tabs.List className="flex border-b">
          <Tabs.Trigger value="MADERA_ASERRADA" className="px-4 py-2 text-gray-600 font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 focus:outline-none transition-all">
             Madera Aserrada
          </Tabs.Trigger>
          <Tabs.Trigger value="TRIPLAY_AGLOMERADO" className="px-4 py-2 text-gray-600 font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 focus:outline-none transition-all">
            Productos / Triplay 
          </Tabs.Trigger>
        </Tabs.List>
        
        <div className="pt-6">
          
          {/* 👇 NUEVO: Barra de Búsqueda (Estilo consistente con Ventas) 👇 */}
          <div className="bg-white p-2.5 rounded-xl shadow-sm flex items-center gap-2 border mb-4">
            <Search className="text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Buscar por Descripción, SKU o Escanear Código de Barras..."
              className="flex-1 outline-none text-gray-700 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
               <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                 <XCircle size={16}/>
               </button>
            )}
          </div>

          {loading ? (
             <p className="text-center text-gray-500 py-8">Cargando catálogo...</p> 
          ) : (
            <>
              {filteredProducts.length > 0 ? (
                <>
                  <ProductTable 
                      products={currentProducts} 
                      type={activeTab === 'MADERA_ASERRADA' ? 'madera' : 'triplay'}
                      onEdit={(product) => setProductToEdit(product)}
                      onDelete={(product) => setProductToDelete(product)}
                  />

                  {/* Controles de Paginación UI Moderno */}
                  <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow-sm">
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Mostrando <span className="font-semibold text-gray-900">{filteredProducts.length === 0 ? 0 : startIndex + 1}</span> a <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredProducts.length)}</span> de <span className="font-semibold text-gray-900">{filteredProducts.length}</span> resultados
                        </p>
                      </div>
                      <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                          >
                            <span className="sr-only">Anterior</span>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                          </button>
                          
                          <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0">
                            Página {currentPage} de {totalPages}
                          </span>

                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                          >
                            <span className="sr-only">Siguiente</span>
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </nav>
                      </div>
                    </div>
                    
                    {/* Vista móvil */}
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border shadow-sm mt-4">
                  <Search className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No se encontraron productos</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchTerm ? `No hay coincidencias para "${searchTerm}"` : "Tu catálogo de productos está vacío."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </Tabs.Root>

      {/* --- MODALES --- */}
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

      <ConfirmationModal
          isOpen={!!productToDelete}
          onClose={() => setProductToDelete(null)}
          onConfirm={handleDelete}
          title="Confirmar Eliminación"
          message={`¿Estás seguro de que deseas eliminar el producto permanentemente "${productToDelete?.descripcion}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}