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
    const tipo_categoria = searchParams.get('tipo_categoria') || searchParams.get('categoria'); // Filtro para las pestañas
    const tipo = searchParams.get('tipo');
    const clasificacion = searchParams.get('clasificacion');
    const procedencia = searchParams.get('procedencia');
    // ---  Aceptamos 'query' (del componente UI) O 'search' (legacy) ---
    const rawSearch = searchParams.get('query') || searchParams.get('search');
    const search = rawSearch?.trim(); // filtro de búsqueda general

    // Construimos la cláusula 'where' para la consulta de Prisma
    const whereClause: any = { 
      AND : [
        { id_aserradero: authPayload.aserraderoId, activo: true }
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
        // Intentamos ver si es un número para buscar también por medidas
        const isNumber = !isNaN(parseFloat(search));

        const orConditions: any[] = [
            // Buscar en Descripción
            { descripcion: { contains: search, mode: 'insensitive' } },
            // Buscar en SKU (¡Aquí está el cambio clave!)
            { sku: { contains: search, mode: 'insensitive' } },
            // 👇 NUEVO: Buscar en Código de Barras (Para el lector de Punto de Venta) 👇
            { codigo_barras: { contains: search, mode: 'insensitive' } } 
        ];

        // Si el usuario escribe números (ej: "2.5"), buscamos en medidas también
        if (isNumber) {
            const num = parseFloat(search);
            orConditions.push(
                { atributos_madera: { largo_pies: { equals: num } } },
                { atributos_madera: { ancho_pulgadas: { equals: num } } },
                { atributos_madera: { grosor_pulgadas: { equals: num } } },
                { atributos_triplay: { espesor_mm: { equals: num } } }
            );
        }

        whereClause.AND.push({ OR: orConditions });
    }

    try {
        const productos = await prisma.productoCatalogo.findMany({
        where: whereClause,
        include: {
            atributos_madera: true,
            atributos_triplay: true,
        },
        orderBy: { id_producto_catalogo: 'desc' },
        //take: 15 -- // Se ocupa take para decirle cuantos resultados mostrar en pantalla
        });
        return NextResponse.json(productos);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error al obtener productos" }, { status: 500 });
    }
}

// CREAR un nuevo producto
export async function POST(req: Request) {
  const authPayload = await getAuthPayload(req);
  if (!authPayload) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    // 👇 NUEVO: Extraemos clave_sat del body
    const { tipo_categoria, atributos, sku, codigo_barras, clave_sat, ...productData } = body;
    const id_aserradero = authPayload.aserraderoId;

    if (!id_aserradero) {
        return NextResponse.json({ message: "El campo 'id_aserradero' es requerido" }, { status: 400 });
    }

    if (sku && sku.trim() !== '') {
        const existingProduct = await prisma.productoCatalogo.findUnique({
            where: {
              sku_unico_por_aserradero: { 
                  sku: sku,
                  id_aserradero: authPayload.aserraderoId 
              }
            },
        });

        if (existingProduct) {
            return NextResponse.json(
                { message: `El SKU "${sku}" ya existe. Por favor, utiliza uno diferente.` },
                { status: 409 }
            );
        }
    }

    if (codigo_barras && codigo_barras.trim() !== '') {
        const existingBarcode = await prisma.productoCatalogo.findFirst({
            where: {
                codigo_barras: codigo_barras.trim(),
                id_aserradero: authPayload.aserraderoId
            }
        });

        if (existingBarcode) {
            return NextResponse.json(
                { message: `El código de barras "${codigo_barras}" ya está registrado en otro producto.` },
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
          codigo_barras: codigo_barras?.trim() || null,
          clave_sat: clave_sat?.trim() || null, // 👇 Guardamos clave_sat
          tipo_categoria,
          id_aserradero: id_aserradero, 
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
          codigo_barras: codigo_barras?.trim() || null,
          clave_sat: clave_sat?.trim() || null, // 👇 Guardamos clave_sat
          tipo_categoria,
          id_aserradero: id_aserradero, 
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