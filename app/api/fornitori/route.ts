import { NextResponse } from 'next/server';
import { readDb, updateDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const db = readDb();
  return NextResponse.json({ suppliers: db.suppliers });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const body = await req.json();
  const supplier = { id: uuidv4(), ...body, createdAt: new Date().toISOString() };
  updateDb((d) => ({ ...d, suppliers: [...d.suppliers, supplier] }));
  return NextResponse.json({ supplier }, { status: 201 });
}
