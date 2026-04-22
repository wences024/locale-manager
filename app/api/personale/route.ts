import { NextResponse } from 'next/server';
import { readDb, updateDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const db = readDb();
  return NextResponse.json({ staffMembers: db.staffMembers, staffHours: db.staffHours });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const body = await req.json();
  const member = { id: uuidv4(), ...body, active: true };
  updateDb((d) => ({ ...d, staffMembers: [...d.staffMembers, member] }));
  return NextResponse.json({ member }, { status: 201 });
}
