// prisma/seed.ts
// Script de seed para crear roles iniciales en la base de datos
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Definimos los roles que necesitamos
  const roles = ['admin', 'vendedor', 'trabajador'];

  for (const nombre of roles) {
    await prisma.rol.upsert({
      where: { nombre_rol: nombre },
      update: {}, // Si existe, no hace nada
      create: { nombre_rol: nombre }, // Si no existe, lo crea
    });
  }

  console.log('✅ Roles creados/verificados correctamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });