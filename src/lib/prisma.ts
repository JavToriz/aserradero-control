
/*
    Este código es el "patrón Singleton".
    Crea una instancia de PrismaClient la primera vez que se necesita
    y luego la guarda en una variable global.
*/
import { PrismaClient } from '@/generated/prisma/client'; 

declare global {
  // permite variables globales
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    // Opcional: se pueden activar los logs para ver las queries en la terminal
    // log: ['query'], 
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;