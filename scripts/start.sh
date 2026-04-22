#!/bin/bash
# Script di avvio per Railway/produzione
# Esegue il seed se il database non esiste ancora

if [ ! -f "data/db.json" ]; then
  echo "📦 Database non trovato, inizializzazione dati demo..."
  npx tsx lib/seed.ts
fi

echo "🚀 Avvio del server..."
node .next/standalone/server.js
