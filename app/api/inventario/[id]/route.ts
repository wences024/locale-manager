import { NextResponse } from 'next/server';
import { readDb, updateDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const db = readDb();
  const product = db.products.find((p) => p.id === params.id);
  if (!product) return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 });
  const movements = db.inventoryMovements.filter((m) => m.productId === params.id);
  const supplier = db.suppliers.find((s) => s.id === product.defaultSupplierId);
  return NextResponse.json({
    product,
    movements,
    supplier,
    accountingCategories: db.accountingCategories,
    inventoryCategories: db.inventoryCategories,
    suppliers: db.suppliers,
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const body = await req.json();
  updateDb((d) => ({
    ...d,
    products: d.products.map((p) =>
      p.id === params.id ? { ...p, ...body, id: params.id } : p
    ),
  }));
  return NextResponse.json({ ok: true });
}
