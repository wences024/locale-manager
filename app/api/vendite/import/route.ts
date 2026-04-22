import { NextResponse } from 'next/server';
import { updateDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { parseExcelBuffer } from '@/lib/excel-parser';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const confirmImport = formData.get('confirm') === 'true';
  const importId = formData.get('importId') as string | null;
  const pendingLines = formData.get('lines') as string | null;

  if (!file && !confirmImport) {
    return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 });
  }

  // Conferma importazione precedentemente analizzata
  if (confirmImport && importId && pendingLines) {
    const lines = JSON.parse(pendingLines);
    updateDb((d) => ({
      ...d,
      salesImports: d.salesImports.map((si) =>
        si.id === importId ? { ...si, status: 'imported' as const } : si
      ),
      salesLines: [...d.salesLines, ...lines],
    }));
    return NextResponse.json({ ok: true, importId });
  }

  // Parsing del file
  const buffer = Buffer.from(await file!.arrayBuffer());
  const parsed = parseExcelBuffer(buffer);

  const newImportId = uuidv4();
  const newImport = {
    id: newImportId,
    fileName: file!.name,
    importDate: new Date().toISOString(),
    periodStart: parsed.periodStart,
    periodEnd: parsed.periodEnd,
    status: 'preview' as const,
    totalRevenue: parsed.totalRevenue,
    linesCount: parsed.rows.length,
  };

  const lines = parsed.rows.map((row) => ({
    id: uuidv4(),
    importId: newImportId,
    date: row.date,
    product: row.product,
    department: row.department,
    quantity: row.quantity,
    revenue: row.revenue,
    accountingCategoryId: row.accountingCategoryId,
    paymentMethod: row.paymentMethod,
    mappingStatus: row.mappingStatus,
  }));

  // Salva import in stato preview
  updateDb((d) => ({ ...d, salesImports: [...d.salesImports, newImport] }));

  return NextResponse.json({
    importId: newImportId,
    import: newImport,
    lines,
    unmappedDepartments: parsed.unmappedDepartments,
    warnings: parsed.warnings,
  });
}
