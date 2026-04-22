/**
 * Parser Excel per file esportati da Cassa in Cloud.
 * In produzione: usare questa logica con i file reali del cliente.
 * Il formato Cassa in Cloud può variare — supportiamo più layout.
 */

import * as XLSX from 'xlsx';
import { readDb } from './db';

export interface CassaCloudRow {
  date: string;
  product: string;
  department: string;
  quantity: number;
  revenue: number;
  paymentMethod?: string;
  accountingCategoryId?: string;
  mappingStatus: 'auto' | 'manual' | 'unresolved';
}

export interface ParsedExcelResult {
  rows: CassaCloudRow[];
  totalRevenue: number;
  periodStart: string;
  periodEnd: string;
  unmappedDepartments: string[];
  warnings: string[];
}

// Mapping nomi colonne Cassa in Cloud (vari formati)
const DATE_COLS = ['data', 'date', 'giorno', 'Data'];
const PRODUCT_COLS = ['prodotto', 'product', 'descrizione', 'Prodotto', 'Descrizione'];
const DEPT_COLS = ['reparto', 'department', 'categoria', 'Reparto', 'Categoria'];
const QTY_COLS = ['quantita', 'qty', 'quantità', 'Quantità', 'Quantita', 'Pezzi'];
const REV_COLS = ['importo', 'incasso', 'revenue', 'totale', 'Importo', 'Incasso', 'Totale'];
const PAY_COLS = ['metodo_pagamento', 'pagamento', 'payment', 'Pagamento', 'Metodo pagamento'];

function findCol(headers: string[], candidates: string[]): string | null {
  for (const candidate of candidates) {
    const found = headers.find(
      (h) => h.toLowerCase().trim() === candidate.toLowerCase().trim()
    );
    if (found) return found;
  }
  return null;
}

export function parseExcelBuffer(buffer: Buffer): ParsedExcelResult {
  const db = readDb();
  const mappingRules = db.salesMappingRules;

  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

  if (rawRows.length === 0) {
    return { rows: [], totalRevenue: 0, periodStart: '', periodEnd: '', unmappedDepartments: [], warnings: ['File vuoto o formato non riconosciuto'] };
  }

  const headers = Object.keys(rawRows[0]);
  const dateCol = findCol(headers, DATE_COLS);
  const productCol = findCol(headers, PRODUCT_COLS);
  const deptCol = findCol(headers, DEPT_COLS);
  const qtyCol = findCol(headers, QTY_COLS);
  const revCol = findCol(headers, REV_COLS);
  const payCol = findCol(headers, PAY_COLS);

  const warnings: string[] = [];
  if (!dateCol) warnings.push('Colonna data non trovata');
  if (!revCol) warnings.push('Colonna importo/incasso non trovata');

  const unmappedDepts = new Set<string>();
  const rows: CassaCloudRow[] = [];
  const dates: string[] = [];

  for (const raw of rawRows) {
    const dateRaw = dateCol ? String(raw[dateCol] || '') : '';
    const product = productCol ? String(raw[productCol] || '') : 'Prodotto sconosciuto';
    const dept = deptCol ? String(raw[deptCol] || '').toUpperCase().trim() : '';
    const qty = qtyCol ? parseFloat(String(raw[qtyCol] || '0').replace(',', '.')) || 1 : 1;
    const revenue = revCol ? parseFloat(String(raw[revCol] || '0').replace(',', '.')) || 0 : 0;
    const payMethod = payCol ? String(raw[payCol] || '') : '';

    // Normalizza data (gestisce vari formati)
    let date = dateRaw;
    if (!date || date === '') continue;

    // Excel date serial
    if (/^\d{4,5}$/.test(date)) {
      const d = XLSX.SSF.parse_date_code(parseInt(date));
      date = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    } else if (/\d{2}\/\d{2}\/\d{4}/.test(date)) {
      const [dd, mm, yyyy] = date.split('/');
      date = `${yyyy}-${mm}-${dd}`;
    }

    dates.push(date);

    // Mappa reparto → categoria contabile
    const rule = mappingRules.find((r) => r.originalDepartment === dept);
    let accountingCategoryId: string | undefined;
    let mappingStatus: 'auto' | 'manual' | 'unresolved' = 'unresolved';

    if (rule) {
      accountingCategoryId = rule.accountingCategoryId;
      mappingStatus = 'auto';
    } else if (dept) {
      unmappedDepts.add(dept);
    }

    rows.push({
      date,
      product,
      department: dept,
      quantity: qty,
      revenue,
      paymentMethod: payMethod || undefined,
      accountingCategoryId,
      mappingStatus,
    });
  }

  const sorted = [...dates].sort();
  const periodStart = sorted[0] || '';
  const periodEnd = sorted[sorted.length - 1] || '';
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);

  return {
    rows,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    periodStart,
    periodEnd,
    unmappedDepartments: Array.from(unmappedDepts),
    warnings,
  };
}

export function generateMockExcelBuffer(): Buffer {
  const data = [
    { Data: '01/06/2024', Prodotto: 'Pizza Margherita', Reparto: 'CUCINA', Quantità: 5, Importo: 55.0, Pagamento: 'Carta' },
    { Data: '01/06/2024', Prodotto: 'Birra alla Spina', Reparto: 'BIRRA', Quantità: 8, Importo: 40.0, Pagamento: 'Contanti' },
    { Data: '01/06/2024', Prodotto: 'Coca Cola 33cl', Reparto: 'BEVANDE', Quantità: 6, Importo: 21.0, Pagamento: 'Carta' },
    { Data: '02/06/2024', Prodotto: 'Pasta Carbonara', Reparto: 'CUCINA', Quantità: 4, Importo: 52.0, Pagamento: 'Carta' },
    { Data: '02/06/2024', Prodotto: 'Spritz Aperol', Reparto: 'COCKTAIL', Quantità: 6, Importo: 48.0, Pagamento: 'Contanti' },
    { Data: '03/06/2024', Prodotto: 'Hamburger Classico', Reparto: 'CUCINA', Quantità: 7, Importo: 84.0, Pagamento: 'Carta' },
    { Data: '03/06/2024', Prodotto: 'Birra IPA 33cl', Reparto: 'BIRRA', Quantità: 12, Importo: 60.0, Pagamento: 'Carta' },
    { Data: '04/06/2024', Prodotto: 'Tiramisu', Reparto: 'DOLCI', Quantità: 3, Importo: 21.0, Pagamento: 'Contanti' },
    { Data: '04/06/2024', Prodotto: 'Gin Tonic', Reparto: 'COCKTAIL', Quantità: 5, Importo: 45.0, Pagamento: 'Carta' },
    { Data: '05/06/2024', Prodotto: 'Piadina Prosciutto', Reparto: 'CUCINA', Quantità: 9, Importo: 81.0, Pagamento: 'Carta' },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Vendite');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
