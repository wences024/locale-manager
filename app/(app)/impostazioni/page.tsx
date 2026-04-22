'use client';

import { Settings, Info } from 'lucide-react';

export default function ImpostazioniPage() {
  return (
    <div className="fade-in space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><Settings size={24} /> Impostazioni</h1>
        <p className="page-subtitle">Configurazione dell'account e del sistema</p>
      </div>

      <div className="card p-6 space-y-6">
        <div>
          <h2 className="section-title">Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Nome attività</label>
              <input type="text" className="input" defaultValue="Bar Centrale" />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input type="email" className="input" defaultValue="demo@locale.it" />
            </div>
            <div className="form-group">
              <label className="label">Partita IVA</label>
              <input type="text" className="input" placeholder="IT00000000000" />
            </div>
            <div className="form-group">
              <label className="label">Indirizzo</label>
              <input type="text" className="input" placeholder="Via Roma 1, Milano" />
            </div>
          </div>
          <button className="btn-primary mt-2">Salva modifiche</button>
        </div>

        <div className="border-t pt-6">
          <h2 className="section-title">Integrazione AI</h2>
          <div className="alert-info">
            <div className="flex items-start gap-2">
              <Info size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium mb-1">Parsing fatture AI</p>
                <p className="text-sm">
                  Attualmente il sistema usa un parser mock per dimostrare il funzionamento.
                  Per abilitare il parsing reale, integra una delle seguenti API:
                </p>
                <ul className="text-sm mt-2 list-disc list-inside space-y-1">
                  <li><strong>Claude claude-sonnet-4-6 Vision</strong> — Migliore per fatture in italiano, via Anthropic API</li>
                  <li><strong>GPT-4o Vision</strong> — Alternativa valida, via OpenAI API</li>
                  <li><strong>Google Document AI</strong> — Ottimo per OCR strutturato</li>
                  <li><strong>Azure Form Recognizer</strong> — Per grandi volumi</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="form-group mt-4">
            <label className="label">API Key (opzionale)</label>
            <input type="password" className="input" placeholder="sk-..." />
            <p className="text-xs text-gray-400 mt-1">Lascia vuoto per continuare con il parser demo</p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="section-title">Dati demo</h2>
          <p className="text-sm text-gray-500 mb-3">
            Il database attuale contiene dati demo precaricati. Puoi resettare i dati quando sei pronto per usare l'app in produzione.
          </p>
          <div className="flex gap-3">
            <button className="btn-secondary text-red-600 border-red-200 hover:bg-red-50" onClick={() => alert('Funzione disponibile in produzione')}>
              Reset database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
