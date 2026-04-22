import { NextResponse } from 'next/server';
import { readDb, updateDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const catId = searchParams.get('category') || '';

  const db = readDb();
  let products = db.products.filter((p) => p.active);

  if (search) {
    products = products.filter((p) =>
      p.name.toLowerCase().includes(search) || p.normalizedName.toLowerCase().includes(search)
    );
  }
  if (catId) {
    products = products.filter((p) => p.inventoryCategoryId === catId);
  }

  return NextResponse.json({
    products,
    accountingCategories: db.accountingCategories,
    inventoryCategories: db.inventoryCategories,
    suppliers: db.suppliers,
    movements: db.inventoryMovements,
  });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const body = await req.json();
  const product = {
    id: uuidv4(),
    ...body,
    active: true,
    stockQuantity: 0,
    averageCost: body.lastCost || 0,
    createdAt: new Date().toISOString(),
  };

  updateDb((d) => ({ ...d, products: [...d.products, product] }));
  return NextResponse.json({ product }, { status: 201 });
}
