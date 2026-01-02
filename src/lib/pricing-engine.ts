// lib/pricing-engine.ts

// Interfaz basada en tabla  'AtributosMadera'
interface AtributosMadera {
  grosor_pulgadas: number;
  ancho_pulgadas: number;
  largo_pies: number; // Asegúrate que tu DB guarde pies. Si guarda metros, convertimos aquí.
}

interface ResultadoPrecio {
  piesTablares: number;
  precioSugerido: number;       // Menudeo
  precioMayoreoSugerido: number; // Mayoreo
}

/**
 * Calcula precio MENUDEO y MAYOREO usando los atributos.
 */
export function calcularPrecioPorAtributos(
  atributos: AtributosMadera,
  precioBaseMenudeo: number,
  precioBaseMayoreo: number = 0 // Opcional, por defecto 0 si no hay
): ResultadoPrecio {
  const { grosor_pulgadas, ancho_pulgadas, largo_pies } = atributos;

  // Validación
  if (!grosor_pulgadas || !ancho_pulgadas || !largo_pies) {
    return { piesTablares: 0, precioSugerido: 0, precioMayoreoSugerido: 0 };
  }

  // Fórmula: (Grueso" x Ancho" x Largo') / 12
  const volumenRaw = (grosor_pulgadas * ancho_pulgadas * largo_pies) / 12;
  const piesTablares = Math.round(volumenRaw * 10000) / 10000;

  // Precio final Menudeo
  const precioSugerido = Math.round((piesTablares * precioBaseMenudeo) * 100) / 100;
  
  // Precio final Mayoreo (si existe base)
  const precioMayoreoSugerido = precioBaseMayoreo > 0 
    ? Math.round((piesTablares * precioBaseMayoreo) * 100) / 100
    : 0;

  return {
    piesTablares,
    precioSugerido,
    precioMayoreoSugerido
  };
}

/**
 * Helper opcional para convertir Metros a Pies (útil para la UI si el usuario ingresa metros)
 * Factor estándar: 1 metro = 3.28084 pies
 * Ejemplo: 2.5m -> 8.20 pies
 */
export function metrosAPies(metros: number): number {
  if (!metros) return 0;
  return Math.round((metros * 3.28084) * 100) / 100;
}