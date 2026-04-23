import { NextResponse } from 'next/server';
import { readDb, updateDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { parseInvoiceFile, classifyProduct } from '@/lib/ai-parser';

export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const status = searchParams.get('status') || '';

  const db = readDb();
  let invoices = db.invoices;

  if (search) {
    invoices = invoices.filter((i) =>
      i.supplierName.toLowerCase().includes(search) ||
      i.invoiceNumber.toLowerCase().includes(search)
    );
  }
  if (status) {
    invoices = invoices.filter((i) => i.status === status);
  }

  // Sort by date desc
  invoices = [...invoices].sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json({
    invoices,
    suppliers: db.suppliers,
    accountingCategories: db.accountingCategories,
  });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const manualData = formData.get('data') as string | null;

  if (!file && !manualData) {
    return NextResponse.json({ error: 'Nessun file o dati forniti' }, { status: 400 });
  }

  const db = readDb();

  if (manualData) {
    // Inserimento manuale
    const data = JSON.parse(manualData);
    const invoice = {
      id: uuidv4(),
      ...data,
      status: 'confirmed' as const,
      createdAt: new Date().toISOString(),
    };
    updateDb((d) => ({ ...d, invoices: [...d.invoices, invoice] }));
    return NextResponse.json({ invoice });
  }

  // Parsing con GPT-4o Vision (fallback al mock se OPENAI_API_KEY non è impostata)
  const arrayBuffer = await file!.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);
  const mimeType = file!.type || 'image/jpeg';
  const parsed = await parseInvoiceFile(fileBuffer, file!.name, mimeType);
  const invoiceId = uuidv4();

  const invoice = {
    id: invoiceId,
    supplierName: parsed.supplierName,
    invoiceNumber: parsed.invoiceNumber,
    date: parsed.date,
    totalAmount: parsed.totalAmount,
    vatAmount: parsed.vatAmount,
    netAmount: parsed.netAmount,
    fileName: file!.name,
    fileType: file!.type.includes('pdf') ? 'pdf' : 'image',
    status: 'parsed' as const,
    parsingConfidence: parsed.confidence,
    notes: '',
    createdAt: new Date().toISOString(),
  };

  const lines = parsed.lines.map((l) => ({
    id: uuidv4(),
    invoiceId,
    originalText: l.originalText,
    normalizedName: l.normalizedName,
    quantity: l.quantity,
    unit: l.unit,
    unitPrice: l.unitPrice,
    totalPrice: l.totalPrice,
    accountingCategoryId: l.status === 'ai_classified' ? l.suggestedAccountingCategoryId : undefined,
    inventoryCategoryId: l.status === 'ai_classified' ? l.suggestedInventoryCategoryId : undefined,
    aiSuggestedAccountingCategoryId: l.suggestedAccountingCategoryId,
    aiSuggestedInventoryCategoryId: l.suggestedInventoryCategoryId,
    aiConfidence: l.confidence,
    status: l.status,
    notes: '',
  }));

  // Aggiungi prodotti non risolti
  const unresolved = lines
    .filter((l) => l.status === 'unresolved')
    .map((l) => ({
      id: uuidv4(),
      originalText: l.originalText,
      invoiceId,
      invoiceLineId: l.id,
      supplierName: parsed.supplierName,
      suggestedAccountingCategoryId: l.aiSuggestedAccountingCategoryId,
      suggestedInventoryCategoryId: l.aiSuggestedInventoryCategoryId,
      aiConfidence: l.aiConfidence,
      status: 'pending' as const,
    }));

  updateDb((d) => ({
    ...d,
    invoices: [...d.invoices, invoice],
    invoiceLines: [...d.invoiceLines, ...lines],
    unresolvedProducts: [...d.unresolvedProducts, ...unresolved],
  }));

  return NextResponse.json({ invoice, lines, unresolved });
}
