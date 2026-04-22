import { NextResponse } from 'next/server';
import { readDb, updateDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const db = readDb();
  return NextResponse.json({
    accountingCategories: db.accountingCategories,
    inventoryCategories: db.inventoryCategories,
  });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const { type, ...body } = await req.json();
  const cat = { id: uuidv4(), ...body };
  if (type === 'accounting') {
    updateDb((d) => ({ ...d, accountingCategories: [...d.accountingCategories, cat] }));
  } else {
    updateDb((d) => ({ ...d, inventoryCategories: [...d.inventoryCategories, cat] }));
  }
  return NextResponse.json({ category: cat }, { status: 201 });
}
