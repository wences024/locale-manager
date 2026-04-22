import fs from 'fs';
import path from 'path';
import type { AppData } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readDb(): AppData {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const empty: AppData = {
      users: [],
      suppliers: [],
      invoices: [],
      invoiceLines: [],
      products: [],
      inventoryMovements: [],
      manualExpenses: [],
      salesImports: [],
      salesLines: [],
      staffMembers: [],
      staffHours: [],
      accountingCategories: [],
      inventoryCategories: [],
      classificationRules: [],
      unresolvedProducts: [],
      salesMappingRules: [],
    };
    writeDb(empty);
    return empty;
  }
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(raw) as AppData;
}

export function writeDb(data: AppData): void {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function updateDb(updater: (data: AppData) => AppData): AppData {
  const data = readDb();
  const updated = updater(data);
  writeDb(updated);
  return updated;
}
