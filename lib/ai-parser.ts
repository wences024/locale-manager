/**
 * Parser fatture con GPT-4o Vision (OpenAI).
 * Richiede la variabile d'ambiente OPENAI_API_KEY.
 * Se non è impostata, usa il parser mock come fallback.
 */

import OpenAI from 'openai';
import { readDb } from './db';
import type { AppData, ClassificationRule, AccountingCategory, InventoryCategory } from './types';

// ─── Interfacce pubbliche ───────────────────────────────────────────────────

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

// ─── Classificazione con regole utente + dizionario interno ────────────────

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
};

export function classifyProduct(text: string, rules: ClassificationRule[]): {
  accountingCategoryId?: string;
  inventoryCategoryId?: string;
  confidence: number;
  status: 'ai_classified' | 'unresolved';
} {
  const lower = text.toLowerCase();

  // 1. Regole utente (priorità massima)
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
      return { accountingCategoryId: rule.accountingCategoryId, inventoryCategoryId: rule.inventoryCategoryId, confidence: 0.98, status: 'ai_classified' };
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

  return { confidence: 0.30, status: 'unresolved' };
}

// ─── Parser GPT-4o Vision ──────────────────────────────────────────────────

function buildSystemPrompt(accCats: AccountingCategory[], invCats: InventoryCategory[]): string {
  const accList = accCats.map((c) => `- ${c.id}: ${c.name} (${c.type})`).join('\n');
  const invList = invCats.map((c) => `- ${c.id}: ${c.name}`).join('\n');

  return `Sei un assistente specializzato nell'analisi di fatture per bar e ristoranti italiani.
Analizza l'immagine o il documento della fattura e restituisci SOLO un oggetto JSON valido, senza testo aggiuntivo.

Categorie contabili disponibili:
${accList}

Categorie inventario disponibili:
${invList}

Il JSON deve avere questa struttura esatta:
{
  "supplierName": "nome fornitore",
  "invoiceNumber": "numero fattura",
  "date": "YYYY-MM-DD",
  "totalAmount": 123.45,
  "vatAmount": 22.45,
  "netAmount": 101.00,
  "confidence": 0.90,
  "lines": [
    {
      "originalText": "testo originale dalla fattura",
      "normalizedName": "nome normalizzato del prodotto",
      "quantity": 6,
      "unit": "kg",
      "unitPrice": 7.80,
      "totalPrice": 46.80,
      "suggestedAccountingCategoryId": "id-categoria-contabile-o-null",
      "suggestedInventoryCategoryId": "id-categoria-inventario-o-null",
      "confidence": 0.95
    }
  ]
}

Regole:
- Usa SOLO gli ID delle categorie fornite sopra. Se non sei sicuro, usa null.
- confidence deve essere tra 0 e 1 (1 = certezza assoluta).
- Se non riesci a leggere un campo, usa valori ragionevoli (0 per numeri, stringa vuota per testo).
- Restituisci SOLO il JSON, niente altro.`;
}

async function parseWithGPT(
  fileBuffer: Buffer,
  mimeType: string,
  db: AppData
): Promise<ParsedInvoiceData | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[ai-parser] OPENAI_API_KEY non impostata — uso mock');
    return null;
  }

  const client = new OpenAI({ apiKey });
  const systemPrompt = buildSystemPrompt(db.accountingCategories, db.inventoryCategories);
  const base64 = fileBuffer.toString('base64');

  // GPT-4o supporta immagini e PDF come image_url con base64
  const imageMediaType = mimeType === 'application/pdf' ? 'image/jpeg' : mimeType as 'image/jpeg' | 'image/png' | 'image/webp';

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageMediaType};base64,${base64}`,
                detail: 'high',
              },
            },
            { type: 'text', text: 'Analizza questa fattura e restituisci il JSON.' },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '';

    // Estrai il JSON dalla risposta (rimuovi eventuali ```json ... ```)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Nessun JSON nella risposta GPT');

    const parsed = JSON.parse(jsonMatch[0]);

    // Applica le regole utente alle righe per migliorare la classificazione
    const lines: ParsedLine[] = (parsed.lines ?? []).map((l: any) => {
      // Se GPT ha già assegnato una categoria valida, usala; altrimenti prova con regole
      const hasValidAcc = db.accountingCategories.some((c) => c.id === l.suggestedAccountingCategoryId);
      const hasValidInv = db.inventoryCategories.some((c) => c.id === l.suggestedInventoryCategoryId);

      let accId = hasValidAcc ? l.suggestedAccountingCategoryId : undefined;
      let invId = hasValidInv ? l.suggestedInventoryCategoryId : undefined;
      let conf = parseFloat(l.confidence) || 0.7;

      // Integra con regole utente se la confidenza è bassa
      if (conf < 0.7 || !accId) {
        const rule = classifyProduct(l.originalText || l.normalizedName, db.classificationRules);
        if (rule.accountingCategoryId) accId = rule.accountingCategoryId;
        if (rule.inventoryCategoryId) invId = rule.inventoryCategoryId;
        conf = Math.max(conf, rule.confidence);
      }

      return {
        originalText: l.originalText ?? '',
        normalizedName: l.normalizedName ?? l.originalText ?? '',
        quantity: parseFloat(l.quantity) || 1,
        unit: l.unit ?? 'pz',
        unitPrice: parseFloat(l.unitPrice) || 0,
        totalPrice: parseFloat(l.totalPrice) || 0,
        suggestedAccountingCategoryId: accId,
        suggestedInventoryCategoryId: invId,
        confidence: conf,
        status: (accId && conf >= 0.6) ? 'ai_classified' : 'unresolved',
      } as ParsedLine;
    });

    return {
      supplierName: parsed.supplierName ?? 'Fornitore sconosciuto',
      invoiceNumber: parsed.invoiceNumber ?? `FT-${Date.now()}`,
      date: parsed.date ?? new Date().toISOString().split('T')[0],
      totalAmount: parseFloat(parsed.totalAmount) || 0,
      vatAmount: parseFloat(parsed.vatAmount) || 0,
      netAmount: parseFloat(parsed.netAmount) || 0,
      lines,
      confidence: parseFloat(parsed.confidence) || 0.8,
    };
  } catch (err) {
    console.error('[ai-parser] Errore GPT:', err);
    return null;
  }
}

// ─── Parser mock (fallback) ────────────────────────────────────────────────

function mockParseInvoice(fileName: string, db: AppData): ParsedInvoiceData {
  const rules = db.classificationRules;
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
    const cl = classifyProduct(raw.text, rules);
    return {
      originalText: raw.text,
      normalizedName: raw.text.charAt(0).toUpperCase() + raw.text.slice(1).toLowerCase(),
      quantity: raw.qty,
      unit: raw.unit,
      unitPrice: raw.price,
      totalPrice: parseFloat(total.toFixed(2)),
      suggestedAccountingCategoryId: cl.accountingCategoryId,
      suggestedInventoryCategoryId: cl.inventoryCategoryId,
      confidence: cl.confidence,
      status: cl.status,
    };
  });

  const net = lines.reduce((s, l) => s + l.totalPrice, 0);
  const vat = parseFloat((net * 0.22).toFixed(2));

  return {
    supplierName: 'Metro Cash&Carry (DEMO)',
    invoiceNumber: 'FT-DEMO-' + Date.now(),
    date: now.toISOString().split('T')[0],
    totalAmount: parseFloat((net + vat).toFixed(2)),
    vatAmount: vat,
    netAmount: parseFloat(net.toFixed(2)),
    lines,
    confidence: 0.85,
  };
}

// ─── Funzione principale esportata ────────────────────────────────────────

/**
 * Analizza una fattura PDF/immagine con GPT-4o Vision.
 * Se OPENAI_API_KEY non è impostata, usa il mock.
 */
export async function parseInvoiceFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ParsedInvoiceData> {
  const db = readDb();

  // Prova con GPT-4o
  const gptResult = await parseWithGPT(fileBuffer, mimeType, db);
  if (gptResult) {
    console.log(`[ai-parser] GPT-4o ha analizzato "${fileName}" — ${gptResult.lines.length} righe, confidenza ${(gptResult.confidence * 100).toFixed(0)}%`);
    return gptResult;
  }

  // Fallback al mock
  console.log(`[ai-parser] Uso mock per "${fileName}"`);
  return mockParseInvoice(fileName, db);
}

// Mantieni compatibilità con codice esistente
export function mockParseInvoicePdf(fileName: string): ParsedInvoiceData {
  const db = readDb();
  return mockParseInvoice(fileName, db);
}
