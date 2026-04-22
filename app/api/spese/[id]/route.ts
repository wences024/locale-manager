import { NextResponse } from 'next/server';
import { updateDb, readDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const body = await req.json();
  updateDb((d) => ({
    ...d,
    manualExpenses: d.manualExpenses.map((e) =>
      e.id === params.id ? { ...e, ...body, id: params.id } : e
    ),
  }));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  updateDb((d) => ({
    ...d,
    manualExpenses: d.manualExpenses.filter((e) => e.id !== params.id),
  }));
  return NextResponse.json({ ok: true });
}
