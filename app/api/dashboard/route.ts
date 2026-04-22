import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const db = readDb();

  // Calcola dati per il mese corrente e precedente
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  function getMonthData(month: string) {
    // Ricavi (da vendite importate)
    const salesLines = db.salesLines.filter((l) => {
      const imp = db.salesImports.find((i) => i.id === l.importId);
      return imp && (imp.periodStart.startsWith(month) || imp.periodEnd.startsWith(month));
    });

    const revenueByCategory: Record<string, number> = {};
    for (const line of salesLines) {
      const catId = line.accountingCategoryId || 'other';
      revenueByCategory[catId] = (revenueByCategory[catId] || 0) + line.revenue;
    }
    const totalRevenue = salesLines.reduce((s, l) => s + l.revenue, 0);

    // Costi da fatture
    const invoiceLines = db.invoiceLines.filter((il) => {
      const inv = db.invoices.find((i) => i.id === il.invoiceId);
      return inv && inv.date.startsWith(month);
    });
    const invoiceCosts = invoiceLines.reduce((s, l) => s + l.totalPrice, 0);

    // Spese manuali
    const manualExpenses = db.manualExpenses.filter((e) => e.date.startsWith(month));
    const manualCosts = manualExpenses.reduce((s, e) => s + e.amount, 0);

    // Personale
    const staffHours = db.staffHours.filter((h) => h.date.startsWith(month));
    const staffCost = staffHours.reduce((s, h) => s + h.totalCost, 0);

    const totalCosts = invoiceCosts + manualCosts + staffCost;
    const netResult = totalRevenue - totalCosts;

    // Costi per categoria
    const costsByCategory: Record<string, number> = {};
    for (const line of invoiceLines) {
      const catId = line.accountingCategoryId || 'other';
      costsByCategory[catId] = (costsByCategory[catId] || 0) + line.totalPrice;
    }
    for (const exp of manualExpenses) {
      const catId = exp.accountingCategoryId || 'other';
      costsByCategory[catId] = (costsByCategory[catId] || 0) + exp.amount;
    }

    return {
      totalRevenue,
      totalCosts,
      staffCost,
      netResult,
      revenueByCategory,
      costsByCategory,
      invoiceCosts,
      manualCosts,
    };
  }

  const current = getMonthData(currentMonth);
  const prev = getMonthData(prevMonth);

  // Prodotti da classificare
  const unresolvedCount = db.unresolvedProducts.filter((u) => u.status === 'pending').length;

  // Ore extra del personale nel mese corrente
  const currentStaffHours = db.staffHours.filter((h) => h.date.startsWith(currentMonth));
  const extraHours = currentStaffHours.reduce((s, h) => s + h.extraHours, 0);

  // Trend mensile (ultimi 6 mesi)
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = d.toLocaleDateString('it-IT', { month: 'short' });
    const data = getMonthData(m);
    trend.push({
      month: monthName,
      ricavi: Math.round(data.totalRevenue),
      costi: Math.round(data.totalCosts),
      netto: Math.round(data.netResult),
    });
  }

  // Insights automatici
  const insights: string[] = [];
  if (unresolvedCount > 0) {
    insights.push(`⚠️ Ci sono ${unresolvedCount} prodotti da classificare`);
  }
  if (extraHours > 20) {
    insights.push(`👥 Le ore extra del personale sono aumentate (${extraHours}h questo mese)`);
  }
  const foodRev = current.revenueByCategory['ac-food'] || 0;
  const drinksCost = current.costsByCategory['ac-drinks'] || 0;
  const drinksRev = current.revenueByCategory['ac-drinks'] || 0;
  if (drinksRev > 0 && drinksCost / drinksRev > 0.4) {
    insights.push('🍹 Il costo Drinks è alto rispetto ai ricavi');
  }
  if (current.netResult < 0) {
    insights.push('📉 Attenzione: risultato netto negativo questo mese');
  }

  return NextResponse.json({
    current,
    prev,
    trend,
    unresolvedCount,
    extraHours,
    insights,
    categories: db.accountingCategories,
  });
}
