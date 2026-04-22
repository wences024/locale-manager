import { writeDb } from './db';
import type { AppData } from './types';
import { v4 as uuidv4 } from 'uuid';

// Demo password: "demo123" (in production use bcrypt)
const DEMO_USER_ID = 'user-demo-001';

// Date dinamiche basate sul mese corrente
const now = new Date();
const CY = now.getFullYear();
const CM = String(now.getMonth() + 1).padStart(2, '0');
const PM = String(now.getMonth()).padStart(2, '0') || '12';
const PY = now.getMonth() === 0 ? CY - 1 : CY;
const D = (day: number, offsetMonths = 0) => {
  const m = now.getMonth() + 1 - offsetMonths;
  const y = m <= 0 ? CY - 1 : CY;
  const mm = String(((m - 1 + 12) % 12) + 1).padStart(2, '0');
  return `${y}-${mm}-${String(day).padStart(2, '0')}`;
};
const SUPPLIER_METRO_ID = 'sup-001';
const SUPPLIER_COCA_ID = 'sup-002';
const SUPPLIER_ESSELUNGA_ID = 'sup-003';
const SUPPLIER_BIRRA_ID = 'sup-004';

const ACC_CAT: Record<string, string> = {
  food: 'ac-food',
  beer: 'ac-beer',
  drinks: 'ac-drinks',
  other_rev: 'ac-other-rev',
  staff: 'ac-staff',
  rent: 'ac-rent',
  utilities: 'ac-utilities',
  cleaning: 'ac-cleaning',
  packaging: 'ac-packaging',
  consulting: 'ac-consulting',
  software: 'ac-software',
  maintenance: 'ac-maintenance',
  other_cost: 'ac-other-cost',
};

const INV_CAT: Record<string, string> = {
  cucina: 'ic-cucina',
  bevande: 'ic-bevande',
  birra_spina: 'ic-birra-spina',
  vino: 'ic-vino',
  alcolici: 'ic-alcolici',
  soft_drink: 'ic-soft-drink',
  acqua: 'ic-acqua',
  pulizia: 'ic-pulizia',
  consumabili: 'ic-consumabili',
  packaging: 'ic-packaging',
  non_inv: 'ic-non-inv',
};

const data: AppData = {
  users: [
    {
      id: DEMO_USER_ID,
      email: 'demo@locale.it',
      password: 'demo123',
      name: 'Marco Rossi',
      businessName: 'Bar Centrale',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ],

  accountingCategories: [
    { id: ACC_CAT.food, name: 'Food', type: 'revenue', color: '#10b981', icon: '🍕' },
    { id: ACC_CAT.beer, name: 'Beer', type: 'revenue', color: '#f59e0b', icon: '🍺' },
    { id: ACC_CAT.drinks, name: 'Drinks', type: 'revenue', color: '#8b5cf6', icon: '🍹' },
    { id: ACC_CAT.other_rev, name: 'Altri ricavi', type: 'revenue', color: '#06b6d4', icon: '💰' },
    { id: ACC_CAT.staff, name: 'Personale', type: 'cost', color: '#ef4444', icon: '👥' },
    { id: ACC_CAT.rent, name: 'Affitto e spese', type: 'cost', color: '#6366f1', icon: '🏠' },
    { id: ACC_CAT.utilities, name: 'Utenze', type: 'cost', color: '#ec4899', icon: '⚡' },
    { id: ACC_CAT.cleaning, name: 'Pulizia', type: 'cost', color: '#14b8a6', icon: '🧹' },
    { id: ACC_CAT.packaging, name: 'Packaging', type: 'cost', color: '#f97316', icon: '📦' },
    { id: ACC_CAT.consulting, name: 'Consulenze', type: 'cost', color: '#84cc16', icon: '💼' },
    { id: ACC_CAT.software, name: 'Software / Abbonamenti', type: 'cost', color: '#a855f7', icon: '💻' },
    { id: ACC_CAT.maintenance, name: 'Manutenzione', type: 'cost', color: '#78716c', icon: '🔧' },
    { id: ACC_CAT.other_cost, name: 'Altro (costi)', type: 'cost', color: '#94a3b8', icon: '📋' },
  ],

  inventoryCategories: [
    { id: INV_CAT.cucina, name: 'Materie prime cucina', color: '#10b981' },
    { id: INV_CAT.bevande, name: 'Bevande', color: '#06b6d4' },
    { id: INV_CAT.birra_spina, name: 'Birra alla spina', color: '#f59e0b' },
    { id: INV_CAT.vino, name: 'Vino', color: '#7c3aed' },
    { id: INV_CAT.alcolici, name: 'Alcolici', color: '#dc2626' },
    { id: INV_CAT.soft_drink, name: 'Soft drink', color: '#0ea5e9' },
    { id: INV_CAT.acqua, name: 'Acqua', color: '#38bdf8' },
    { id: INV_CAT.pulizia, name: 'Pulizia', color: '#14b8a6' },
    { id: INV_CAT.consumabili, name: 'Consumabili', color: '#fb923c' },
    { id: INV_CAT.packaging, name: 'Packaging', color: '#f97316' },
    { id: INV_CAT.non_inv, name: 'Non inventariabile', color: '#94a3b8' },
  ],

  suppliers: [
    { id: SUPPLIER_METRO_ID, name: 'Metro Cash&Carry', vatNumber: '01768440272', address: 'Via Mecenate 84, Milano', phone: '02123456', email: 'ordini@metro.it', createdAt: '2024-01-05T00:00:00.000Z' },
    { id: SUPPLIER_COCA_ID, name: 'Coca-Cola HBC Italia', vatNumber: '01139450124', address: 'Via XXV Aprile 8, Sesto San Giovanni', phone: '0224401', email: 'ordini@cchbc.it', createdAt: '2024-01-05T00:00:00.000Z' },
    { id: SUPPLIER_ESSELUNGA_ID, name: 'Esselunga', vatNumber: '00786480302', address: 'Via Vittor Pisani 20, Milano', phone: '02777251', email: '', createdAt: '2024-01-05T00:00:00.000Z' },
    { id: SUPPLIER_BIRRA_ID, name: 'Birrificio Artigianale Nord', vatNumber: '03421870962', address: 'Via Industria 12, Bergamo', phone: '035123456', email: 'ordini@birranord.it', createdAt: '2024-01-05T00:00:00.000Z' },
  ],

  classificationRules: [
    { id: uuidv4(), name: 'Fusto birra → Beer', conditionType: 'contains', conditionField: 'product_name', conditionValue: 'fusto', accountingCategoryId: ACC_CAT.beer, inventoryCategoryId: INV_CAT.birra_spina, priority: 10, active: true, createdAt: '2024-01-10T00:00:00.000Z', matchCount: 12 },
    { id: uuidv4(), name: 'Mozzarella → Food', conditionType: 'contains', conditionField: 'product_name', conditionValue: 'mozzarella', accountingCategoryId: ACC_CAT.food, inventoryCategoryId: INV_CAT.cucina, priority: 10, active: true, createdAt: '2024-01-10T00:00:00.000Z', matchCount: 8 },
    { id: uuidv4(), name: 'Coca Cola → Drinks', conditionType: 'contains', conditionField: 'product_name', conditionValue: 'coca cola', accountingCategoryId: ACC_CAT.drinks, inventoryCategoryId: INV_CAT.soft_drink, priority: 10, active: true, createdAt: '2024-01-10T00:00:00.000Z', matchCount: 15 },
    { id: uuidv4(), name: 'Candeggina → Pulizia', conditionType: 'contains', conditionField: 'product_name', conditionValue: 'candeggina', accountingCategoryId: ACC_CAT.cleaning, inventoryCategoryId: INV_CAT.pulizia, priority: 10, active: true, createdAt: '2024-01-10T00:00:00.000Z', matchCount: 3 },
    { id: uuidv4(), name: 'Acqua naturale → Drinks', conditionType: 'contains', conditionField: 'product_name', conditionValue: 'acqua naturale', accountingCategoryId: ACC_CAT.drinks, inventoryCategoryId: INV_CAT.acqua, priority: 10, active: true, createdAt: '2024-01-10T00:00:00.000Z', matchCount: 20 },
    { id: uuidv4(), name: 'Detergente → Pulizia', conditionType: 'contains', conditionField: 'product_name', conditionValue: 'detergente', accountingCategoryId: ACC_CAT.cleaning, inventoryCategoryId: INV_CAT.pulizia, priority: 10, active: true, createdAt: '2024-01-10T00:00:00.000Z', matchCount: 6 },
  ],

  salesMappingRules: [
    { id: uuidv4(), originalDepartment: 'CUCINA', accountingCategoryId: ACC_CAT.food, createdAt: '2024-01-10T00:00:00.000Z' },
    { id: uuidv4(), originalDepartment: 'BIRRA', accountingCategoryId: ACC_CAT.beer, createdAt: '2024-01-10T00:00:00.000Z' },
    { id: uuidv4(), originalDepartment: 'BEVANDE', accountingCategoryId: ACC_CAT.drinks, createdAt: '2024-01-10T00:00:00.000Z' },
    { id: uuidv4(), originalDepartment: 'COCKTAIL', accountingCategoryId: ACC_CAT.drinks, createdAt: '2024-01-10T00:00:00.000Z' },
    { id: uuidv4(), originalDepartment: 'DOLCI', accountingCategoryId: ACC_CAT.food, createdAt: '2024-01-10T00:00:00.000Z' },
  ],

  products: [
    { id: 'prod-001', name: 'Coca Cola 33cl', normalizedName: 'coca cola 33cl', accountingCategoryId: ACC_CAT.drinks, inventoryCategoryId: INV_CAT.soft_drink, unit: 'pz', defaultSupplierId: SUPPLIER_COCA_ID, averageCost: 0.72, lastCost: 0.72, sku: 'CC-33', active: true, stockQuantity: 240, createdAt: '2024-01-15T00:00:00.000Z' },
    { id: 'prod-002', name: 'Fusto Lager 20L', normalizedName: 'fusto lager 20l', accountingCategoryId: ACC_CAT.beer, inventoryCategoryId: INV_CAT.birra_spina, unit: 'fusto', defaultSupplierId: SUPPLIER_BIRRA_ID, averageCost: 48.00, lastCost: 50.00, sku: 'FL-20', active: true, stockQuantity: 4, createdAt: '2024-01-15T00:00:00.000Z' },
    { id: 'prod-003', name: 'Mozzarella fiordilatte 1kg', normalizedName: 'mozzarella fiordilatte 1kg', accountingCategoryId: ACC_CAT.food, inventoryCategoryId: INV_CAT.cucina, unit: 'kg', defaultSupplierId: SUPPLIER_METRO_ID, averageCost: 7.50, lastCost: 7.80, sku: 'MF-1', active: true, stockQuantity: 8, createdAt: '2024-01-15T00:00:00.000Z' },
    { id: 'prod-004', name: 'Detergente piatti 5L', normalizedName: 'detergente piatti 5l', accountingCategoryId: ACC_CAT.cleaning, inventoryCategoryId: INV_CAT.pulizia, unit: 'lt', defaultSupplierId: SUPPLIER_METRO_ID, averageCost: 8.90, lastCost: 9.20, sku: 'DP-5', active: true, stockQuantity: 3, createdAt: '2024-01-15T00:00:00.000Z' },
    { id: 'prod-005', name: 'Acqua naturale 1.5L', normalizedName: 'acqua naturale 1.5l', accountingCategoryId: ACC_CAT.drinks, inventoryCategoryId: INV_CAT.acqua, unit: 'pz', defaultSupplierId: SUPPLIER_ESSELUNGA_ID, averageCost: 0.32, lastCost: 0.32, sku: 'AN-15', active: true, stockQuantity: 96, createdAt: '2024-01-15T00:00:00.000Z' },
    { id: 'prod-006', name: 'Pomodoro pelato 400g', normalizedName: 'pomodoro pelato 400g', accountingCategoryId: ACC_CAT.food, inventoryCategoryId: INV_CAT.cucina, unit: 'pz', defaultSupplierId: SUPPLIER_METRO_ID, averageCost: 0.85, lastCost: 0.85, sku: 'PP-400', active: true, stockQuantity: 48, createdAt: '2024-01-15T00:00:00.000Z' },
    { id: 'prod-007', name: 'Candeggina 1L', normalizedName: 'candeggina 1l', accountingCategoryId: ACC_CAT.cleaning, inventoryCategoryId: INV_CAT.pulizia, unit: 'pz', defaultSupplierId: SUPPLIER_ESSELUNGA_ID, averageCost: 1.20, lastCost: 1.20, sku: 'CA-1', active: true, stockQuantity: 6, createdAt: '2024-01-15T00:00:00.000Z' },
    { id: 'prod-008', name: 'Birra artigianale 33cl', normalizedName: 'birra artigianale 33cl', accountingCategoryId: ACC_CAT.beer, inventoryCategoryId: INV_CAT.bevande, unit: 'pz', defaultSupplierId: SUPPLIER_BIRRA_ID, averageCost: 1.80, lastCost: 1.90, sku: 'BA-33', active: true, stockQuantity: 72, createdAt: '2024-01-15T00:00:00.000Z' },
  ],

  invoices: [
    {
      id: 'inv-001', supplierId: SUPPLIER_METRO_ID, supplierName: 'Metro Cash&Carry',
      invoiceNumber: `FT-${CY}-0892`, date: D(5), totalAmount: 487.60,
      vatAmount: 87.60, netAmount: 400.00, fileName: 'fattura_metro_mese.pdf',
      fileType: 'pdf', status: 'confirmed', parsingConfidence: 0.97,
      notes: '', createdAt: new Date(D(5)).toISOString(),
    },
    {
      id: 'inv-002', supplierId: SUPPLIER_BIRRA_ID, supplierName: 'Birrificio Artigianale Nord',
      invoiceNumber: `FT-${CY}-0341`, date: D(10), totalAmount: 366.00,
      vatAmount: 66.00, netAmount: 300.00, fileName: 'fattura_birra_mese.jpg',
      fileType: 'image', status: 'confirmed', parsingConfidence: 0.89,
      notes: '', createdAt: new Date(D(10)).toISOString(),
    },
    {
      id: 'inv-003', supplierId: SUPPLIER_COCA_ID, supplierName: 'Coca-Cola HBC Italia',
      invoiceNumber: `FT-${CY}-1102`, date: D(15), totalAmount: 244.00,
      vatAmount: 44.00, netAmount: 200.00, fileName: 'fattura_cocacola.pdf',
      fileType: 'pdf', status: 'reviewed', parsingConfidence: 0.95,
      notes: '', createdAt: new Date(D(15)).toISOString(),
    },
    {
      id: 'inv-004', supplierId: SUPPLIER_ESSELUNGA_ID, supplierName: 'Esselunga',
      invoiceNumber: `SC-${CY}-5521`, date: D(18), totalAmount: 124.80,
      vatAmount: 4.80, netAmount: 120.00, fileName: 'scontrino_esselunga.jpg',
      fileType: 'image', status: 'parsed', parsingConfidence: 0.72,
      notes: 'Alcuni prodotti da classificare', createdAt: new Date(D(18)).toISOString(),
    },
  ],

  invoiceLines: [
    // Metro - inv-001
    { id: 'il-001', invoiceId: 'inv-001', originalText: 'MOZZARELLA FIORDILATTE KG 1 X 12', normalizedName: 'Mozzarella fiordilatte 1kg', quantity: 12, unit: 'kg', unitPrice: 7.80, totalPrice: 93.60, accountingCategoryId: ACC_CAT.food, inventoryCategoryId: INV_CAT.cucina, aiSuggestedAccountingCategoryId: ACC_CAT.food, aiSuggestedInventoryCategoryId: INV_CAT.cucina, aiConfidence: 0.97, status: 'user_confirmed', productId: 'prod-003', notes: '' },
    { id: 'il-002', invoiceId: 'inv-001', originalText: 'POMODORO PELATO 400G X 24', normalizedName: 'Pomodoro pelato 400g', quantity: 24, unit: 'pz', unitPrice: 0.85, totalPrice: 20.40, accountingCategoryId: ACC_CAT.food, inventoryCategoryId: INV_CAT.cucina, aiSuggestedAccountingCategoryId: ACC_CAT.food, aiSuggestedInventoryCategoryId: INV_CAT.cucina, aiConfidence: 0.95, status: 'ai_classified', productId: 'prod-006', notes: '' },
    { id: 'il-003', invoiceId: 'inv-001', originalText: 'DETERGENTE PIATTI 5L X 4', normalizedName: 'Detergente piatti 5L', quantity: 4, unit: 'lt', unitPrice: 9.20, totalPrice: 36.80, accountingCategoryId: ACC_CAT.cleaning, inventoryCategoryId: INV_CAT.pulizia, aiSuggestedAccountingCategoryId: ACC_CAT.cleaning, aiSuggestedInventoryCategoryId: INV_CAT.pulizia, aiConfidence: 0.92, status: 'ai_classified', productId: 'prod-004', notes: '' },
    { id: 'il-004', invoiceId: 'inv-001', originalText: 'SACCHI SPAZZATURA 100PZ', normalizedName: 'Sacchi spazzatura 100pz', quantity: 2, unit: 'cf', unitPrice: 8.50, totalPrice: 17.00, accountingCategoryId: ACC_CAT.cleaning, inventoryCategoryId: INV_CAT.consumabili, aiSuggestedAccountingCategoryId: ACC_CAT.cleaning, aiSuggestedInventoryCategoryId: INV_CAT.consumabili, aiConfidence: 0.88, status: 'ai_classified', notes: '' },
    // Birra - inv-002
    { id: 'il-005', invoiceId: 'inv-002', originalText: 'FUSTO LAGER 20L X 3', normalizedName: 'Fusto Lager 20L', quantity: 3, unit: 'fusto', unitPrice: 50.00, totalPrice: 150.00, accountingCategoryId: ACC_CAT.beer, inventoryCategoryId: INV_CAT.birra_spina, aiSuggestedAccountingCategoryId: ACC_CAT.beer, aiSuggestedInventoryCategoryId: INV_CAT.birra_spina, aiConfidence: 0.99, status: 'user_confirmed', productId: 'prod-002', notes: '' },
    { id: 'il-006', invoiceId: 'inv-002', originalText: 'BIRRA ARTIGIANALE 33CL X 24', normalizedName: 'Birra artigianale 33cl', quantity: 24, unit: 'pz', unitPrice: 1.90, totalPrice: 45.60, accountingCategoryId: ACC_CAT.beer, inventoryCategoryId: INV_CAT.bevande, aiSuggestedAccountingCategoryId: ACC_CAT.beer, aiSuggestedInventoryCategoryId: INV_CAT.bevande, aiConfidence: 0.93, status: 'ai_classified', productId: 'prod-008', notes: '' },
    // Coca-Cola - inv-003
    { id: 'il-007', invoiceId: 'inv-003', originalText: 'COCA COLA 33CL X 48', normalizedName: 'Coca Cola 33cl', quantity: 48, unit: 'pz', unitPrice: 0.72, totalPrice: 34.56, accountingCategoryId: ACC_CAT.drinks, inventoryCategoryId: INV_CAT.soft_drink, aiSuggestedAccountingCategoryId: ACC_CAT.drinks, aiSuggestedInventoryCategoryId: INV_CAT.soft_drink, aiConfidence: 0.99, status: 'user_confirmed', productId: 'prod-001', notes: '' },
    { id: 'il-008', invoiceId: 'inv-003', originalText: 'ACQUA NATURALE 1.5L X 36', normalizedName: 'Acqua naturale 1.5L', quantity: 36, unit: 'pz', unitPrice: 0.32, totalPrice: 11.52, accountingCategoryId: ACC_CAT.drinks, inventoryCategoryId: INV_CAT.acqua, aiSuggestedAccountingCategoryId: ACC_CAT.drinks, aiSuggestedInventoryCategoryId: INV_CAT.acqua, aiConfidence: 0.97, status: 'ai_classified', productId: 'prod-005', notes: '' },
    { id: 'il-009', invoiceId: 'inv-003', originalText: 'FANTA ARANCIA 33CL X 24', normalizedName: 'Fanta Arancia 33cl', quantity: 24, unit: 'pz', unitPrice: 0.72, totalPrice: 17.28, accountingCategoryId: ACC_CAT.drinks, inventoryCategoryId: INV_CAT.soft_drink, aiSuggestedAccountingCategoryId: ACC_CAT.drinks, aiSuggestedInventoryCategoryId: INV_CAT.soft_drink, aiConfidence: 0.94, status: 'ai_classified', notes: '' },
    // Esselunga - inv-004 (mixed, some unresolved)
    { id: 'il-010', invoiceId: 'inv-004', originalText: 'CANDEGGINA CLASSICA 1L X 6', normalizedName: 'Candeggina 1L', quantity: 6, unit: 'pz', unitPrice: 1.20, totalPrice: 7.20, accountingCategoryId: ACC_CAT.cleaning, inventoryCategoryId: INV_CAT.pulizia, aiSuggestedAccountingCategoryId: ACC_CAT.cleaning, aiSuggestedInventoryCategoryId: INV_CAT.pulizia, aiConfidence: 0.96, status: 'ai_classified', productId: 'prod-007', notes: '' },
    { id: 'il-011', invoiceId: 'inv-004', originalText: 'CARTA FORNO 30MTX2', normalizedName: 'Carta forno 30mt', quantity: 2, unit: 'rl', unitPrice: 3.50, totalPrice: 7.00, accountingCategoryId: undefined, inventoryCategoryId: undefined, aiSuggestedAccountingCategoryId: ACC_CAT.food, aiSuggestedInventoryCategoryId: INV_CAT.consumabili, aiConfidence: 0.61, status: 'unresolved', notes: '' },
    { id: 'il-012', invoiceId: 'inv-004', originalText: 'GUANTI LATEX M X 100', normalizedName: 'Guanti latex M 100pz', quantity: 1, unit: 'cf', unitPrice: 5.90, totalPrice: 5.90, accountingCategoryId: undefined, inventoryCategoryId: undefined, aiSuggestedAccountingCategoryId: undefined, aiSuggestedInventoryCategoryId: undefined, aiConfidence: 0.40, status: 'unresolved', notes: '' },
  ],

  unresolvedProducts: [
    { id: 'up-001', originalText: 'CARTA FORNO 30MTX2', invoiceId: 'inv-004', invoiceLineId: 'il-011', supplierName: 'Esselunga', suggestedAccountingCategoryId: ACC_CAT.food, suggestedInventoryCategoryId: INV_CAT.consumabili, aiConfidence: 0.61, status: 'pending' },
    { id: 'up-002', originalText: 'GUANTI LATEX M X 100', invoiceId: 'inv-004', invoiceLineId: 'il-012', supplierName: 'Esselunga', suggestedAccountingCategoryId: undefined, suggestedInventoryCategoryId: undefined, aiConfidence: 0.40, status: 'pending' },
  ],

  inventoryMovements: [
    { id: uuidv4(), productId: 'prod-001', invoiceLineId: 'il-007', type: 'load', quantity: 48, unitCost: 0.72, totalCost: 34.56, date: D(15), notes: 'Carico da fattura inv-003' },
    { id: uuidv4(), productId: 'prod-002', invoiceLineId: 'il-005', type: 'load', quantity: 3, unitCost: 50.00, totalCost: 150.00, date: D(10), notes: 'Carico da fattura inv-002' },
    { id: uuidv4(), productId: 'prod-003', invoiceLineId: 'il-001', type: 'load', quantity: 12, unitCost: 7.80, totalCost: 93.60, date: D(5), notes: 'Carico da fattura inv-001' },
    { id: uuidv4(), productId: 'prod-004', invoiceLineId: 'il-003', type: 'load', quantity: 4, unitCost: 9.20, totalCost: 36.80, date: D(5), notes: 'Carico da fattura inv-001' },
    { id: uuidv4(), productId: 'prod-005', invoiceLineId: 'il-008', type: 'load', quantity: 36, unitCost: 0.32, totalCost: 11.52, date: D(15), notes: 'Carico da fattura inv-003' },
  ],

  manualExpenses: [
    { id: 'me-001', date: D(1), amount: 2200.00, description: 'Affitto mensile', supplierId: undefined, supplierName: 'Proprietario immobile', accountingCategoryId: ACC_CAT.rent, paymentMethod: 'bonifico', notes: '', createdAt: new Date(D(1)).toISOString() },
    { id: 'me-002', date: D(5), amount: 380.00, description: 'Bolletta luce', supplierId: undefined, supplierName: 'Enel Energia', accountingCategoryId: ACC_CAT.utilities, paymentMethod: 'addebito_diretto', notes: '', createdAt: new Date(D(5)).toISOString() },
    { id: 'me-003', date: D(5), amount: 120.00, description: 'Bolletta gas', supplierId: undefined, supplierName: 'ENI Gas', accountingCategoryId: ACC_CAT.utilities, paymentMethod: 'addebito_diretto', notes: '', createdAt: new Date(D(5)).toISOString() },
    { id: 'me-004', date: D(10), amount: 89.00, description: 'Abbonamento Cassa in Cloud mensile', supplierId: undefined, supplierName: 'Cassa in Cloud', accountingCategoryId: ACC_CAT.software, paymentMethod: 'carta', notes: '', createdAt: new Date(D(10)).toISOString() },
    { id: 'me-005', date: D(12), amount: 250.00, description: 'Riparazione frigorifero', supplierId: undefined, supplierName: 'Tecnoidraulica Srl', accountingCategoryId: ACC_CAT.maintenance, paymentMethod: 'contanti', notes: 'Sostituzione compressore', createdAt: new Date(D(12)).toISOString() },
    { id: 'me-006', date: D(20), amount: 45.00, description: 'Spese varie supermercato', supplierId: SUPPLIER_ESSELUNGA_ID, supplierName: 'Esselunga', accountingCategoryId: ACC_CAT.food, paymentMethod: 'contanti', notes: '', createdAt: new Date(D(20)).toISOString() },
  ],

  salesImports: [
    {
      id: 'si-001', fileName: `Cassa_Cloud_${PY}_${PM}.xlsx`,
      importDate: new Date(D(2, 1)).toISOString(), periodStart: D(1, 1), periodEnd: D(28, 1),
      status: 'imported', totalRevenue: 18420.00, linesCount: 248,
    },
    {
      id: 'si-002', fileName: `Cassa_Cloud_${CY}_${CM}.xlsx`,
      importDate: new Date(D(1)).toISOString(), periodStart: D(1), periodEnd: D(20),
      status: 'imported', totalRevenue: 21380.00, linesCount: 312,
    },
  ],

  salesLines: [
    { id: uuidv4(), importId: 'si-002', date: D(1), product: 'Pizza Margherita', department: 'CUCINA', quantity: 8, revenue: 880.00, accountingCategoryId: ACC_CAT.food, paymentMethod: 'carta', mappingStatus: 'auto' },
    { id: uuidv4(), importId: 'si-002', date: D(1), product: 'Birra alla spina', department: 'BIRRA', quantity: 35, revenue: 1750.00, accountingCategoryId: ACC_CAT.beer, paymentMethod: 'contanti', mappingStatus: 'auto' },
    { id: uuidv4(), importId: 'si-002', date: D(1), product: 'Coca Cola 33cl', department: 'BEVANDE', quantity: 52, revenue: 1820.00, accountingCategoryId: ACC_CAT.drinks, paymentMethod: 'carta', mappingStatus: 'auto' },
    { id: uuidv4(), importId: 'si-002', date: D(5), product: 'Pasta Carbonara', department: 'CUCINA', quantity: 46, revenue: 3680.00, accountingCategoryId: ACC_CAT.food, paymentMethod: 'carta', mappingStatus: 'auto' },
    { id: uuidv4(), importId: 'si-002', date: D(5), product: 'Spritz Aperol', department: 'COCKTAIL', quantity: 60, revenue: 4800.00, accountingCategoryId: ACC_CAT.drinks, paymentMethod: 'contanti', mappingStatus: 'auto' },
    { id: uuidv4(), importId: 'si-002', date: D(10), product: 'Tiramisu', department: 'DOLCI', quantity: 35, revenue: 1050.00, accountingCategoryId: ACC_CAT.food, paymentMethod: 'carta', mappingStatus: 'auto' },
    { id: uuidv4(), importId: 'si-002', date: D(10), product: 'Fusto IPA 20L', department: 'BIRRA', quantity: 22, revenue: 2640.00, accountingCategoryId: ACC_CAT.beer, paymentMethod: 'contanti', mappingStatus: 'auto' },
    { id: uuidv4(), importId: 'si-002', date: D(15), product: 'Hamburger', department: 'CUCINA', quantity: 49, revenue: 3920.00, accountingCategoryId: ACC_CAT.food, paymentMethod: 'carta', mappingStatus: 'auto' },
    { id: uuidv4(), importId: 'si-002', date: D(15), product: 'Gin Tonic', department: 'COCKTAIL', quantity: 37, revenue: 2590.00, accountingCategoryId: ACC_CAT.drinks, paymentMethod: 'carta', mappingStatus: 'auto' },
    { id: uuidv4(), importId: 'si-002', date: D(20), product: 'Birra alla spina', department: 'BIRRA', quantity: 50, revenue: 2500.00, accountingCategoryId: ACC_CAT.beer, paymentMethod: 'contanti', mappingStatus: 'auto' },
  ],

  staffMembers: [
    { id: 'staff-001', name: 'Luca Bianchi', role: 'Cameriere', hourlyRate: 10.50, extraHourlyRate: 15.75, employmentType: 'dipendente', startDate: '2023-03-01', active: true, notes: '' },
    { id: 'staff-002', name: 'Sara Ferrari', role: 'Cuoca', hourlyRate: 13.00, extraHourlyRate: 19.50, employmentType: 'dipendente', startDate: '2022-09-15', active: true, notes: '' },
    { id: 'staff-003', name: 'Ahmed Hassan', role: 'Aiuto cuoco', hourlyRate: 10.00, extraHourlyRate: 15.00, employmentType: 'dipendente', startDate: '2024-01-10', active: true, notes: '' },
    { id: 'staff-004', name: 'Giulia Moretti', role: 'Barista', hourlyRate: 11.00, extraHourlyRate: 16.50, employmentType: 'dipendente', startDate: '2023-06-01', active: true, notes: '' },
  ],

  staffHours: [
    { id: uuidv4(), staffMemberId: 'staff-001', date: D(1), ordinaryHours: 8, extraHours: 0, totalCost: 84.00, notes: '' },
    { id: uuidv4(), staffMemberId: 'staff-001', date: D(2), ordinaryHours: 8, extraHours: 2, totalCost: 115.50, notes: 'Serata evento' },
    { id: uuidv4(), staffMemberId: 'staff-001', date: D(3), ordinaryHours: 8, extraHours: 0, totalCost: 84.00, notes: '' },
    { id: uuidv4(), staffMemberId: 'staff-001', date: D(4), ordinaryHours: 8, extraHours: 1, totalCost: 99.75, notes: '' },
    { id: uuidv4(), staffMemberId: 'staff-001', date: D(7), ordinaryHours: 8, extraHours: 0, totalCost: 84.00, notes: '' },
    { id: uuidv4(), staffMemberId: 'staff-001', date: D(8), ordinaryHours: 8, extraHours: 0, totalCost: 84.00, notes: '' },
    { id: uuidv4(), staffMemberId: 'staff-002', date: D(1), ordinaryHours: 8, extraHours: 0, totalCost: 104.00, notes: '' },
    { id: uuidv4(), staffMemberId: 'staff-002', date: D(2), ordinaryHours: 8, extraHours: 3, totalCost: 162.50, notes: 'Serata evento' },
    { id: uuidv4(), staffMemberId: 'staff-002', date: D(3), ordinaryHours: 8, extraHours: 0, totalCost: 104.00, notes: '' },
    { id: uuidv4(), staffMemberId: 'staff-002', date: D(4), ordinaryHours: 8, extraHours: 0, totalCost: 104.00, notes: '' },
    { id: uuidv4(), staffMemberId: 'staff-002', date: D(7), ordinaryHours: 8, extraHours: 0, totalCost: 104.00, notes: '' },
    { id: uuidv4(), staffMemberId: 'staff-002', date: D(8), ordinaryHours: 8, extraHours: 1, totalCost: 117.50, notes: '' },
    { id: uuidv4(), staffMemberId: 'staff-003', date: D(1), ordinaryHours: 8, extraHours: 0, totalCost: 80.00, notes: '' },
    { id: uuidv4(), staffMemberId: 'staff-003', date: D(3), ordinaryHours: 8, extraHours: 0, totalCost: 80.00, notes: '' },
    { id: uuidv4(), staffMemberId: 'staff-003', date: D(7), ordinaryHours: 8, extraHours: 0, totalCost: 80.00, notes: '' },
    { id: uuidv4(), staffMemberId: 'staff-004', date: D(1), ordinaryHours: 8, extraHours: 1, totalCost: 104.50, notes: '' },
    { id: uuidv4(), staffMemberId: 'staff-004', date: D(2), ordinaryHours: 8, extraHours: 2, totalCost: 121.00, notes: '' },
    { id: uuidv4(), staffMemberId: 'staff-004', date: D(4), ordinaryHours: 8, extraHours: 0, totalCost: 88.00, notes: '' },
    { id: uuidv4(), staffMemberId: 'staff-004', date: D(7), ordinaryHours: 8, extraHours: 0, totalCost: 88.00, notes: '' },
    { id: uuidv4(), staffMemberId: 'staff-004', date: D(8), ordinaryHours: 8, extraHours: 3, totalCost: 137.50, notes: 'Evento speciale' },
  ],
};

writeDb(data);
console.log('✅ Database demo inizializzato con successo!');
console.log('📧 Email: demo@locale.it');
console.log('🔑 Password: demo123');
