// app/api/roles/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Obtener todos los roles
export async function GET() {
  try {
    const roles = await prisma.rol.findMany();
    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json({ message: "Error al obtener roles" }, { status: 500 });
  }
}

// POST: Crear un nuevo rol
export async function POST(req: Request) {
  try {
    const { nombre_rol } = await req.json();
    if (!nombre_rol) {
        return NextResponse.json({ message: "El campo 'nombre_rol' es requerido" }, { status: 400 });
    }
    
    const newRol = await prisma.rol.create({
      data: { nombre_rol },
    });
    return NextResponse.json(newRol, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
        return NextResponse.json({ message: "Ese rol ya existe" }, { status: 409 });
    }
    return NextResponse.json({ message: "Error al crear el rol" }, { status: 500 });
  }
}