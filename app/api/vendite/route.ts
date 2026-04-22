import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const importId = searchParams.get('importId') || '';

  const db = readDb();
  const imports = [...db.salesImports].sort((a, b) =>
    b.importDate.localeCompare(a.importDate)
  );

  let lines = db.salesLines;
  if (importId) lines = lines.filter((l) => l.importId === importId);

  return NextResponse.json({
    imports,
    lines,
    accountingCategories: db.accountingCategories,
    mappingRules: db.salesMappingRules,
  });
}
