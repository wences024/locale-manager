import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { createToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const db = readDb();

  const user = db.users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
  }

  const token = await createToken(user.id);

  const cookieStore = cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, businessName: user.businessName },
  });
}
