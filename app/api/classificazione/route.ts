import { NextResponse } from 'next/server';
import { readDb, updateDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const db = readDb();

  const pending = db.unresolvedProducts.filter((u) => u.status === 'pending');

  const enriched = pending.map((u) => ({
    ...u,
    invoice: db.invoices.find((i) => i.id === u.invoiceId),
    invoiceLine: db.invoiceLines.find((l) => l.id === u.invoiceLineId),
    suggestedAccountingCategory: db.accountingCategories.find(
      (c) => c.id === u.suggestedAccountingCategoryId
    ),
    suggestedInventoryCategory: db.inventoryCategories.find(
      (c) => c.id === u.suggestedInventoryCategoryId
    ),
  }));

  return NextResponse.json({
    unresolved: enriched,
    accountingCategories: db.accountingCategories,
    inventoryCategories: db.inventoryCategories,
  });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const {
    unresolvedId,
    accountingCategoryId,
    inventoryCategoryId,
    saveRule,
    createProduct,
  } = await req.json();

  updateDb((d) => {
    let newData = { ...d };

    // Aggiorna prodotto non risolto
    newData.unresolvedProducts = d.unresolvedProducts.map((u) =>
      u.id === unresolvedId
        ? { ...u, status: 'resolved' as const, resolvedAt: new Date().toISOString() }
        : u
    );

    // Aggiorna riga fattura
    const unresolved = d.unresolvedProducts.find((u) => u.id === unresolvedId);
    if (unresolved) {
      newData.invoiceLines = d.invoiceLines.map((l) =>
        l.id === unresolved.invoiceLineId
          ? {
              ...l,
              accountingCategoryId,
              inventoryCategoryId,
              status: 'user_corrected' as const,
            }
          : l
      );

      // Salva regola
      if (saveRule) {
        const keyword = unresolved.originalText.toLowerCase().split(' ').slice(0, 2).join(' ');
        newData.classificationRules = [
          ...newData.classificationRules,
          {
            id: uuidv4(),
            name: `Regola: ${unresolved.originalText.slice(0, 30)}`,
            conditionType: 'contains' as const,
            conditionField: 'product_name' as const,
            conditionValue: keyword,
            accountingCategoryId,
            inventoryCategoryId,
            priority: 5,
            active: true,
            createdAt: new Date().toISOString(),
            matchCount: 0,
          },
        ];
      }

      // Crea prodotto inventario
      if (createProduct) {
        const line = d.invoiceLines.find((l) => l.id === unresolved.invoiceLineId);
        if (line) {
          newData.products = [
            ...newData.products,
            {
              id: uuidv4(),
              name: line.normalizedName,
              normalizedName: line.normalizedName.toLowerCase(),
              accountingCategoryId,
              inventoryCategoryId: inventoryCategoryId || '',
              unit: line.unit,
              averageCost: line.unitPrice,
              lastCost: line.unitPrice,
              active: true,
              stockQuantity: 0,
              createdAt: new Date().toISOString(),
            },
          ];
        }
      }
    }

    return newData;
  });

  return NextResponse.json({ ok: true });
}
