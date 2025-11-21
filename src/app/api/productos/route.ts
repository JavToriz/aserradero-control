//app/api/productos/route.ts
import { NextResponse, NextRequest} from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

// OBTENER productos con filtros
export async function GET(req: NextRequest) {

  // Obtener los datos del usuario y su aserradero desde el token
  const authPayload = await getAuthPayload(req);
  if (!authPayload || !authPayload.aserraderoId) {
    return NextResponse.json({ message: 'No autorizado o no se encontró aserradero asignado.' }, { status: 401 });
  }
  // Definimos los parámetros de búsqueda (filtros) de la URL
    const { searchParams } = req.nextUrl;
    const genero = searchParams.get('genero');
    const tipo_categoria = searchParams.get('tipo_categoria'); // Filtro para las pestañas
    const tipo = searchParams.get('tipo');
    const clasificacion = searchParams.get('clasificacion');
    const procedencia = searchParams.get('procedencia');
    const search = searchParams.get('search'); // filtro de búsqueda general

    // Construimos la cláusula 'where' para la consulta de Prisma
    const whereClause: any = { 
      AND : [
        { id_aserradero: authPayload.aserraderoId }
      ]
    };

    if (tipo_categoria) {
      whereClause.AND.push({ tipo_categoria });
    }

    // Filtros específicos para atributos
    const attributesWhere: any = {};
    if (genero) attributesWhere.genero = { contains: genero, mode: 'insensitive' };
    if (tipo) attributesWhere.tipo = { contains: tipo, mode: 'insensitive' };
    if (clasificacion) attributesWhere.clasificacion = { contains: clasificacion, mode: 'insensitive' };
    if (procedencia) attributesWhere.procedencia = { contains: procedencia, mode: 'insensitive' };

    // Agregamos filtros de atributos solo si existen
    if (Object.keys(attributesWhere).length > 0) {
        whereClause.AND.push({
        OR: [
            { atributos_madera: attributesWhere },
            { atributos_triplay: attributesWhere },
        ],
        });
    }

    // Lógica para la búsqueda general
    if (search) {
        whereClause.AND.push({
        OR: [
            { descripcion: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            // La búsqueda por medidas es más compleja, aquí un ejemplo simple
            // Para una búsqueda más robusta, podrías necesitar una columna de texto pre-calculada.
            { atributos_madera: { largo_pies: { equals: parseFloat(search) || 0 } } },
            { atributos_madera: { ancho_pulgadas: { equals: parseFloat(search) || 0 } } },
        ],
        });
    }

    try {
        const productos = await prisma.productoCatalogo.findMany({
        where: whereClause,
        include: {
            atributos_madera: true,
            atributos_triplay: true,
        },
        orderBy: { id_producto_catalogo: 'desc' }
        });
        return NextResponse.json(productos);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error al obtener productos" }, { status: 500 });
    }
    }

// CREAR un nuevo producto
export async function POST(req: Request) {

  // Obtenemos el payload que el middleware ya validó
  const authPayload = await getAuthPayload(req);
  // Si por alguna razón no hay payload, denegar (aunque el middleware ya debería haberlo hecho)
  if (!authPayload) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    // Destructure `id_aserradero` from the body
    const { tipo_categoria, atributos, sku, ...productData } = body;
    const id_aserradero = authPayload.aserraderoId;

    // Add a check to ensure the aserradero ID is provided
    if (!id_aserradero) {
        return NextResponse.json({ message: "El campo 'id_aserradero' es requerido" }, { status: 400 });
    }
     // 👇 VALIDACIÓN DE SKU DUPLICADO 👇
    if (sku && sku.trim() !== '') {
        const existingProduct = await prisma.productoCatalogo.findUnique({
            where: {
              sku_unico_por_aserradero: { // Prisma crea este nombre basado en @@unique
                  sku: sku,
                  id_aserradero: authPayload.aserraderoId // <-- Comprobación clave
              }
            },
        });

        if (existingProduct) {
            // Usamos el código de estado 409 Conflict
            return NextResponse.json(
                { message: `El SKU "${sku}" ya existe. Por favor, utiliza uno diferente.` },
                { status: 409 }
            );
        }
    }
    let newProduct;

    if (tipo_categoria === 'MADERA_ASERRADA') {
      newProduct = await prisma.productoCatalogo.create({
        data: {
          ...productData,
          sku: sku,
          tipo_categoria,
          id_aserradero: id_aserradero, // <-- AÑADE ESTA LÍNEA
          atributos_madera: {
            create: atributos,
          },
        },
      });
    } else if (tipo_categoria === 'TRIPLAY_AGLOMERADO') {
      newProduct = await prisma.productoCatalogo.create({
        data: {
          ...productData,
          sku: sku,
          tipo_categoria,
          id_aserradero: id_aserradero, // <-- Y AÑADE ESTA LÍNEA
          atributos_triplay: {
            create: atributos,
          },
        },
      });
    } else {
        return NextResponse.json({ message: "Tipo de categoría no válido" }, { status: 400 });
    }

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error al crear el producto:", error);
    return NextResponse.json({ message: "Error al crear el producto" }, { status: 500 });
  }
}