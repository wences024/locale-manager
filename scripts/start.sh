#!/bin/bash
# Script di avvio per Railway/produzione

# 1. Copia file statici nel bundle standalone (Next.js non lo fa automaticamente)
echo "📂 Copio file statici nel bundle standalone..."
cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
cp -r public .next/standalone/public 2>/dev/null || true

# 2. Crea cartella data se non esiste
mkdir -p data

# 3. Seed database demo se non esiste ancora
if [ ! -f "data/db.json" ]; then
  echo "📦 Database non trovato, inizializzazione dati demo..."
  npx tsx lib/seed.ts
fi

echo "🚀 Avvio del server..."
node .next/standalone/server.js
