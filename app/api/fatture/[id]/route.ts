import { NextResponse } from 'next/server';
import { readDb, updateDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const db = readDb();
  const invoice = db.invoices.find((i) => i.id === params.id);
  if (!invoice) return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 });

  const lines = db.invoiceLines.filter((l) => l.invoiceId === params.id);
  const supplier = db.suppliers.find((s) => s.id === invoice.supplierId);

  return NextResponse.json({
    invoice,
    lines,
    supplier,
    accountingCategories: db.accountingCategories,
    inventoryCategories: db.inventoryCategories,
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const body = await req.json();
  const db = readDb();

  if (!db.invoices.find((i) => i.id === params.id)) {
    return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 });
  }

  updateDb((d) => ({
    ...d,
    invoices: d.invoices.map((i) =>
      i.id === params.id ? { ...i, ...body, id: params.id } : i
    ),
  }));

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  updateDb((d) => ({
    ...d,
    invoices: d.invoices.filter((i) => i.id !== params.id),
    invoiceLines: d.invoiceLines.filter((l) => l.invoiceId !== params.id),
  }));

  return NextResponse.json({ ok: true });
}
