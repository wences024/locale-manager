'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Edit3, Save, X, AlertTriangle, BookmarkPlus, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS, cn } from '@/lib/utils';

interface Category { id: string; name: string; color: string; }
interface InvoiceLine {
  id: string; invoiceId: string; originalText: string; normalizedName: string;
  quantity: number; unit: string; unitPrice: number; totalPrice: number;
  accountingCategoryId?: string; inventoryCategoryId?: string;
  aiSuggestedAccountingCategoryId?: string; aiSuggestedInventoryCategoryId?: string;
  aiConfidence?: number; status: string; notes?: string;
}
interface Invoice {
  id: string; supplierName: string; invoiceNumber: string; date: string;
  totalAmount: number; vatAmount: number; netAmount: number; status: string;
  parsingConfidence?: number;
}

export default function FatturaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [accCats, setAccCats] = useState<Category[]>([]);
  const [invCats, setInvCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLine, setEditingLine] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<InvoiceLine>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/fatture/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setInvoice(d.invoice);
        setLines(d.lines);
        setAccCats(d.accountingCategories);
        setInvCats(d.inventoryCategories);
      })
      .finally(() => setLoading(false));
  }, [id]);

  function startEdit(line: InvoiceLine) {
    setEditingLine(line.id);
    setEditData({
      normalizedName: line.normalizedName,
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.unitPrice,
      totalPrice: line.totalPrice,
      accountingCategoryId: line.accountingCategoryId || line.aiSuggestedAccountingCategoryId,
      inventoryCategoryId: line.inventoryCategoryId || line.aiSuggestedInventoryCategoryId,
      notes: line.notes,
    });
  }

  async function saveEdit(lineId: string, saveRule = false) {
    setSaving(true);
    await fetch(`/api/fatture/${id}/righe`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineId, saveRule, ...editData }),
    });
    // Refresh
    const res = await fetch(`/api/fatture/${id}`);
    const data = await res.json();
    setLines(data.lines);
    setEditingLine(null);
    setSaving(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin text-brand-600" size={32} /></div>;
  if (!invoice) return <div className="alert-error">Fattura non trovata.</div>;

  const getCatName = (id?: string, cats?: Category[]) => id ? (cats || []).find((c) => c.id === id)?.name || '—' : '—';

  const unresolvedCount = lines.filter((l) => l.status === 'unresolved').length;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/fatture" className="btn-ghost btn-sm">
          <ArrowLeft size={16} /> Fatture
        </Link>
        <div className="flex-1">
          <h1 className="page-title">{invoice.supplierName} — {invoice.invoiceNumber}</h1>
          <p className="page-subtitle">{formatDate(invoice.date)}</p>
        </div>
      </div>

      {/* Info fattura */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Imponibile', value: formatCurrency(invoice.netAmount) },
          { label: 'IVA', value: formatCurrency(invoice.vatAmount) },
          { label: 'Totale', value: formatCurrency(invoice.totalAmount), bold: true },
          { label: 'Righe estratte', value: lines.length },
        ].map((item) => (
          <div key={item.label} className="stat-card">
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className={cn('text-xl', item.bold ? 'font-bold text-brand-700' : 'font-semibold text-gray-900')}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {unresolvedCount > 0 && (
        <div className="alert-warning flex items-center gap-2">
          <AlertTriangle size={16} />
          <strong>{unresolvedCount} righe non classificate</strong> — Assegna manualmente la categoria per completare l'analisi.
        </div>
      )}

      {/* Righe prodotto */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="section-title mb-0">Righe prodotto</h2>
          <p className="text-sm text-gray-500">{lines.length} voci</p>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Descrizione originale</th>
                <th>Nome normalizzato</th>
                <th>Qtà</th>
                <th>U.M.</th>
                <th>Prezzo unit.</th>
                <th>Totale</th>
                <th>Cat. Contabile</th>
                <th>Cat. Inventario</th>
                <th>AI %</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const isEditing = editingLine === line.id;
                return (
                  <tr key={line.id} className={line.status === 'unresolved' ? 'bg-red-50' : ''}>
                    <td className="text-xs text-gray-500 font-mono max-w-[180px] truncate" title={line.originalText}>
                      {line.originalText}
                    </td>

                    {isEditing ? (
                      <>
                        <td><input className="input text-xs py-1" value={editData.normalizedName || ''} onChange={(e) => setEditData((p) => ({ ...p, normalizedName: e.target.value }))} /></td>
                        <td><input type="number" className="input text-xs py-1 w-16" value={editData.quantity || ''} onChange={(e) => setEditData((p) => ({ ...p, quantity: parseFloat(e.target.value) }))} /></td>
                        <td><input className="input text-xs py-1 w-16" value={editData.unit || ''} onChange={(e) => setEditData((p) => ({ ...p, unit: e.target.value }))} /></td>
                        <td><input type="number" step="0.01" className="input text-xs py-1 w-20" value={editData.unitPrice || ''} onChange={(e) => setEditData((p) => ({ ...p, unitPrice: parseFloat(e.target.value) }))} /></td>
                        <td><input type="number" step="0.01" className="input text-xs py-1 w-20" value={editData.totalPrice || ''} onChange={(e) => setEditData((p) => ({ ...p, totalPrice: parseFloat(e.target.value) }))} /></td>
                        <td>
                          <select className="input text-xs py-1" value={editData.accountingCategoryId || ''} onChange={(e) => setEditData((p) => ({ ...p, accountingCategoryId: e.target.value })}>
                            <option value="">— Scegli —</option>
                            {accCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </td>
                        <td>
                          <select className="input text-xs py-1" value={editData.inventoryCategoryId || ''} onChange={(e) => setEditData((p) => ({ ...p, inventoryCategoryId: e.target.value })}>
                            <option value="">— Scegli —</option>
                            {invCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </td>
                        <td colSpan={2} />
                        <td>
                          <div className="flex gap-1">
                            <button onClick={() => saveEdit(line.id)} className="btn-primary btn-sm" disabled={saving}>
                              <Save size={12} />
                            </button>
                            <button onClick={() => saveEdit(line.id, true)} className="btn-secondary btn-sm" title="Salva come regola" disabled={saving}>
                              <BookmarkPlus size={12} />
                            </button>
                            <button onClick={() => setEditingLine(null)} className="btn-ghost btn-sm">
                              <X size={12} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="font-medium text-gray-800">{line.normalizedName}</td>
                        <td>{line.quantity}</td>
                        <td className="text-gray-500">{line.unit}</td>
                        <td>{formatCurrency(line.unitPrice)}</td>
                        <td className="font-semibold">{formatCurrency(line.totalPrice)}</td>
                        <td>
                          <span className="text-xs text-gray-700">
                            {getCatName(line.accountingCategoryId || line.aiSuggestedAccountingCategoryId, accCats)}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-gray-700">
                            {getCatName(line.inventoryCategoryId || line.aiSuggestedInventoryCategoryId, invCats)}
                          </span>
                        </td>
                        <td>
                          {line.aiConfidence !== undefined && (
                            <span className={cn('text-xs font-medium', line.aiConfidence > 0.8 ? 'text-green-600' : line.aiConfidence > 0.6 ? 'text-yellow-600' : 'text-red-600')}>
                              {(line.aiConfidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={cn('badge', STATUS_COLORS[line.status] || 'bg-gray-100 text-gray-600')}>
                            {STATUS_LABELS[line.status] || line.status}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => startEdit(line)} className="btn-ghost btn-sm">
                            <Edit3 size={14} /> Modifica
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
