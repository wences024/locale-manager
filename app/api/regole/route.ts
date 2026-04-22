import { NextResponse } from 'next/server';
import { readDb, updateDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const db = readDb();
  return NextResponse.json({
    rules: db.classificationRules.sort((a, b) => b.priority - a.priority),
    accountingCategories: db.accountingCategories,
    inventoryCategories: db.inventoryCategories,
  });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const body = await req.json();
  const rule = { id: uuidv4(), ...body, createdAt: new Date().toISOString(), matchCount: 0 };
  updateDb((d) => ({ ...d, classificationRules: [...d.classificationRules, rule] }));
  return NextResponse.json({ rule }, { status: 201 });
}
