// src/lib/permissions.ts
// Biblioteca para manejo de permisos y roles de usuario
import { NextResponse } from 'next/server';

// Definición centralizada de permisos
export const PERMISSIONS = {
  CAN_MANAGE_ALL: ['admin'],

  // Admin y Vendedor pueden ver y crear ventas
  CAN_MANAGE_SALES: ['admin', 'vendedor'],

  // Admin y Trabajador ven producción
  CAN_MANAGE_PRODUCTION: ['admin', 'trabajador'],
  
  // Vendedores pueden crear pero NO eliminar
  CAN_DELETE_SALES: ['admin'], 
};

export function hasRole(userRoles: string[], allowedRoles: string[]): boolean {
  return userRoles.some(role => allowedRoles.includes(role));
}

export function authorize(userRoles: string[], allowedRoles: string[]) {
  if (!hasRole(userRoles, allowedRoles)) {
    return false;
  }
  return true;
}