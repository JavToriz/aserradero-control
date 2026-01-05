// src/lib/actions/aserraderos.ts
// Obtener información del aserradero por su ID para impresión

// src/lib/actions/aserraderos.ts
import { prisma } from '@/lib/prisma';
import { DatosEmpresaNota } from '@/components/ventas/NotaVentaImprimible';
 

export async function obtenerConfiguracionImpresion(idAserradero: number): Promise<DatosEmpresaNota | null> {
  const aserradero = await prisma.aserradero.findUnique({
    where: { id_aserradero: idAserradero },
  });

  if (!aserradero) return null;

  // Mapeamos los datos de la BD a la interfaz que necesita la Nota
  // Usamos || '' para manejar los nulos en caso de que no estén llenos en la BD
  return {
    nombre: aserradero.nombre,
    propietario: aserradero.propietario || 'Propietario no registrado',
    rfc: aserradero.rfc || '',
    curp: aserradero.curp || '',
    rfn: aserradero.rfn || '',
    c_i: aserradero.c_i || '',
    telefonos: aserradero.telefono || '',
    // Aquí concatenamos o usamos el campo de dirección completo
    direccion_completa: aserradero.direccion || 'Dirección no registrada', 
    // Si no hay logo en BD, usa uno por defecto de tu carpeta public
    logo_url: aserradero.logo_url || '/images/logo-default.png', 
  };
}