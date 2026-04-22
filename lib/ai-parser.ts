/**
 * Mock AI Parser per fatture e prodotti.
 * In produzione: sostituire con OpenAI GPT-4o Vision o Claude claude-sonnet-4-6.
 * Le funzioni qui simulano il comportamento dell'AI con dati realistici.
 */

import { readDb } from './db';
import type { InvoiceLine, ClassificationRule } from './types';

export interface ParsedInvoiceData {
  supplierName: string;
  invoiceNumber: string;
  date: string;
  totalAmount: number;
  vatAmount: number;
  netAmount: number;
  lines: ParsedLine[];
  confidence: number;
}

export interface ParsedLine {
  originalText: string;
  normalizedName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  suggestedAccountingCategoryId?: string;
  suggestedInventoryCategoryId?: string;
  confidence: number;
  status: 'ai_classified' | 'unresolved';
}

// Dizionario di prodotti noti per il mock
const KNOWN_PRODUCTS: Record<string, { acc: string; inv: string; conf: number }> = {
  'mozzarella': { acc: 'ac-food', inv: 'ic-cucina', conf: 0.97 },
  'pizza': { acc: 'ac-food', inv: 'ic-cucina', conf: 0.96 },
  'pomodoro': { acc: 'ac-food', inv: 'ic-cucina', conf: 0.95 },
  'pasta': { acc: 'ac-food', inv: 'ic-cucina', conf: 0.94 },
  'prosciutto': { acc: 'ac-food', inv: 'ic-cucina', conf: 0.96 },
  'parmigiano': { acc: 'ac-food', inv: 'ic-cucina', conf: 0.95 },
  'olio': { acc: 'ac-food', inv: 'ic-cucina', conf: 0.88 },
  'farina': { acc: 'ac-food', inv: 'ic-cucina', conf: 0.94 },
  'fusto': { acc: 'ac-beer', inv: 'ic-birra-spina', conf: 0.99 },
  'birra': { acc: 'ac-beer', inv: 'ic-bevande', conf: 0.93 },
  'lager': { acc: 'ac-beer', inv: 'ic-birra-spina', conf: 0.96 },
  'ipa': { acc: 'ac-beer', inv: 'ic-birra-spina', conf: 0.95 },
  'coca cola': { acc: 'ac-drinks', inv: 'ic-soft-drink', conf: 0.99 },
  'fanta': { acc: 'ac-drinks', inv: 'ic-soft-drink', conf: 0.98 },
  'sprite': { acc: 'ac-drinks', inv: 'ic-soft-drink', conf: 0.98 },
  'acqua': { acc: 'ac-drinks', inv: 'ic-acqua', conf: 0.97 },
  'gin': { acc: 'ac-drinks', inv: 'ic-alcolici', conf: 0.95 },
  'whisky': { acc: 'ac-drinks', inv: 'ic-alcolici', conf: 0.95 },
  'vodka': { acc: 'ac-drinks', inv: 'ic-alcolici', conf: 0.95 },
  'vino': { acc: 'ac-drinks', inv: 'ic-vino', conf: 0.94 },
  'detergente': { acc: 'ac-cleaning', inv: 'ic-pulizia', conf: 0.92 },
  'candeggina': { acc: 'ac-cleaning', inv: 'ic-pulizia', conf: 0.97 },
  'disinfettante': { acc: 'ac-cleaning', inv: 'ic-pulizia', conf: 0.96 },
  'sacchi': { acc: 'ac-cleaning', inv: 'ic-consumabili', conf: 0.85 },
  'guanti': { acc: 'ac-cleaning', inv: 'ic-consumabili', conf: 0.82 },
  'shopper': { acc: 'ac-packaging', inv: 'ic-packaging', conf: 0.90 },
  'contenitori': { acc: 'ac-packaging', inv: 'ic-packaging', conf: 0.88 },
  'carta forno': { acc: 'ac-food', inv: 'ic-consumabili', conf: 0.75 },
  'pellicola': { acc: 'ac-food', inv: 'ic-consumabili', conf: 0.80 },
};

export function classifyProduct(text: string, rules: ClassificationRule[]): {
  accountingCategoryId?: string;
  inventoryCategoryId?: string;
  confidence: number;
  status: 'ai_classified' | 'unresolved';
} {
  const lower = text.toLowerCase();

  // 1. Applica regole utente (priorità massima)
  const activeRules = rules.filter((r) => r.active).sort((a, b) => b.priority - a.priority);
  for (const rule of activeRules) {
    const val = rule.conditionValue.toLowerCase();
    let match = false;
    switch (rule.conditionType) {
      case 'contains': match = lower.includes(val); break;
      case 'starts_with': match = lower.startsWith(val); break;
      case 'ends_with': match = lower.endsWith(val); break;
      case 'equals': match = lower === val; break;
    }
    if (match) {
      return {
        accountingCategoryId: rule.accountingCategoryId,
        inventoryCategoryId: rule.inventoryCategoryId,
        confidence: 0.98,
        status: 'ai_classified',
      };
    }
  }

  // 2. Dizionario interno
  for (const [keyword, cat] of Object.entries(KNOWN_PRODUCTS)) {
    if (lower.includes(keyword)) {
      return {
        accountingCategoryId: cat.acc,
        inventoryCategoryId: cat.inv,
        confidence: cat.conf,
        status: cat.conf >= 0.70 ? 'ai_classified' : 'unresolved',
      };
    }
  }

  // 3. Non riconosciuto
  return { confidence: 0.30, status: 'unresolved' };
}

export function mockParseInvoicePdf(fileName: string): ParsedInvoiceData {
  const db = readDb();
  const rules = db.classificationRules;

  // Simulazione di parsing realistico
  const suppliers = [
    { name: 'Metro Cash&Carry', inv: 'FT-DEMO-001' },
    { name: 'Fornitore Generico', inv: 'FT-DEMO-002' },
  ];

  const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];
  const now = new Date();

  const rawLines = [
    { text: 'MOZZARELLA FIORDILATTE KG 1 X 6', qty: 6, unit: 'kg', price: 7.80 },
    { text: 'POMODORI SAN MARZANO 400G X 12', qty: 12, unit: 'pz', price: 0.95 },
    { text: 'FARINA 00 KG 5 X 4', qty: 4, unit: 'kg', price: 3.20 },
    { text: 'DETERGENTE MULTIUSO 1L X 6', qty: 6, unit: 'lt', price: 4.50 },
    { text: 'SACCHI RIFIUTI 50PZ', qty: 2, unit: 'cf', price: 6.80 },
  ];

  const lines: ParsedLine[] = rawLines.map((raw) => {
    const total = raw.qty * raw.price;
    const classification = classifyProduct(raw.text, rules);

    return {
      originalText: raw.text,
      normalizedName: raw.text.charAt(0).toUpperCase() + raw.text.slice(1).toLowerCase(),
      quantity: raw.qty,
      unit: raw.unit,
      unitPrice: raw.price,
      totalPrice: parseFloat(total.toFixed(2)),
      suggestedAccountingCategoryId: classification.accountingCategoryId,
      suggestedInventoryCategoryId: classification.inventoryCategoryId,
      confidence: classification.confidence,
      status: classification.status,
    };
  });

  const net = lines.reduce((s, l) => s + l.totalPrice, 0);
  const vat = parseFloat((net * 0.22).toFixed(2));

  return {
    supplierName: randomSupplier.name,
    invoiceNumber: randomSupplier.inv + '-' + Date.now(),
    date: now.toISOString().split('T')[0],
    totalAmount: parseFloat((net + vat).toFixed(2)),
    vatAmount: vat,
    netAmount: parseFloat(net.toFixed(2)),
    lines,
    confidence: 0.85,
  };
}
