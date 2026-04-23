/**
 * Seed di produzione — crea solo le categorie di base.
 * Non crea utenti né dati demo.
 * L'utente amministratore viene creato alla prima visita tramite /setup.
 */

import { writeDb, readDb } from './db';
import type { AppData } from './types';

const existing = readDb();

// Non sovrascrivere se esiste già il database
if (existing.users.length > 0) {
  console.log('✅ Database già esistente — nessuna modifica.');
  process.exit(0);
}

const base: AppData = {
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
  accountingCategories: [
    { id: 'ac-food',      name: 'Alimentari',     type: 'cost',    color: '#f59e0b', icon: '🍕' },
    { id: 'ac-beer',      name: 'Birra',           type: 'cost',    color: '#d97706', icon: '🍺' },
    { id: 'ac-drinks',    name: 'Bevande',         type: 'cost',    color: '#3b82f6', icon: '🥤' },
    { id: 'ac-cleaning',  name: 'Pulizia',         type: 'cost',    color: '#10b981', icon: '🧹' },
    { id: 'ac-packaging', name: 'Packaging',       type: 'cost',    color: '#8b5cf6', icon: '📦' },
    { id: 'ac-staff',     name: 'Personale',       type: 'cost',    color: '#ec4899', icon: '👥' },
    { id: 'ac-utilities', name: 'Utenze',          type: 'cost',    color: '#6b7280', icon: '💡' },
    { id: 'ac-rent',      name: 'Affitto',         type: 'cost',    color: '#374151', icon: '🏠' },
    { id: 'ac-other',     name: 'Altro costo',     type: 'cost',    color: '#9ca3af', icon: '📋' },
    { id: 'ac-bar',       name: 'Vendite bar',     type: 'revenue', color: '#22c55e', icon: '☕' },
    { id: 'ac-food-rev',  name: 'Vendite cucina',  type: 'revenue', color: '#16a34a', icon: '🍽️' },
    { id: 'ac-events',    name: 'Eventi',          type: 'revenue', color: '#15803d', icon: '🎉' },
    { id: 'ac-other-rev', name: 'Altri ricavi',    type: 'revenue', color: '#86efac', icon: '💰' },
  ],
  inventoryCategories: [
    { id: 'ic-cucina',      name: 'Cucina',        color: '#f59e0b' },
    { id: 'ic-bevande',     name: 'Bevande',       color: '#3b82f6' },
    { id: 'ic-birra-spina', name: 'Birra spina',   color: '#d97706' },
    { id: 'ic-soft-drink',  name: 'Soft drink',    color: '#06b6d4' },
    { id: 'ic-alcolici',    name: 'Alcolici',      color: '#7c3aed' },
    { id: 'ic-vino',        name: 'Vino',          color: '#9f1239' },
    { id: 'ic-acqua',       name: 'Acqua',         color: '#bfdbfe' },
    { id: 'ic-pulizia',     name: 'Pulizia',       color: '#10b981' },
    { id: 'ic-consumabili', name: 'Consumabili',   color: '#6b7280' },
    { id: 'ic-packaging',   name: 'Packaging',     color: '#8b5cf6' },
  ],
  classificationRules: [],
  unresolvedProducts: [],
  salesMappingRules: [],
};

writeDb(base);
console.log('✅ Database inizializzato con categorie di base.');
console.log('👉 Visita /setup per creare il tuo account amministratore.');
