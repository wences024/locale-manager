'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit3, Save, X, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface ManualExpense {
  id: string; date: string; amount: number; description: string;
  supplierName?: string; accountingCategoryId: string;
  paymentMethod?: string; notes?: string;
}
interface Category { id: string; name: string; color: string; }

const PAYMENT_METHODS = [
  { value: 'contanti', label: 'Contanti' },
  { value: 'carta', label: 'Carta' },
  { value: 'bonifico', label: 'Bonifico' },
  { value: 'addebito_diretto', label: 'Addebito diretto' },
];

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  amount: '',
  description: '',
  supplierName: '',
  accountingCategoryId: '',
  paymentMethod: 'contanti',
  notes: '',
};

export default function SpesePage() {
  const [expenses, setExpenses] = useState<ManualExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = () => {
    fetch('/api/spese')
      .then((r) => r.json())
      .then((d) => {
        setExpenses(d.expenses);
        setCategories(d.accountingCategories.filter((c: any) => c.type === 'cost'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  async function handleSave() {
    if (!form.amount || !form.description || !form.accountingCategoryId) return;
    setSaving(true);
    const body = { ...form, amount: parseFloat(form.amount as string) };
    const url = editId ? `/api/spese/${editId}` : '/api/spese';
    const method = editId ? 'PATCH' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    setSaving(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questa spesa?')) return;
    await fetch(`/api/spese/${id}`, { method: 'DELETE' });
    fetchData();
  }

  function startEdit(exp: ManualExpense) {
    setEditId(exp.id);
    setForm({
      date: exp.date,
      amount: exp.amount.toString(),
      description: exp.description,
      supplierName: exp.supplierName || '',
      accountingCategoryId: exp.accountingCategoryId,
      paymentMethod: exp.paymentMethod || 'contanti',
      notes: exp.notes || '',
    });
    setShowForm(true);
  }

  const filtered = expenses.filter((e) =>
    !search ||
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    (e.supplierName || '').toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const getCatName = (id: string) => categories.find((c) => c.id === id)?.name || id;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="page-header flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Spese manuali</h1>
          <p className="page-subtitle">Registra spese senza fattura o fuori dal flusso standard</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} className="btn-primary">
          <Plus size={16} /> Aggiungi spesa
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title mb-0">{editId ? 'Modifica spesa' : 'Nuova spesa'}</h2>
            <button onClick={() => setShowForm(false)} className="btn-ghost btn-sm"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="label">Data *</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Importo (€) *</label>
              <input type="number" step="0.01" className="input" placeholder="0,00" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Categoria *</label>
              <select className="input" value={form.accountingCategoryId} onChange={(e) => setForm((p) => ({ ...p, accountingCategoryId: e.target.value }))} required>
                <option value="">— Scegli —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group md:col-span-2">
              <label className="label">Descrizione *</label>
              <input type="text" className="input" placeholder="es. Affitto mensile giugno" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Metodo di pagamento</label>
              <select className="input" value={form.paymentMethod} onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Fornitore / Causale</label>
              <input type="text" className="input" placeholder="es. Enel Energia" value={form.supplierName} onChange={(e) => setForm((p) => ({ ...p, supplierName: e.target.value }))} />
            </div>
            <div className="form-group md:col-span-2">
              <label className="label">Note</label>
              <input type="text" className="input" placeholder="Note aggiuntive..." value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Annulla</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Salvataggio...' : 'Salva spesa'}
            </button>
          </div>
        </div>
      )}

      {/* Filtri e totale */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Cerca spese..." className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
          <span className="text-sm text-gray-500">Totale: </span>
          <span className="font-bold text-gray-900">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Tabella */}
      <div className="table-container">
        {loading ? (
          <div className="flex items-center justify-center h-32"><RefreshCw className="animate-spin text-brand-600" size={24} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="font-medium">Nessuna spesa trovata</p>
            <button onClick={() => { setShowForm(true); }} className="btn-primary mt-4">
              <Plus size={16} /> Aggiungi la prima spesa
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrizione</th>
                <th>Fornitore</th>
                <th>Categoria</th>
                <th>Pagamento</th>
                <th>Importo</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp) => (
                <tr key={exp.id}>
                  <td className="text-gray-600 whitespace-nowrap">{formatDate(exp.date)}</td>
                  <td className="font-medium text-gray-900">{exp.description}</td>
                  <td className="text-gray-500">{exp.supplierName || '—'}</td>
                  <td>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      {getCatName(exp.accountingCategoryId)}
                    </span>
                  </td>
                  <td className="text-gray-500 capitalize">{exp.paymentMethod || '—'}</td>
                  <td className="font-bold text-gray-900">{formatCurrency(exp.amount)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(exp)} className="btn-ghost btn-sm">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(exp.id)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50">
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
