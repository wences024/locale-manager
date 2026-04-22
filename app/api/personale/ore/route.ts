import { NextResponse } from 'next/server';
import { updateDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const body = await req.json();
  const member = { id: uuidv4(), ...body };

  updateDb((d) => {
    const staffMember = d.staffMembers.find((s) => s.id === body.staffMemberId);
    const ordinary = body.ordinaryHours * (staffMember?.hourlyRate || 0);
    const extra = body.extraHours * (staffMember?.extraHourlyRate || 0);
    const totalCost = ordinary + extra;
    const entry = { ...member, totalCost };
    return { ...d, staffHours: [...d.staffHours, entry] };
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const { id } = await req.json();
  updateDb((d) => ({ ...d, staffHours: d.staffHours.filter((h) => h.id !== id) }));
  return NextResponse.json({ ok: true });
}
