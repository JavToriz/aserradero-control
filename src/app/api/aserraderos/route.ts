 
// Ruta API para manejar operaciones relacionadas con "aserraderos"

import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

//const prisma = new PrismaClient(); 

// Función para OBTENER todos los aserraderos
export async function GET() {  
    try {
        const aserraderos = await prisma.aserradero.findMany();
        return NextResponse.json(aserraderos);
    } catch (error) {
        console.error("Error fetching aserraderos:", error);
        return NextResponse.json({ error: "Error al obtener aserradeors" }, { status: 500 });
    }

}

// Función para CREAR un nuevo aserradero
export async function POST(req: Request) {
   try {
    const data = await req.json();
    const newAserradero = await prisma.aserradero.create({ data });
    return NextResponse.json(newAserradero, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error al crear el aserradero" }, { status: 500 });
  }
}