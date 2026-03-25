// src/app/(dashboard)/productos/[categoria]/nuevo/page.tsx
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProductForm } from '@/components/productos/ProductForm'; 
import { ArrowLeft } from 'lucide-react';

export default function NuevoProductoPage() {
  const params = useParams();
  const router = useRouter();

  const categoriaParam = params?.categoria as string;
  const inMadera = categoriaParam === 'madera';
  const inTriplay = categoriaParam === 'triplay';

  useEffect(() => {
    if (!inMadera && !inTriplay) {
      router.replace('/productos/triplay');
    }
  }, [inMadera, inTriplay, router]);

  const productType = inMadera ? 'MADERA_ASERRADA' : 'TRIPLAY_AGLOMERADO';

  const handleSaveSuccess = () => {
    router.push(`/productos/${categoriaParam}`);
  };

  if (!inMadera && !inTriplay) {
    return null;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-6">
          <Link href={`/productos/${categoriaParam}`} className="flex items-center text-gray-500 hover:text-gray-800 transition-colors mb-4">
            <ArrowLeft size={18} className="mr-2" />
            Volver a la lista de productos
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Registrar Nuevo Producto</h1>
          <p className="text-gray-500 mt-1">Completa la información para {inMadera ? 'Madera Aserrada' : 'Triplay / Aglomerado'}.</p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
           <ProductForm 
             productType={productType} 
             onSave={handleSaveSuccess} 
             onCancel={() => router.push(`/productos/${categoriaParam}`)}
           />
        </div>
      </div>
    </div>
  );
}
