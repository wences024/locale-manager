import { NextResponse } from 'next/server';
import { readDb, updateDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') || '';
  const catId = searchParams.get('category') || '';

  const db = readDb();
  let expenses = db.manualExpenses;

  if (month) expenses = expenses.filter((e) => e.date.startsWith(month));
  if (catId) expenses = expenses.filter((e) => e.accountingCategoryId === catId);

  expenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json({
    expenses,
    accountingCategories: db.accountingCategories,
    suppliers: db.suppliers,
  });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const body = await req.json();
  const expense = {
    id: uuidv4(),
    ...body,
    createdAt: new Date().toISOString(),
  };

  updateDb((d) => ({ ...d, manualExpenses: [...d.manualExpenses, expense] }));
  return NextResponse.json({ expense }, { status: 201 });
}
