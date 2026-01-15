import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

interface AuthPayload {
  userId: number;
  aserraderoId: number;
  roles: string[];
  [key: string]: unknown; // Cambiado 'any' por 'unknown' para silenciar el linter de forma segura
}

export async function getAuthPayload(req: NextRequest | Request): Promise<AuthPayload | null> {
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    // Si no hay token o no hay secreto, retornamos null silenciosamente
    if (!token || !process.env.JWT_SECRET) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as AuthPayload; // Doble cast necesario a veces con librerías externas
    } catch (e) {
        // SOLUCIÓN: Validamos que 'e' sea un objeto con la propiedad code
        const errorCode = (e as { code?: string })?.code;

        if (errorCode !== 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
            console.error("JWT Verification Error:", e);
        }
        return null;
    }
}