'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, BookmarkPlus, PackagePlus, RefreshCw, ChevronRight } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface UnresolvedItem {
  id: string; originalText: string; invoiceId: string; invoiceLineId: string;
  supplierName: string; aiConfidence?: number; status: string;
  invoice?: { invoiceNumber: string; date: string };
  invoiceLine?: { quantity: number; unit: string; unitPrice: number; totalPrice: number };
  suggestedAccountingCategory?: { id: string; name: string; color: string };
  suggestedInventoryCategory?: { id: string; name: string };
}
interface Category { id: string; name: string; }

export default function ClassificazionePage() {
  const [items, setItems] = useState<UnresolvedItem[]>([]);
  const [accCats, setAccCats] = useState<Category[]>([]);
  const [invCats, setInvCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, { acc: string; inv: string; saveRule: boolean; createProduct: boolean }>>({});

  const fetchData = () => {
    fetch('/api/classificazione')
      .then((r) => r.json())
      .then((d) => {
        setItems(d.unresolved);
        setAccCats(d.accountingCategories);
        setInvCats(d.inventoryCategories);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  function getAssignment(id: string) {
    return assignments[id] || { acc: '', inv: '', saveRule: false, createProduct: false };
  }

  function setAssignment(id: string, key: string, value: string | boolean) {
    setAssignments((p) => ({ ...p, [id]: { ...getAssignment(id), [key]: value } }));
  }

  async function handleResolve(item: UnresolvedItem) {
    const a = getAssignment(item.id);
    if (!a.acc) return;
    setResolving(item.id);
    await fetch('/api/classificazione', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unresolvedId: item.id,
        accountingCategoryId: a.acc,
        inventoryCategoryId: a.inv || undefined,
        saveRule: a.saveRule,
        createProduct: a.createProduct,
      }),
    });
    setResolving(null);
    fetchData();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin text-brand-600" size={32} /></div>;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <AlertTriangle size={24} className="text-amber-500" />
          Prodotti da classificare
        </h1>
        <p className="page-subtitle">
          {items.length > 0
            ? `${items.length} prodotti in attesa di classificazione manuale`
            : 'Tutti i prodotti sono stati classificati'}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tutto classificato!</h2>
          <p className="text-gray-500">Non ci sono prodotti in attesa di revisione.</p>
          <Link href="/fatture" className="btn-primary mt-4 inline-flex">
            Carica una fattura
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const a = getAssignment(item.id);
            return (
              <div key={item.id} className={cn('card p-5 border-l-4', item.aiConfidence && item.aiConfidence > 0.5 ? 'border-l-amber-400' : 'border-l-red-400')}>
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-semibold text-gray-900 text-base">{item.originalText}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>Fornitore: <strong>{item.supplierName}</strong></span>
                      {item.invoice && (
                        <Link href={`/fatture/${item.invoiceId}`} className="flex items-center gap-1 text-brand-600 hover:underline">
                          Fattura {item.invoice.invoiceNumber} <ChevronRight size={12} />
                        </Link>
                      )}
                    </div>
                    {item.invoiceLine && (
                      <p className="text-sm text-gray-500 mt-1">
                        {item.invoiceLine.quantity} {item.invoiceLine.unit} × {formatCurrency(item.invoiceLine.unitPrice)} = <strong>{formatCurrency(item.invoiceLine.totalPrice)}</strong>
                      </p>
                    )}
                    {item.aiConfidence !== undefined && (
                      <p className="text-xs text-gray-400 mt-1">
                        Confidenza AI: {(item.aiConfidence * 100).toFixed(0)}%
                        {item.suggestedAccountingCategory && (
                          <> · Suggerito: <span className="font-medium">{item.suggestedAccountingCategory.name}</span></>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Assegnazione */}
                  <div className="flex flex-col gap-3 min-w-[280px]">
                    <div>
                      <label className="label">Categoria contabile *</label>
                      <select
                        className="input"
                        value={a.acc || item.suggestedAccountingCategory?.id || ''}
                        onChange={(e) => setAssignment(item.id, 'acc', e.target.value)}
                      >
                        <option value="">— Scegli categoria —</option>
                        {accCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Categoria inventario</label>
                      <select
                        className="input"
                        value={a.inv || item.suggestedInventoryCategory?.id || ''}
                        onChange={(e) => setAssignment(item.id, 'inv', e.target.value)}
                      >
                        <option value="">— Nessuna / Non inventariabile —</option>
                        {invCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    {/* Opzioni */}
                    <div className="flex flex-col gap-2 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={a.saveRule}
                          onChange={(e) => setAssignment(item.id, 'saveRule', e.target.checked)}
                          className="rounded border-gray-300 text-brand-600"
                        />
                        <BookmarkPlus size={14} className="text-brand-600" />
                        <span>Salva come regola automatica</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={a.createProduct}
                          onChange={(e) => setAssignment(item.id, 'createProduct', e.target.checked)}
                          className="rounded border-gray-300 text-brand-600"
                        />
                        <PackagePlus size={14} className="text-brand-600" />
                        <span>Crea articolo inventario</span>
                      </label>
                    </div>

                    <button
                      onClick={() => handleResolve(item)}
                      disabled={!a.acc || resolving === item.id}
                      className="btn-primary justify-center"
                    >
                      {resolving === item.id ? (
                        <><RefreshCw size={14} className="animate-spin" /> Salvataggio...</>
                      ) : (
                        <><CheckCircle size={14} /> Conferma classificazione</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
