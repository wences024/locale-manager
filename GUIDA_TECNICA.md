# Guida Tecnica — LocaleManager

> **Para qué sirve este documento:** Explica cómo está construida la app, dónde está cada cosa y cómo modificarla con ayuda de IA (Claude, ChatGPT, etc.). No hace falta saber programar de memoria — basta con entender la estructura.

---

## 1. Stack tecnológico

| Tecnología | Para qué se usa |
|-----------|----------------|
| **Next.js 14** (App Router) | Framework principal — páginas y API en un solo proyecto |
| **TypeScript** | Lenguaje (JavaScript con tipos, evita errores) |
| **Tailwind CSS** | Estilos — clases de utilidad en el HTML |
| **Recharts** | Gráficos del dashboard |
| **jose** | JWT para autenticación (cookies seguras) |
| **xlsx** | Parseo de archivos Excel (Cassa in Cloud) |
| **JSON file** | Base de datos — archivo `data/db.json` |
| **Railway** | Hosting en producción |

---

## 2. Estructura de carpetas

```
preuba/
├── app/                        ← Páginas y API (Next.js App Router)
│   ├── (app)/                  ← Páginas protegidas (requieren login)
│   │   ├── dashboard/          ← Dashboard con KPIs y gráficos
│   │   ├── fatture/            ← Facturas (lista y detalle)
│   │   ├── fornitori/          ← Proveedores
│   │   ├── inventario/         ← Inventario
│   │   ├── personale/          ← Personal y horas
│   │   ├── spese/              ← Gastos manuales
│   │   ├── vendite/            ← Ventas (importar Excel)
│   │   ├── categorie/          ← Categorías contables y de inventario
│   │   ├── classificazione/    ← Productos sin clasificar
│   │   ├── regole/             ← Reglas de clasificación automática
│   │   ├── report/             ← Reportes mensuales
│   │   ├── impostazioni/       ← Configuraciones
│   │   └── layout.tsx          ← Layout con sidebar (se aplica a todas)
│   ├── api/                    ← Endpoints de la API (backend)
│   │   ├── auth/login/         ← POST /api/auth/login
│   │   ├── auth/logout/        ← POST /api/auth/logout
│   │   ├── dashboard/          ← GET /api/dashboard (KPIs)
│   │   ├── fatture/            ← GET/POST /api/fatture
│   │   ├── fatture/[id]/       ← GET /api/fatture/:id
│   │   ├── fatture/[id]/righe/ ← PATCH /api/fatture/:id/righe
│   │   ├── fornitori/          ← CRUD proveedores
│   │   ├── inventario/         ← CRUD inventario
│   │   ├── personale/          ← CRUD personal
│   │   ├── spese/              ← CRUD gastos
│   │   ├── vendite/            ← GET ventas
│   │   ├── vendite/import/     ← POST importar Excel
│   │   ├── categorie/          ← GET/POST categorías
│   │   ├── classificazione/    ← GET/POST resolver productos
│   │   └── regole/             ← CRUD reglas IA
│   ├── login/                  ← Página de login (pública)
│   ├── page.tsx                ← Redirige a /dashboard
│   ├── layout.tsx              ← Layout raíz (HTML, body)
│   └── globals.css             ← Clases CSS reutilizables
│
├── lib/                        ← Lógica compartida (backend)
│   ├── types.ts                ← Todas las interfaces TypeScript
│   ├── db.ts                   ← Lectura/escritura del JSON database
│   ├── auth.ts                 ← JWT: crear y verificar tokens
│   ├── ai-parser.ts            ← Parser "IA" de facturas (mock)
│   ├── excel-parser.ts         ← Parser de Excel (Cassa in Cloud)
│   ├── seed.ts                 ← Datos demo iniciales
│   └── utils.ts                ← Funciones utilitarias (formatCurrency, etc.)
│
├── components/
│   └── layout/
│       ├── Sidebar.tsx         ← Menú lateral
│       └── Header.tsx          ← Barra superior
│
├── data/
│   └── db.json                 ← BASE DE DATOS (se crea al arrancar)
│
├── scripts/
│   └── start.sh                ← Script de arranque en Railway
│
├── public/                     ← Archivos estáticos (imágenes, etc.)
├── next.config.mjs             ← Config Next.js
├── railway.json                ← Config deploy Railway
├── tailwind.config.ts          ← Config Tailwind (colores, etc.)
└── tsconfig.json               ← Config TypeScript
```

---

## 3. Cómo funciona la base de datos

La app **no usa PostgreSQL ni MySQL**. Usa un simple archivo JSON:

```
.next/standalone/data/db.json   ← en producción (Railway)
data/db.json                    ← en desarrollo local
```

### Leer datos
```typescript
import { readDb } from '@/lib/db';

const db = readDb();
const facturas = db.invoices;          // array de facturas
const usuarios = db.users;             // array de usuarios
```

### Escribir datos
```typescript
import { updateDb } from '@/lib/db';

updateDb((db) => {
  db.invoices.push(nuevaFactura);
  return db;
});
```

### Estructura completa del JSON
```typescript
{
  users: User[]
  suppliers: Supplier[]
  invoices: Invoice[]
  invoiceLines: InvoiceLine[]
  products: Product[]
  inventoryMovements: InventoryMovement[]
  manualExpenses: ManualExpense[]
  salesImports: SalesImport[]
  salesLines: SalesLine[]
  staffMembers: StaffMember[]
  staffHours: StaffHours[]
  accountingCategories: AccountingCategory[]
  inventoryCategories: InventoryCategory[]
  classificationRules: ClassificationRule[]
  unresolvedProducts: UnresolvedProduct[]
  salesMappingRules: SalesMappingRule[]
}
```

> **⚠️ Importante:** Si el servidor Railway se reinicia, el archivo `db.json` se pierde (Railway no tiene disco persistente por defecto). Para un bar/restaurante real, se recomienda migrar a PostgreSQL o agregar un Railway Volume.

---

## 4. Cómo funciona la autenticación

1. El usuario envía email + password a `POST /api/auth/login`
2. La API busca el usuario en `db.users` y compara contraseñas (texto plano)
3. Si coincide, crea un **JWT token** firmado con `lib/auth.ts`
4. El token se guarda en una **cookie httpOnly** llamada `auth_token` (7 días)
5. En cada página protegida, `getSession()` verifica el token

```typescript
// En cualquier API route protegida:
import { getSession } from '@/lib/auth';

const user = await getSession();
if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
```

**Credenciales demo:**
```
Email:    demo@locale.it
Password: demo123
```

**Para cambiar la contraseña:** editar `lib/seed.ts` línea 60 y borrar `data/db.json` para que se regenere.

---

## 5. Cómo funciona el parser de facturas (IA)

El archivo `lib/ai-parser.ts` simula una IA de clasificación. Funciona en 3 pasos:

```
Texto de la factura
      ↓
1. ¿Hay una regla de usuario que coincida?  → usa esa categoría (confianza 98%)
      ↓ no
2. ¿Está en el diccionario interno?          → usa esa categoría (confianza 75-99%)
      ↓ no
3. No reconocido → status "unresolved"      → aparece en /classificazione
```

### Para integrar IA real (Claude o GPT-4o Vision)
En `lib/ai-parser.ts`, función `mockParseInvoicePdf()`, reemplazar el contenido con una llamada real:

```typescript
// Ejemplo con Anthropic Claude:
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();
const response = await client.messages.create({
  model: 'claude-opus-4-5',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
      { type: 'text', text: 'Estrai i prodotti da questa fattura in formato JSON...' }
    ]
  }]
});
```

### Para agregar productos al diccionario
En `lib/ai-parser.ts`, agregar entradas al objeto `KNOWN_PRODUCTS`:
```typescript
'cappuccino': { acc: 'ac-bar', inv: 'ic-bar', conf: 0.97 },
'cornetto':   { acc: 'ac-food', inv: 'ic-cucina', conf: 0.95 },
```

---

## 6. Cómo agregar una nueva página

### Paso 1 — Crear el archivo de página
```
app/(app)/mi-nueva-pagina/page.tsx
```

### Paso 2 — Estructura mínima
```tsx
'use client';

import { useEffect, useState } from 'react';

export default function MiNuevaPagina() {
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    fetch('/api/mi-endpoint')
      .then(r => r.json())
      .then(d => setDatos(d));
  }, []);

  return (
    <div className="fade-in space-y-6">
      <h1 className="page-title">Mi Nueva Página</h1>
      {/* contenido */}
    </div>
  );
}
```

### Paso 3 — Agregar al menú lateral
En `components/layout/Sidebar.tsx`, agregar un item al array `navGroups`:
```typescript
{ label: 'Mi Página', href: '/mi-nueva-pagina', icon: IconName }
```

---

## 7. Cómo agregar una nueva API

Crear el archivo en:
```
app/api/mi-endpoint/route.ts
```

```typescript
import { NextResponse } from 'next/server';
import { readDb, updateDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/mi-endpoint
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const db = readDb();
  return NextResponse.json(db.products);  // devuelve lo que necesites
}

// POST /api/mi-endpoint
export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const body = await req.json();
  
  const updated = updateDb((db) => {
    db.products.push({ id: crypto.randomUUID(), ...body, createdAt: new Date().toISOString() });
    return db;
  });

  return NextResponse.json({ ok: true });
}
```

---

## 8. Clases CSS reutilizables

Definidas en `app/globals.css`. Úsalas directamente en el HTML:

| Clase | Para qué sirve |
|-------|---------------|
| `card` | Contenedor blanco con borde y sombra |
| `btn-primary` | Botón azul principal |
| `btn-secondary` | Botón blanco con borde |
| `btn-danger` | Botón rojo (eliminar) |
| `btn-ghost` | Botón transparente |
| `btn-sm` | Tamaño pequeño (combinar con btn-*) |
| `input` | Campo de texto estilizado |
| `label` | Etiqueta de campo |
| `badge` | Pastilla de estado (pequeña) |
| `table` | Tabla estilizada |
| `fade-in` | Animación de entrada suave |
| `page-title` | Título de página grande |
| `page-subtitle` | Subtítulo gris |
| `section-title` | Título de sección |
| `stat-card` | Card de estadística (KPI) |
| `alert-warning` | Alerta amarilla |
| `alert-info` | Alerta azul |

**Ejemplo:**
```tsx
<div className="card p-5">
  <h2 className="section-title">Título</h2>
  <button className="btn-primary btn-sm">Guardar</button>
  <input className="input" placeholder="Escribe aquí..." />
</div>
```

---

## 9. Colores del tema

Definidos en `tailwind.config.ts` como color `brand`:

```
brand-50  → azul muy claro (fondos)
brand-100 → azul claro
brand-500 → azul medio (focus rings)
brand-600 → azul principal (botones, links activos)
brand-700 → azul oscuro (hover)
brand-900 → azul muy oscuro
```

**Para cambiar el color de toda la app:** editar `tailwind.config.ts`, sección `brand`, y reemplazar los valores hex.

---

## 10. Cómo funciona Railway (deploy)

### Flujo de deploy
```
git push → GitHub → Railway detecta el push → Nixpacks buildea → arranca el servidor
```

### Archivos clave de Railway

**`railway.json`** — configuración del deploy:
```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npm run start:railway"
  }
}
```

**`scripts/start.sh`** — lo que hace al arrancar:
1. Copia archivos estáticos al bundle standalone
2. Si no existe `db.json`, corre el seed (datos demo)
3. Arranca el servidor con `HOSTNAME=0.0.0.0`

**`next.config.mjs`** — `output: 'standalone'` genera un servidor Node.js autocontenido.

### Para hacer un deploy manual
```bash
git add .
git commit -m "descripción del cambio"
git push
```
Railway despliega automáticamente en ~2 minutos.

### Variables de entorno en Railway
Ir a Railway → servicio → **Variables** y agregar:
```
JWT_SECRET = una_clave_secreta_larga_y_aleatoria
```

---

## 11. Cómo modificar con IA (Claude/ChatGPT)

### Prompt base para modificaciones
Copiar y pegar esto antes de pedir un cambio:
```
Estoy modificando una app Next.js 14 con App Router, TypeScript y Tailwind.
La base de datos es un archivo JSON leído con lib/db.ts (funciones readDb y updateDb).
Las páginas están en app/(app)/[seccion]/page.tsx
Las APIs están en app/api/[endpoint]/route.ts
Los tipos están en lib/types.ts

[Aquí tu pregunta o cambio específico]
```

### Ejemplos de pedidos útiles
| Quiero... | Dile a la IA... |
|-----------|----------------|
| Agregar un campo a los proveedores | "Agrega el campo `telefono2: string` a la interfaz Supplier en lib/types.ts y al formulario de proveedores en app/(app)/fornitori/page.tsx" |
| Cambiar los colores | "Cambia el color brand en tailwind.config.ts de azul a verde usando estos valores: [pegar una paleta]" |
| Nueva sección en el menú | "Agrega un item 'Prenotazioni' con ícono Calendar al menú en components/layout/Sidebar.tsx, con href /prenotazioni" |
| Agregar un gráfico | "En app/(app)/report/page.tsx agrega un BarChart de Recharts mostrando los gastos por categoría del último mes" |
| Cambiar la contraseña demo | "Cambia la contraseña del usuario demo en lib/seed.ts a 'mipassword'" |

---

## 12. Datos demo — cómo regenerarlos

Los datos demo se generan automáticamente al arrancar si no existe `db.json`.

**Para regenerar en local:**
```bash
rm data/db.json
npx tsx lib/seed.ts
```

**Para modificar los datos demo:** editar `lib/seed.ts`. Los datos incluyen:
- 1 usuario (demo@locale.it / demo123)
- 4 facturas con líneas de productos
- 8 productos en inventario
- 4 empleados con horas registradas
- 6 gastos manuales
- 2 importaciones de ventas
- 6 reglas de clasificación

---

## 13. Bugs resueltos durante el desarrollo (referencia)

| Bug | Causa | Solución |
|-----|-------|----------|
| Build falla en Railway: JSX syntax | Paréntesis faltante en `onChange` de `<select>` | Agregar `)` extra en `setEditData((p) => ({...}))` |
| Build falla: TypeScript error `type` duplicado | `{ type: 'accounting', ...form }` cuando `form` ya tiene `type` | Poner el override después del spread: `{ ...form, type: 'accounting' }` |
| `Killed` (OOM) en Railway | Build se ejecutaba dos veces — Nixpacks + startCommand | Quitar `npm run build &&` del startCommand |
| "Application failed to respond" | Archivos estáticos ausentes del bundle standalone | Agregar `cp -r .next/static .next/standalone/.next/static` en start.sh |
| 502 Bad Gateway | Servidor escuchaba en `localhost`, no en `0.0.0.0` | Agregar `HOSTNAME=0.0.0.0` al comando de arranque |
| "Credenziali non valide" | El servidor standalone hace `process.chdir()` — lee db de otra ruta | Copiar `db.json` a `.next/standalone/data/` después del seed |

---

## 14. URLs importantes

| Recurso | URL |
|---------|-----|
| App en producción | https://locale-manager-production.up.railway.app |
| Código fuente | https://github.com/wences024/locale-manager |
| Railway dashboard | https://railway.app/dashboard |

**Credenciales de acceso:**
```
Email:    demo@locale.it
Password: demo123
```
