import { NextResponse } from 'next/server';
import { readDb, updateDb } from '@/lib/db';
import { createToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// GET — controlla se il setup è già stato completato
export async function GET() {
  const db = readDb();
  return NextResponse.json({ setupDone: db.users.length > 0 });
}

// POST — crea il primo utente amministratore
export async function POST(req: Request) {
  const db = readDb();

  // Blocca se esiste già un utente
  if (db.users.length > 0) {
    return NextResponse.json({ error: 'Setup già completato.' }, { status: 403 });
  }

  const { name, businessName, email, password } = await req.json();

  if (!name || !businessName || !email || !password) {
    return NextResponse.json({ error: 'Tutti i campi sono obbligatori.' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'La password deve essere di almeno 6 caratteri.' }, { status: 400 });
  }

  const userId = uuidv4();
  const user = {
    id: userId,
    name,
    businessName,
    email: email.toLowerCase().trim(),
    password,
    createdAt: new Date().toISOString(),
  };

  updateDb((d) => ({ ...d, users: [user] }));

  // Login automatico dopo il setup
  const token = await createToken(userId);
  const cookieStore = cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return NextResponse.json({
    ok: true,
    user: { id: userId, name, email, businessName },
  });
}
