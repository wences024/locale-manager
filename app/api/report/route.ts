import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

  const db = readDb();

  // Ricavi dal mese selezionato
  const monthImports = db.salesImports.filter(
    (si) =>
      si.status === 'imported' &&
      (si.periodStart.startsWith(month) || si.periodEnd.startsWith(month))
  );
  const importIds = monthImports.map((si) => si.id);
  const salesLines = db.salesLines.filter((l) => importIds.includes(l.importId));

  const totalRevenue = salesLines.reduce((s, l) => s + l.revenue, 0);

  // Revenue per categoria
  const revenueByCategory: Record<string, number> = {};
  for (const line of salesLines) {
    const catId = line.accountingCategoryId || 'other';
    revenueByCategory[catId] = (revenueByCategory[catId] || 0) + line.revenue;
  }

  // Costi da fatture
  const invoices = db.invoices.filter((i) => i.date.startsWith(month));
  const invoiceIds = invoices.map((i) => i.id);
  const invoiceLines = db.invoiceLines.filter((l) => invoiceIds.includes(l.invoiceId));
  const invoiceCosts = invoiceLines.reduce((s, l) => s + l.totalPrice, 0);

  // Costi per categoria (fatture)
  const costsByCategory: Record<string, number> = {};
  for (const line of invoiceLines) {
    const catId = line.accountingCategoryId || 'other';
    costsByCategory[catId] = (costsByCategory[catId] || 0) + line.totalPrice;
  }

  // Spese manuali
  const manualExpenses = db.manualExpenses.filter((e) => e.date.startsWith(month));
  const manualCosts = manualExpenses.reduce((s, e) => s + e.amount, 0);
  for (const exp of manualExpenses) {
    const catId = exp.accountingCategoryId || 'other';
    costsByCategory[catId] = (costsByCategory[catId] || 0) + exp.amount;
  }

  // Personale
  const staffHours = db.staffHours.filter((h) => h.date.startsWith(month));
  const staffCost = staffHours.reduce((s, h) => s + h.totalCost, 0);
  const totalOrdinary = staffHours.reduce((s, h) => s + h.ordinaryHours, 0);
  const totalExtra = staffHours.reduce((s, h) => s + h.extraHours, 0);
  costsByCategory['ac-staff'] = (costsByCategory['ac-staff'] || 0) + staffCost;

  const totalCosts = invoiceCosts + manualCosts + staffCost;
  const netResult = totalRevenue - totalCosts;

  // Prodotti non classificati
  const unresolvedCount = db.unresolvedProducts.filter((u) => u.status === 'pending').length;

  // Costi fissi vs variabili (fissi: affitto, utenze, software)
  const fixedCatIds = ['ac-rent', 'ac-utilities', 'ac-software'];
  let fixedCosts = 0;
  let variableCosts = 0;
  for (const [catId, amount] of Object.entries(costsByCategory)) {
    if (fixedCatIds.includes(catId)) fixedCosts += amount;
    else variableCosts += amount;
  }

  return NextResponse.json({
    month,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalCosts: parseFloat(totalCosts.toFixed(2)),
    netResult: parseFloat(netResult.toFixed(2)),
    invoiceCosts: parseFloat(invoiceCosts.toFixed(2)),
    manualCosts: parseFloat(manualCosts.toFixed(2)),
    staffCost: parseFloat(staffCost.toFixed(2)),
    fixedCosts: parseFloat(fixedCosts.toFixed(2)),
    variableCosts: parseFloat(variableCosts.toFixed(2)),
    totalOrdinaryHours: totalOrdinary,
    totalExtraHours: totalExtra,
    revenueByCategory,
    costsByCategory,
    unresolvedCount,
    accountingCategories: db.accountingCategories,
    invoices,
    manualExpenses,
    salesLines,
    staffHours,
  });
}
