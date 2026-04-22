'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Product {
  id: string; name: string; normalizedName: string; unit: string;
  averageCost: number; lastCost: number; stockQuantity: number;
  accountingCategoryId: string; inventoryCategoryId: string;
  defaultSupplierId?: string; sku?: string; active: boolean;
}
interface Movement {
  id: string; type: 'load' | 'unload' | 'adjustment'; quantity: number;
  unitCost: number; totalCost: number; date: string; notes?: string;
}
interface Category { id: string; name: string; }
interface Supplier { id: string; name: string; }

export default function ProdottoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [accCats, setAccCats] = useState<Category[]>([]);
  const [invCats, setInvCats] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Product>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    fetch(`/api/inventario/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setProduct(d.product);
        setMovements(d.movements.sort((a: Movement, b: Movement) => b.date.localeCompare(a.date)));
        setAccCats(d.accountingCategories);
        setInvCats(d.inventoryCategories);
        setSuppliers(d.suppliers);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  function startEdit() {
    if (!product) return;
    setEditData({ ...product });
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/inventario/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    });
    setSaving(false);
    setEditing(false);
    fetchData();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin text-brand-600" size={32} /></div>;
  if (!product) return <div className="alert-error">Prodotto non trovato.</div>;

  const getCatName = (id: string, cats: Category[]) => cats.find((c) => c.id === id)?.name || '—';
  const getSupplierName = (id?: string) => id ? suppliers.find((s) => s.id === id)?.name || '—' : '—';

  const typeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    load: { label: 'Carico', icon: <TrendingUp size={14} className="text-green-600" />, color: 'text-green-600' },
    unload: { label: 'Scarico', icon: <TrendingDown size={14} className="text-red-600" />, color: 'text-red-600' },
    adjustment: { label: 'Rettifica', icon: <Minus size={14} className="text-gray-600" />, color: 'text-gray-600' },
  };

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventario" className="btn-ghost btn-sm"><ArrowLeft size={16} /> Inventario</Link>
        <h1 className="page-title flex-1">{product.name}</h1>
        {!editing ? (
          <button onClick={startEdit} className="btn-secondary"><Save size={16} /> Modifica</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="btn-secondary">Annulla</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        )}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">Stock teorico</p>
          <p className="text-2xl font-bold">{product.stockQuantity} {product.unit}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">Costo medio</p>
          <p className="text-2xl font-bold">{formatCurrency(product.averageCost)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">Ultimo costo</p>
          <p className="text-2xl font-bold">{formatCurrency(product.lastCost)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">Valore stock</p>
          <p className="text-2xl font-bold">{formatCurrency(product.averageCost * product.stockQuantity)}</p>
        </div>
      </div>

      {/* Scheda prodotto */}
      <div className="card p-5">
        <h2 className="section-title">Scheda prodotto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {editing ? (
            <>
              <div className="form-group">
                <label className="label">Nome</label>
                <input className="input" value={editData.name || ''} onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">SKU interno</label>
                <input className="input" value={editData.sku || ''} onChange={(e) => setEditData((p) => ({ ...p, sku: e.target.value }))} placeholder="Opzionale" />
              </div>
              <div className="form-group">
                <label className="label">Unità di misura</label>
                <select className="input" value={editData.unit || ''} onChange={(e) => setEditData((p) => ({ ...p, unit: e.target.value }))}>
                  {['pz', 'kg', 'lt', 'fusto', 'cf', 'rl', 'bt'].map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Categoria contabile</label>
                <select className="input" value={editData.accountingCategoryId || ''} onChange={(e) => setEditData((p) => ({ ...p, accountingCategoryId: e.target.value }))}>
                  <option value="">— Scegli —</option>
                  {accCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Categoria inventario</label>
                <select className="input" value={editData.inventoryCategoryId || ''} onChange={(e) => setEditData((p) => ({ ...p, inventoryCategoryId: e.target.value }))}>
                  <option value="">— Nessuna —</option>
                  {invCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Fornitore abituale</label>
                <select className="input" value={editData.defaultSupplierId || ''} onChange={(e) => setEditData((p) => ({ ...p, defaultSupplierId: e.target.value }))}>
                  <option value="">— Nessuno —</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </>
          ) : (
            <>
              {[
                ['Nome', product.name],
                ['SKU', product.sku || '—'],
                ['Unità di misura', product.unit],
                ['Categoria contabile', getCatName(product.accountingCategoryId, accCats)],
                ['Categoria inventario', getCatName(product.inventoryCategoryId, invCats)],
                ['Fornitore abituale', getSupplierName(product.defaultSupplierId)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-medium text-gray-900">{value}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Movimenti */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="section-title mb-0">Ultimi movimenti</h2>
        </div>
        {movements.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Nessun movimento registrato</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Quantità</th>
                <th>Costo unitario</th>
                <th>Totale</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => {
                const t = typeLabels[m.type];
                return (
                  <tr key={m.id}>
                    <td className="text-gray-500">{formatDate(m.date)}</td>
                    <td>
                      <span className={`flex items-center gap-1 font-medium ${t.color}`}>
                        {t.icon} {t.label}
                      </span>
                    </td>
                    <td className="font-semibold">{m.quantity}</td>
                    <td>{formatCurrency(m.unitCost)}</td>
                    <td className="font-semibold">{formatCurrency(m.totalCost)}</td>
                    <td className="text-gray-400 text-xs">{m.notes || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
