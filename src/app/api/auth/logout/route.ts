import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // En un sistema más complejo, aquí se podría añadir el token a una "lista negra"
  // para invalidarlo inmediatamente en el servidor.
  // Para nuestro caso, simplemente confirmamos que la acción de logout fue recibida.

  return NextResponse.json({ message: "Cierre de sesión exitoso" });
}