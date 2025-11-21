//src/lib/auth.ts
import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

// Este es el payload que esperamos de nuestro token
interface AuthPayload {
  userId: number;
  aserraderoId: number;
  [key: string]: any;
}

export async function getAuthPayload(req: NextRequest | Request): Promise<AuthPayload | null> {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token || !process.env.JWT_SECRET) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload as AuthPayload;
    } catch (e) {
        console.error("JWT Verification Error:", e);
        return null;
    }
}