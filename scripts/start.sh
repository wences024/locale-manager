#!/bin/bash
# Script di avvio per Railway/produzione

# 1. Copia file statici nel bundle standalone (Next.js non lo fa automaticamente)
echo "📂 Copio file statici nel bundle standalone..."
cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
cp -r public .next/standalone/public 2>/dev/null || true

# 2. Il server standalone fa process.chdir(__dirname) → cwd diventa .next/standalone/
#    Quindi il database deve stare in .next/standalone/data/db.json
mkdir -p .next/standalone/data

if [ ! -f ".next/standalone/data/db.json" ]; then
  echo "📦 Database non trovato, inizializzazione categorie di base..."
  npx tsx lib/seed.ts
  # Copia nella posizione corretta per il server standalone
  if [ -f "data/db.json" ]; then
    cp data/db.json .next/standalone/data/db.json
    echo "📁 Database copiato in .next/standalone/data/"
  fi
fi

echo "🚀 Avvio del server..."
HOSTNAME=0.0.0.0 node .next/standalone/server.js
