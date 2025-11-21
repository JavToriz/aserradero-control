// lib/calculations.ts
// Lógica de negocio para calcular el volumen de madera.

// Definimos los tipos que esperamos
type AtributosMadera = {
  grosor_pulgadas: number;
  ancho_pulgadas: number;
  largo_pies: number;
};

type AtributosTriplay = {
  espesor_mm: number;
  ancho_ft: number;
  largo_ft: number;
};

type ProductoCatalogo = {
  tipo_categoria: 'MADERA_ASERRADA' | 'TRIPLAY_AGLOMERADO';
  atributos_madera?: AtributosMadera | null;
  atributos_triplay?: AtributosTriplay | null;
};

// Constantes de conversión
const PIE_TABLAR_A_M3 = 0.0023597372;
const PIE_A_METRO = 0.3048;
const MM_A_METRO = 0.001;

/**
 * Calcula el volumen total en metros cúbicos (m³) para un producto y cantidad dados.
 * Sigue la lógica descrita en tu documento.
 * @param producto El objeto del Producto del Catálogo (con sus atributos)
 * @param piezas La cantidad de piezas.
 * @returns El total de metros cúbicos (m³) como un número.
 */
export function calcularMetrosCubicos(producto: ProductoCatalogo | null, piezas: number): number {
  if (!producto || piezas <= 0) {
    return 0;
  }

  let volumenPorPieza = 0;

  try {
    if (producto.tipo_categoria === 'MADERA_ASERRADA' && producto.atributos_madera) {
      const { grosor_pulgadas, ancho_pulgadas, largo_pies } = producto.atributos_madera;
      
      // 1. Calcular Pies Tablares (P.T.) por pieza
      // Fórmula: (Grosor" x Ancho" x Largo') / 12
      const piesTablares = (grosor_pulgadas * ancho_pulgadas * largo_pies) / 12;

      // 2. Convertir Pies Tablares a Metros Cúbicos
      volumenPorPieza = piesTablares * PIE_TABLAR_A_M3;

    } else if (producto.tipo_categoria === 'TRIPLAY_AGLOMERADO' && producto.atributos_triplay) {
      const { espesor_mm, ancho_ft, largo_ft } = producto.atributos_triplay;

      // 1. Convertir todas las medidas a metros
      const espesor_m = espesor_mm * MM_A_METRO;
      const ancho_m = ancho_ft * PIE_A_METRO;
      const largo_m = largo_ft * PIE_A_METRO;

      // 2. Calcular m³ por pieza
      // Fórmula: Espesor (m) x Ancho (m) x Largo (m)
      volumenPorPieza = espesor_m * ancho_m * largo_m;
    }

    const totalMetrosCubicos = volumenPorPieza * piezas;
    
    // Redondear a 4 decimales para precisión
    return parseFloat(totalMetrosCubicos.toFixed(4));

  } catch (error) {
    console.error("Error al calcular metros cúbicos:", error);
    return 0;
  }
}