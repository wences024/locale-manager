import { NextResponse } from 'next/server';
import { updateDb, readDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { lineId, saveRule, saveForProduct, ...updates } = await req.json();

  updateDb((d) => {
    let newLines = d.invoiceLines.map((l) => {
      if (l.id !== lineId) return l;
      const newStatus =
        updates.accountingCategoryId || updates.inventoryCategoryId
          ? 'user_corrected'
          : l.status;
      return { ...l, ...updates, status: newStatus, id: lineId };
    });

    // Rimuovi da prodotti non risolti se classificato
    let newUnresolved = d.unresolvedProducts;
    if (updates.accountingCategoryId) {
      newUnresolved = newUnresolved.map((u) =>
        u.invoiceLineId === lineId
          ? { ...u, status: 'resolved' as const, resolvedAt: new Date().toISOString() }
          : u
      );
    }

    // Salva regola se richiesto
    let newRules = d.classificationRules;
    if (saveRule && updates.accountingCategoryId) {
      const line = d.invoiceLines.find((l) => l.id === lineId);
      if (line) {
        const keyword = line.normalizedName.toLowerCase().split(' ')[0];
        newRules = [
          ...newRules,
          {
            id: uuidv4(),
            name: `Auto: ${line.normalizedName}`,
            conditionType: 'contains' as const,
            conditionField: 'product_name' as const,
            conditionValue: keyword,
            accountingCategoryId: updates.accountingCategoryId,
            inventoryCategoryId: updates.inventoryCategoryId,
            priority: 5,
            active: true,
            createdAt: new Date().toISOString(),
            matchCount: 0,
          },
        ];
      }
    }

    return {
      ...d,
      invoiceLines: newLines,
      unresolvedProducts: newUnresolved,
      classificationRules: newRules,
    };
  });

  return NextResponse.json({ ok: true });
}
