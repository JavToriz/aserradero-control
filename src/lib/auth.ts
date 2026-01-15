import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

interface AuthPayload {
  userId: number;
  aserraderoId: number;
  roles: string[];
  [key: string]: any;
}

export async function getAuthPayload(req: NextRequest | Request): Promise<AuthPayload | null> {
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    // Si no hay token o no hay secreto, retornamos null silenciosamente
    if (!token || !process.env.JWT_SECRET) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload as AuthPayload;
    } catch (e: any) {
        // SOLUCIÓN:
        // Si el error es de firma (JWSSignatureVerificationFailed), significa que probablemente 
        // es un token de Supabase y no uno nuestro. No es un error crítico del sistema.
        // Solo lo logueamos si es otro tipo de error.
        if (e.code !== 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
            console.error("JWT Verification Error:", e);
        }
        return null;
    }
}