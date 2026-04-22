import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { readDb } from './db';
import type { User } from './types';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'locale-gestionale-secret'
);

export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { userId: payload.userId as string };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<User | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const db = readDb();
  return db.users.find((u) => u.id === payload.userId) ?? null;
}

export function requireAuth() {
  return getSession();
}
