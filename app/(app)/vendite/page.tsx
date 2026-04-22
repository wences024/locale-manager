'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, RefreshCw, CheckCircle, Eye, BarChart3 } from 'lucide-react';
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS, cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface SalesImport {
  id: string; fileName: string; importDate: string; periodStart: string;
  periodEnd: string; status: string; totalRevenue: number; linesCount: number;
}
interface SalesLine {
  id: string; importId: string; date: string; product: string; department: string;
  quantity: number; revenue: number; accountingCategoryId?: string;
  paymentMethod?: string; mappingStatus: string;
}
interface Category { id: string; name: string; color: string; }

export default function VenditePage() {
  const [imports, setImports] = useState<SalesImport[]>([]);
  const [lines, setLines] = useState<SalesLine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImport, setSelectedImport] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<{ importId: string; lines: SalesLine[]; unmapped: string[] } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchData = () => {
    const params = selectedImport ? `?importId=${selectedImport}` : '';
    fetch(`/api/vendite${params}`)
      .then((r) => r.json())
      .then((d) => {
        setImports(d.imports);
        setLines(d.lines);
        setCategories(d.accountingCategories);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [selectedImport]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/vendite/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setPreviewData({ importId: data.importId, lines: data.lines, unmapped: data.unmappedDepartments });
        fetchData();
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

  async function handleConfirmImport() {
    if (!previewData) return;
    setConfirming(true);
    const formData = new FormData();
    formData.append('confirm', 'true');
    formData.append('importId', previewData.importId);
    formData.append('lines', JSON.stringify(previewData.lines));
    await fetch('/api/vendite/import', { method: 'POST', body: formData });
    setPreviewData(null);
    setConfirming(false);
    fetchData();
  }

  const getCatName = (id?: string) => id ? categories.find((c) => c.id === id)?.name || '—' : '—';
  const getCatColor = (id?: string) => id ? categories.find((c) => c.id === id)?.color || '#94a3b8' : '#94a3b8';

  const revenueByCategory = lines.reduce((acc, l) => {
    const catId = l.accountingCategoryId || 'other';
    acc[catId] = (acc[catId] || 0) + l.revenue;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(revenueByCategory).map(([catId, val]) => ({
    name: getCatName(catId),
    value: parseFloat(val.toFixed(2)),
    color: getCatColor(catId),
  }));

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="page-header flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Vendite</h1>
          <p className="page-subtitle">Importa e analizza le vendite da Cassa in Cloud</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleUpload} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="btn-primary" disabled={uploading}>
            {uploading ? <><RefreshCw size={16} className="animate-spin" /> Analisi...</> : <><Upload size={16} /> Importa Excel</>}
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Upload area */}
      {!previewData && (
        <div
          className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-brand-300 hover:bg-brand-50 transition-all cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">Trascina il file Excel di Cassa in Cloud</p>
          <p className="text-gray-400 text-sm mt-1">Formati supportati: .xlsx, .xls</p>
        </div>
      )}

      {/* Preview importazione */}
      {previewData && (
        <div className="card p-5 border-2 border-brand-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0 flex items-center gap-2">
              <Eye size={18} className="text-brand-600" /> Anteprima importazione
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setPreviewData(null)} className="btn-secondary">Annulla</button>
              <button onClick={handleConfirmImport} className="btn-primary" disabled={confirming}>
                {confirming ? <><RefreshCw size={14} className="animate-spin" /> Importazione...</> : <><CheckCircle size={14} /> Conferma importazione</>}
              </button>
            </div>
          </div>

          {previewData.unmapped.length > 0 && (
            <div className="alert-warning mb-4">
              ⚠️ Reparti non mappati (verranno importati come "Non classificato"): <strong>{previewData.unmapped.join(', ')}</strong>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Prodotto</th>
                  <th>Reparto</th>
                  <th>Qtà</th>
                  <th>Incasso</th>
                  <th>Categoria</th>
                </tr>
              </thead>
              <tbody>
                {previewData.lines.slice(0, 20).map((l, i) => (
                  <tr key={i}>
                    <td>{l.date}</td>
                    <td>{l.product}</td>
                    <td><span className="badge bg-gray-100 text-gray-700">{l.department}</span></td>
                    <td>{l.quantity}</td>
                    <td>{formatCurrency(l.revenue)}</td>
                    <td>
                      <span className={cn('badge text-xs', l.mappingStatus === 'unresolved' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                        {l.mappingStatus === 'unresolved' ? '⚠️ Da mappare' : getCatName(l.accountingCategoryId)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.lines.length > 20 && (
              <p className="text-center text-gray-400 text-sm py-2">... e altre {previewData.lines.length - 20} righe</p>
            )}
          </div>
        </div>
      )}

      {/* Lista importazioni */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm">Importazioni</div>
          {imports.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">Nessuna importazione</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {imports.map((imp) => (
                <button
                  key={imp.id}
                  onClick={() => setSelectedImport(selectedImport === imp.id ? null : imp.id)}
                  className={cn('w-full p-4 text-left hover:bg-gray-50 transition-colors', selectedImport === imp.id && 'bg-brand-50')}
                >
                  <p className="font-medium text-sm text-gray-900">{imp.fileName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(imp.periodStart)} → {formatDate(imp.periodEnd)}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={cn('badge text-xs', STATUS_COLORS[imp.status])}>
                      {STATUS_LABELS[imp.status]}
                    </span>
                    <span className="font-semibold text-sm">{formatCurrency(imp.totalRevenue)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grafico ricavi */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="section-title flex items-center gap-2">
            <BarChart3 size={18} /> Ricavi per categoria
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Seleziona un'importazione o importa dati vendite
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {chartData.map((d) => (
              <div key={d.name} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm">{d.name}</span>
                </div>
                <span className="font-semibold text-sm">{formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
