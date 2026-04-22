'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Package, Edit3, RefreshCw } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface Product {
  id: string; name: string; unit: string; averageCost: number; lastCost: number;
  stockQuantity: number; accountingCategoryId: string; inventoryCategoryId: string;
  active: boolean;
}
interface Category { id: string; name: string; color: string; }

export default function InventarioPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [invCats, setInvCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [accCats, setAccCats] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', unit: 'pz', accountingCategoryId: '', inventoryCategoryId: '', lastCost: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = (s = search, c = catFilter) => {
    const params = new URLSearchParams();
    if (s) params.set('search', s);
    if (c) params.set('category', c);
    fetch(`/api/inventario?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products);
        setInvCats(d.inventoryCategories);
        setAccCats(d.accountingCategories);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, catFilter]);

  async function handleSave() {
    if (!form.name || !form.accountingCategoryId) return;
    setSaving(true);
    await fetch('/api/inventario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, lastCost: parseFloat(form.lastCost) || 0 }),
    });
    setShowForm(false);
    setForm({ name: '', unit: 'pz', accountingCategoryId: '', inventoryCategoryId: '', lastCost: '' });
    setSaving(false);
    fetchData();
  }

  const getCatName = (id: string, cats: Category[]) => cats.find((c) => c.id === id)?.name || '—';
  const getCatColor = (id: string, cats: Category[]) => cats.find((c) => c.id === id)?.color || '#94a3b8';

  const stockValue = products.reduce((s, p) => s + (p.averageCost * p.stockQuantity), 0);

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="page-header flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Inventario</h1>
          <p className="page-subtitle">Prodotti, stock e movimenti</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus size={16} /> Nuovo prodotto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">Prodotti attivi</p>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">Valore stock teorico</p>
          <p className="text-2xl font-bold">{formatCurrency(stockValue)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">Categorie</p>
          <p className="text-2xl font-bold">{invCats.length}</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5">
          <h2 className="section-title">Nuovo prodotto</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group md:col-span-2">
              <label className="label">Nome prodotto *</label>
              <input type="text" className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="es. Coca Cola 33cl" />
            </div>
            <div className="form-group">
              <label className="label">Unità di misura</label>
              <select className="input" value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}>
                {['pz', 'kg', 'lt', 'fusto', 'cf', 'rl', 'bt'].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Categoria contabile *</label>
              <select className="input" value={form.accountingCategoryId} onChange={(e) => setForm((p) => ({ ...p, accountingCategoryId: e.target.value }))}>
                <option value="">— Scegli —</option>
                {accCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Categoria inventario</label>
              <select className="input" value={form.inventoryCategoryId} onChange={(e) => setForm((p) => ({ ...p, inventoryCategoryId: e.target.value }))}>
                <option value="">— Nessuna —</option>
                {invCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Costo unitario (€)</label>
              <input type="number" step="0.01" className="input" value={form.lastCost} onChange={(e) => setForm((p) => ({ ...p, lastCost: e.target.value }))} placeholder="0,00" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Annulla</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving ? 'Salvataggio...' : 'Salva prodotto'}
            </button>
          </div>
        </div>
      )}

      {/* Filtri */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Cerca prodotto..." className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">Tutte le categorie</option>
          {invCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Tabella */}
      <div className="table-container">
        {loading ? (
          <div className="flex items-center justify-center h-40"><RefreshCw className="animate-spin text-brand-600" size={24} /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nessun prodotto trovato</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Prodotto</th>
                <th>Categoria</th>
                <th>U.M.</th>
                <th>Stock teorico</th>
                <th>Costo medio</th>
                <th>Ultimo costo</th>
                <th>Valore stock</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium text-gray-900">{p.name}</td>
                  <td>
                    <span
                      className="badge text-white text-xs"
                      style={{ backgroundColor: getCatColor(p.inventoryCategoryId, invCats) }}
                    >
                      {getCatName(p.inventoryCategoryId, invCats)}
                    </span>
                  </td>
                  <td className="text-gray-500">{p.unit}</td>
                  <td className={cn('font-semibold', p.stockQuantity <= 0 ? 'text-red-600' : p.stockQuantity < 5 ? 'text-amber-600' : 'text-green-600')}>
                    {p.stockQuantity} {p.unit}
                  </td>
                  <td>{formatCurrency(p.averageCost)}</td>
                  <td>{formatCurrency(p.lastCost)}</td>
                  <td className="font-semibold">{formatCurrency(p.averageCost * p.stockQuantity)}</td>
                  <td>
                    <Link href={`/inventario/${p.id}`} className="btn-ghost btn-sm">
                      <Edit3 size={14} /> Dettaglio
                    </Link>
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
