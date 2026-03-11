// src/app/(dashboard)/productos/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import * as Tabs from '@radix-ui/react-tabs';
import { Plus, ChevronLeft, ChevronRight, Search, XCircle, Calculator, CheckCheck, Loader2 } from 'lucide-react';
import { ProductTable } from '@/components/productos/ProductTable';
import { ProductForm } from '@/components/productos/ProductForm';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ModalContainer } from '@/components/ui/ModalContainer'; 
import { Switch } from "@/components/ui/my-switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Producto = {
  id_producto_catalogo: number; 
  descripcion: string;
  tipo_categoria: 'MADERA_ASERRADA' | 'TRIPLAY_AGLOMERADO';
  sku?: string;
  codigo_barras?: string;
  precio_venta: number;
  precio_compra: number;
  [key: string]: any; 
};

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState('MADERA_ASERRADA');
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [productToEdit, setProductToEdit] = useState<Producto | null>(null);
  const [productToDelete, setProductToDelete] = useState<Producto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- ESTADOS DEL PRICING MANAGER (Solo Triplay) ---
  const [modoSimulacion, setModoSimulacion] = useState(false);
  const [margenObjetivo, setMargenObjetivo] = useState<number>(30);
  const [editedPrices, setEditedPrices] = useState<Record<number, number>>({});
  const [savingProduct, setSavingProduct] = useState<number | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  
  // Estado para abrir el modal de confirmación de Bulk Save
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);

  // Estados Paginación
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
      setEditedPrices({}); // Limpia ediciones al recargar
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
    setSearchTerm(''); 
    setModoSimulacion(false); // Apaga el simulador al cambiar de pestaña
  }, [fetchProducts, activeTab]);

  const handleDelete = async () => {
    if (!productToDelete) return;
    const token = localStorage.getItem('sessionToken');
    try {
      const response = await fetch(`/api/productos/${productToDelete.id_producto_catalogo}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al eliminar');
      setProductToDelete(null); 
      fetchProducts(); 
    } catch (error) {
        alert('No se pudo eliminar el producto.');
    }
  };

  // --- FUNCIONES DEL FORMULARIO DE EDICIÓN ---
  const handleFormFinish = () => {
      setProductToEdit(null); 
      fetchProducts(); 
  };

  const handleFormCancel = () => {
      setProductToEdit(null); 
  };

  // --- LÓGICA DE GUARDADO DE PRECIOS ---
  const handleSavePrice = async (id_producto: number, newPrice: number) => {
    setSavingProduct(id_producto);
    try {
        const token = localStorage.getItem('sessionToken');
        const res = await fetch(`/api/productos/${id_producto}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ precio_venta: newPrice })
        });

        if (res.ok) {
            const updateList = (list: Producto[]) => list.map(p => 
                p.id_producto_catalogo === id_producto ? { ...p, precio_venta: newPrice } : p
            );
            setProducts(updateList);
            setEditedPrices(prev => {
                const next = { ...prev };
                delete next[id_producto];
                return next;
            });
        } else {
            alert("Error al actualizar el precio.");
        }
    } catch (error) {
        console.error(error);
    } finally {
        setSavingProduct(null);
    }
  };

  const handleBulkSave = async () => {
    // Cerramos el modal
    setShowBulkConfirmModal(false);
    setIsBulkSaving(true);
    let successCount = 0;
    const token = localStorage.getItem('sessionToken');

    for (const prod of filteredProducts) {
        const idProd = prod.id_producto_catalogo;
        const costo = Number(prod.precio_compra || 0);
        
        // Usamos fórmula de Marcaje (Markup)
        const precioSugerido = costo * (1 + (margenObjetivo / 100));
        const finalPrice = editedPrices[idProd] !== undefined 
            ? editedPrices[idProd] 
            : Number(precioSugerido.toFixed(2));

        if (finalPrice !== Number(prod.precio_venta) && finalPrice > 0) {
            try {
                const res = await fetch(`/api/productos/${idProd}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ precio_venta: finalPrice })
                });
                if (res.ok) successCount++;
            } catch (error) {
                console.error("Error actualizando:", idProd);
            }
        }
    }

    if (successCount > 0) {
        alert(`¡Listo! Se actualizaron ${successCount} precios exitosamente.`);
        fetchProducts(); 
    } else {
        alert("No hubo cambios necesarios. Todos los precios ya estaban actualizados.");
    }
    setIsBulkSaving(false);
  };

  // --- FILTROS Y PAGINACIÓN ---
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const term = searchTerm.toLowerCase().trim();
    return products.filter(product => 
        product.descripcion?.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        product.codigo_barras?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1; 
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Catálogo de Productos</h1>
          <p className="text-gray-500">Define descripciones, códigos y precios de venta.</p>
        </div>
        <Link href="/productos/nuevo" passHref className="w-full md:w-auto">
          <button className="bg-green-600 text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-sm font-medium w-full md:w-auto">
            <Plus size={20} />
            Nuevo Producto
          </button>
        </Link>
      </header>

      <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value)}>
        <Tabs.List className="flex border-b">
          <Tabs.Trigger value="MADERA_ASERRADA" className="px-6 py-3 text-gray-600 font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 focus:outline-none transition-all">
             Madera Aserrada
          </Tabs.Trigger>
          <Tabs.Trigger value="TRIPLAY_AGLOMERADO" className="px-6 py-3 text-gray-600 font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 focus:outline-none transition-all">
            Productos / Triplay 
          </Tabs.Trigger>
        </Tabs.List>
        
        <div className="pt-6">
          
          <div className="bg-white p-2.5 rounded-xl shadow-sm flex items-center gap-2 border mb-4">
            <Search className="text-gray-400 ml-2" size={20} />
            <input 
              type="text"
              placeholder="Buscar por Descripción, SKU o Escanear Código de Barras..."
              className="flex-1 outline-none text-gray-700 w-full py-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
               <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600 mr-2">
                 <XCircle size={18}/>
               </button>
            )}
          </div>

          {/* 👇 PRICING MANAGER HEADER (Solo para Triplay) 👇 */}
          {activeTab === 'TRIPLAY_AGLOMERADO' && (
              <div className="flex flex-wrap items-center justify-between gap-4 bg-blue-50/50 p-3 rounded-xl border border-blue-100 mb-6 shadow-sm">
                 <div className="flex items-center space-x-3">
                    <Switch 
                        id="modo-simulacion" 
                        checked={modoSimulacion}
                        onCheckedChange={setModoSimulacion}
                    />
                    <Label htmlFor="modo-simulacion" className="cursor-pointer flex items-center gap-2 text-sm font-bold text-blue-900">
                        <Calculator className="h-4 w-4 text-blue-600" />
                        Ajustar Precios (Edición Rápida)
                    </Label>
                 </div>

                 {modoSimulacion && (
                    <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="flex items-center gap-2 border-l border-blue-200 pl-4">
                            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Marcaje General %:</span>
                            <Input 
                                type="number" 
                                value={margenObjetivo}
                                onChange={(e) => setMargenObjetivo(Number(e.target.value))}
                                className="w-20 h-9 text-right font-bold text-blue-700 bg-white border-blue-300 shadow-inner focus-visible:ring-blue-500"
                            />
                        </div>
                        
                        <Button 
                            onClick={() => setShowBulkConfirmModal(true)}
                            disabled={isBulkSaving || filteredProducts.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                            {isBulkSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCheck className="h-4 w-4 mr-2" />}
                            Aplicar a los {filteredProducts.length} filtrados
                        </Button>
                    </div>
                 )}
              </div>
          )}

          {loading ? (
             <p className="text-center text-gray-500 py-12 flex flex-col items-center gap-3">
                 <Loader2 className="h-8 w-8 animate-spin text-blue-500"/>
                 Cargando catálogo...
             </p> 
          ) : (
            <>
              {filteredProducts.length > 0 ? (
                <div className="animate-in fade-in duration-500">
                  <ProductTable 
                      products={currentProducts} 
                      type={activeTab === 'MADERA_ASERRADA' ? 'madera' : 'triplay'}
                      onEdit={(product) => setProductToEdit(product)}
                      onDelete={(product) => setProductToDelete(product)}
                      // Props del Pricing Manager
                      modoSimulacion={modoSimulacion}
                      margenObjetivo={margenObjetivo}
                      editedPrices={editedPrices}
                      setEditedPrices={setEditedPrices}
                      onSavePrice={handleSavePrice}
                      savingProduct={savingProduct}
                  />

                  {/* Controles de Paginación */}
                  <div className="flex items-center justify-between border border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-xl shadow-sm">
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <p className="text-sm text-gray-700">
                        Mostrando <span className="font-semibold text-gray-900">{startIndex + 1}</span> a <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredProducts.length)}</span> de <span className="font-semibold text-gray-900">{filteredProducts.length}</span> resultados
                      </p>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">
                          Página {currentPage} de {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm mt-4">
                  <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">No se encontraron productos</h3>
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

      {/* Modal Eliminación Producto */}
      <ConfirmationModal
          isOpen={!!productToDelete}
          onClose={() => setProductToDelete(null)}
          onConfirm={handleDelete}
          title="Confirmar Eliminación"
          message={`¿Estás seguro de que deseas eliminar el producto "${productToDelete?.descripcion}"? Esta acción no se puede deshacer.`}
      />

      {/* Modal de Confirmación de Bulk Update (Precios) */}
      <ConfirmationModal
          isOpen={showBulkConfirmModal}
          onClose={() => setShowBulkConfirmModal(false)}
          onConfirm={handleBulkSave}
          title="Actualizar todos los precios"
          message={`Estás a punto de recalcular y guardar los precios de ${filteredProducts.length} productos mostrados, usando un marcaje del ${margenObjetivo}%. \n\n Esta operación tardará algunos segundos en terminar de actualizarse y no se puede deshacer. ¿Deseas continuar?`}
          confirmText="Sí, Actualizar Precios"
          cancelText="Cancelar"
          //confirmButtonClass="bg-blue-600 hover:bg-blue-700" 
      />

    </div>
  );
}