'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Upload, Plus, Search, Filter, Eye, Trash2, RefreshCw, FileText, Image } from 'lucide-react';
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS, cn } from '@/lib/utils';

interface Invoice {
  id: string;
  supplierName: string;
  invoiceNumber: string;
  date: string;
  totalAmount: number;
  status: string;
  fileName?: string;
  fileType?: string;
  parsingConfidence?: number;
}

export default function FatturePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchInvoices = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/fatture?${params}`)
      .then((r) => r.json())
      .then((d) => setInvoices(d.invoices))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInvoices(); }, [search, statusFilter]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    setSuccess('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/fatture', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Fattura caricata con ${data.lines?.length || 0} righe estratte. ${data.unresolved?.length || 0} prodotti da verificare.`);
        fetchInvoices();
      } else {
        setError(data.error || 'Errore nel caricamento');
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questa fattura?')) return;
    await fetch(`/api/fatture/${id}`, { method: 'DELETE' });
    fetchInvoices();
  }

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="page-header flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Fatture acquisti</h1>
          <p className="page-subtitle">Carica e gestisci le fatture dei fornitori</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-primary"
            disabled={uploading}
          >
            {uploading ? (
              <><RefreshCw size={16} className="animate-spin" /> Elaborazione...</>
            ) : (
              <><Upload size={16} /> Carica fattura</>
            )}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {/* Upload area */}
      <div
        className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-brand-300 hover:bg-brand-50 transition-all cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={32} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-600 font-medium">Trascina qui una fattura oppure clicca per caricare</p>
        <p className="text-gray-400 text-sm mt-1">Supporta PDF, JPG, PNG — L'AI estrae automaticamente tutte le righe prodotto</p>
      </div>

      {/* Filtri */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca fornitore o numero fattura..."
            className="input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tutti gli stati</option>
          <option value="parsed">Estratto</option>
          <option value="reviewed">In revisione</option>
          <option value="confirmed">Confermato</option>
          <option value="error">Errore</option>
        </select>
      </div>

      {/* Tabella */}
      <div className="table-container">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="animate-spin text-brand-600" size={24} />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nessuna fattura trovata</p>
            <p className="text-sm">Carica la prima fattura usando il pulsante qui sopra</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Fornitore</th>
                <th>N. Fattura</th>
                <th>Data</th>
                <th>Totale</th>
                <th>File</th>
                <th>Stato</th>
                <th>Confidenza AI</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-medium text-gray-900">{inv.supplierName}</td>
                  <td className="font-mono text-sm text-gray-600">{inv.invoiceNumber}</td>
                  <td className="text-gray-600">{formatDate(inv.date)}</td>
                  <td className="font-semibold">{formatCurrency(inv.totalAmount)}</td>
                  <td>
                    {inv.fileName && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        {inv.fileType === 'pdf' ? <FileText size={12} /> : <Image size={12} />}
                        {inv.fileName.slice(0, 20)}
                        {inv.fileName.length > 20 ? '...' : ''}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={cn('badge', STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-600')}>
                      {STATUS_LABELS[inv.status] || inv.status}
                    </span>
                  </td>
                  <td>
                    {inv.parsingConfidence !== undefined && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{ width: `${inv.parsingConfidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {(inv.parsingConfidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link href={`/fatture/${inv.id}`} className="btn-ghost btn-sm">
                        <Eye size={14} />
                        Dettaglio
                      </Link>
                      <button
                        onClick={() => handleDelete(inv.id)}
                        className="btn-ghost btn-sm text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
