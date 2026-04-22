# 🍽️ LocaleManager — Gestione Bar & Ristorante

App gestionale full-stack per la gestione economica e operativa di bar e ristoranti.

## 🚀 Demo rapida

```bash
npm install
npx tsx lib/seed.ts   # carica i dati demo
npm run dev           # avvia su http://localhost:3000
```
**Login demo:** `demo@locale.it` / `demo123`

---

## 🗂️ Struttura del progetto

```
locale-manager/
│
├── app/                          ← Tutto il codice Next.js App Router
│   ├── (app)/                    ← Pagine protette (richiedono login)
│   │   ├── layout.tsx            ← Layout con sidebar + header
│   │   ├── dashboard/page.tsx    ← Dashboard KPI + grafici
│   │   ├── fatture/              ← Upload e gestione fatture
│   │   │   ├── page.tsx          ← Lista fatture
│   │   │   └── [id]/page.tsx     ← Dettaglio fattura + righe
│   │   ├── spese/page.tsx        ← Spese manuali CRUD
│   │   ├── classificazione/      ← Prodotti da classificare
│   │   ├── inventario/           ← Stock prodotti
│   │   ├── vendite/page.tsx      ← Import Excel Cassa in Cloud
│   │   ├── personale/page.tsx    ← Dipendenti + ore
│   │   ├── report/page.tsx       ← Report mensile
│   │   ├── regole/page.tsx       ← Regole AI classificazione
│   │   ├── fornitori/page.tsx    ← CRUD fornitori
│   │   ├── categorie/page.tsx    ← Categorie contabili/inventario
│   │   └── impostazioni/page.tsx ← Impostazioni account
│   │
│   ├── api/                      ← API Routes (backend)
│   │   ├── auth/login/route.ts   ← POST /api/auth/login
│   │   ├── auth/logout/route.ts  ← POST /api/auth/logout
│   │   ├── dashboard/route.ts    ← GET calcola KPI mese
│   │   ├── fatture/route.ts      ← GET lista / POST upload+AI
│   │   ├── fatture/[id]/route.ts ← GET/PATCH/DELETE fattura
│   │   ├── fatture/[id]/righe/   ← PATCH modifica riga prodotto
│   │   ├── spese/route.ts        ← GET/POST spese manuali
│   │   ├── inventario/route.ts   ← GET/POST prodotti
│   │   ├── personale/route.ts    ← GET/POST dipendenti
│   │   ├── personale/ore/route.ts← POST/DELETE ore lavorate
│   │   ├── vendite/route.ts      ← GET importazioni
│   │   ├── vendite/import/route.ts← POST import Excel
│   │   ├── report/route.ts       ← GET report mensile
│   │   ├── regole/route.ts       ← GET/POST regole AI
│   │   ├── classificazione/route.ts← GET/POST prodotti da verificare
│   │   ├── fornitori/route.ts    ← GET/POST fornitori
│   │   └── categorie/route.ts    ← GET/POST categorie
│   │
│   ├── login/page.tsx            ← Pagina di login
│   ├── layout.tsx                ← Root layout HTML
│   └── page.tsx                  ← Redirect automatico
│
├── components/
│   └── layout/
│       ├── Sidebar.tsx           ← Menu laterale navigazione
│       └── Header.tsx            ← Barra superiore + logout
│
├── lib/                          ← Librerie e logica core
│   ├── types.ts                  ← Tutti i tipi TypeScript
│   ├── db.ts                     ← Lettura/scrittura database JSON
│   ├── seed.ts                   ← Dati demo (rigenera con tsx lib/seed.ts)
│   ├── auth.ts                   ← JWT tokens + sessione
│   ├── ai-parser.ts              ← Mock AI per parsing fatture ← INTEGRARE QUI
│   ├── excel-parser.ts           ← Parser Excel Cassa in Cloud
│   └── utils.ts                  ← formatCurrency, formatDate, cn(), ecc.
│
├── data/                         ← DATABASE (file JSON locale)
│   └── db.json                   ← Tutti i dati dell'app ← NON committare
│
├── .env.local                    ← Variabili d'ambiente locali
└── tailwind.config.ts            ← Configurazione CSS
```

---

## 🧠 Come funziona — Guida per modifiche con AI

### 1. Aggiungere una nuova pagina

1. Crea `app/(app)/nuova-pagina/page.tsx`
2. Aggiungi il link in `components/layout/Sidebar.tsx` (array `navGroups`)
3. Se serve un'API, crea `app/api/nuova-pagina/route.ts`

**Esempio prompt AI:**
> "Aggiungi una pagina Prenotazioni in app/(app)/prenotazioni/page.tsx con una tabella CRUD. Usa lo stesso stile delle altre pagine (card, table, btn-primary). Aggiungi il link nella sidebar."

---

### 2. Modificare il database (aggiungere un campo)

1. Aggiungi il campo in `lib/types.ts` nell'interfaccia giusta
2. Aggiornalo in `lib/seed.ts` nei dati demo
3. Usalo nelle API routes e nelle pagine

**Esempio prompt AI:**
> "In lib/types.ts aggiungi il campo 'iva' (number) all'interfaccia ManualExpense. Aggiorna la pagina spese/page.tsx per mostrarlo nel form e nella tabella."

---

### 3. Modificare le categorie predefinite

File: `lib/seed.ts` → array `accountingCategories` e `inventoryCategories`

Poi riesegui: `npx tsx lib/seed.ts`

---

### 4. Integrare AI reale per il parsing fatture

File: `lib/ai-parser.ts` → funzione `mockParseInvoicePdf()`

**Esempio prompt AI:**
> "In lib/ai-parser.ts, sostituisci la funzione mockParseInvoicePdf() con una chiamata reale all'API Anthropic usando claude-sonnet-4-5 vision. Usa la variabile d'ambiente ANTHROPIC_API_KEY."

---

### 5. Cambiare lo stile di un componente

Tutti i componenti usano **Tailwind CSS**. Le classi riutilizzabili sono in `app/globals.css`:
- `.btn-primary` → bottone blu
- `.btn-secondary` → bottone bianco
- `.card` → box bianco con bordo
- `.input` → campo di testo
- `.badge` → etichetta colorata
- `.table` → tabella

**Esempio prompt AI:**
> "Nella pagina inventario/page.tsx, aggiungi una colonna 'Stock minimo' e colora in rosso le righe dove lo stock è sotto il minimo."

---

### 6. Come funziona l'autenticazione

- Login → `POST /api/auth/login` → salva un cookie JWT httpOnly
- Ogni pagina nel gruppo `(app)` controlla il cookie tramite `app/(app)/layout.tsx`
- Se non loggato → redirect automatico a `/login`
- Il token dura 7 giorni

---

### 7. Il database JSON

Tutti i dati sono in `data/db.json`. Funzioni principali in `lib/db.ts`:
```typescript
readDb()          // legge tutto il database
writeDb(data)     // sovrascrive tutto
updateDb(fn)      // modifica atomica: updateDb(d => ({ ...d, products: [...] }))
```

**Per produzione**: sostituire con PostgreSQL (Supabase o Railway). La struttura delle API non cambia, solo `lib/db.ts`.

---

## 🌐 Deploy in produzione

### Opzione A — Railway (raccomandato, tutto-in-uno)
> Railway supporta Node.js con storage persistente — nessuna migrazione del DB necessaria.

1. Crea account su [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Aggiungi variabile: `JWT_SECRET=una-stringa-segreta-lunga`
4. Aggiungi volume: `/app/data` (per il database JSON)
5. Deploy automatico ad ogni push su `main`

### Opzione B — Vercel + Railway PostgreSQL
> Per scalabilità maggiore, migra il DB a PostgreSQL.

1. Deploy app su Vercel (supporto nativo Next.js)
2. Crea DB PostgreSQL su Railway
3. Sostituisci `lib/db.ts` con query PostgreSQL tramite `@vercel/postgres`

---

## 🔧 Variabili d'ambiente

| Variabile | Descrizione | Obbligatoria |
|-----------|-------------|--------------|
| `JWT_SECRET` | Chiave segreta per i token di sessione | ✅ Sì |
| `ANTHROPIC_API_KEY` | Per il parsing AI reale delle fatture | ❌ Opzionale |
| `NEXT_PUBLIC_APP_NAME` | Nome dell'app nell'UI | ❌ Opzionale |

---

## 🛠️ Comandi utili

```bash
npm run dev          # Sviluppo locale → http://localhost:3000
npm run build        # Build di produzione
npm start            # Avvia build di produzione
npx tsx lib/seed.ts  # Rigenera dati demo (ATTENZIONE: sovrascrive db.json)
```
