import { NextResponse } from 'next/server';
import { updateDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const body = await req.json();
  updateDb((d) => ({
    ...d,
    classificationRules: d.classificationRules.map((r) =>
      r.id === params.id ? { ...r, ...body, id: params.id } : r
    ),
  }));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  updateDb((d) => ({
    ...d,
    classificationRules: d.classificationRules.filter((r) => r.id !== params.id),
  }));
  return NextResponse.json({ ok: true });
}
