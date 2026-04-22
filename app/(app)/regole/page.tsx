'use client';

import { useEffect, useState } from 'react';
import { Brain, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw, Save } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';

interface Rule {
  id: string; name: string; conditionType: string; conditionField: string;
  conditionValue: string; accountingCategoryId: string; inventoryCategoryId?: string;
  priority: number; active: boolean; createdAt: string; matchCount: number;
}
interface Category { id: string; name: string; }

const CONDITION_TYPES = [
  { value: 'contains', label: 'Contiene' },
  { value: 'starts_with', label: 'Inizia con' },
  { value: 'ends_with', label: 'Finisce con' },
  { value: 'equals', label: 'Uguale a' },
];

const CONDITION_FIELDS = [
  { value: 'product_name', label: 'Nome prodotto' },
  { value: 'supplier_name', label: 'Nome fornitore' },
];

const emptyForm = {
  name: '', conditionType: 'contains', conditionField: 'product_name',
  conditionValue: '', accountingCategoryId: '', inventoryCategoryId: '', priority: 5,
};

export default function RegolePage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [accCats, setAccCats] = useState<Category[]>([]);
  const [invCats, setInvCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    fetch('/api/regole')
      .then((r) => r.json())
      .then((d) => { setRules(d.rules); setAccCats(d.accountingCategories); setInvCats(d.inventoryCategories); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  async function handleSave() {
    if (!form.name || !form.conditionValue || !form.accountingCategoryId) return;
    setSaving(true);
    await fetch('/api/regole', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, active: true }),
    });
    setShowForm(false);
    setForm(emptyForm);
    setSaving(false);
    fetchData();
  }

  async function handleToggle(id: string, active: boolean) {
    await fetch(`/api/regole/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    });
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questa regola?')) return;
    await fetch(`/api/regole/${id}`, { method: 'DELETE' });
    fetchData();
  }

  const getCatName = (id: string, cats: Category[]) => cats.find((c) => c.id === id)?.name || '—';
  const getCondLabel = (type: string) => CONDITION_TYPES.find((t) => t.value === type)?.label || type;
  const getFieldLabel = (field: string) => CONDITION_FIELDS.find((f) => f.value === field)?.label || field;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="page-header flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Brain size={24} className="text-purple-500" /> Regole AI / Classificazione
          </h1>
          <p className="page-subtitle">Regole automatiche per classificare prodotti e spese</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus size={16} /> Nuova regola
        </button>
      </div>

      {/* Info */}
      <div className="alert-info text-sm">
        💡 Le regole vengono applicate nell'ordine di priorità (dalla più alta). Quando una regola corrisponde, le successive vengono ignorate.
        Puoi anche salvare regole direttamente dalle righe delle fatture.
      </div>

      {/* Form nuova regola */}
      {showForm && (
        <div className="card p-5">
          <h2 className="section-title">Nuova regola di classificazione</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="form-group md:col-span-2">
              <label className="label">Nome regola *</label>
              <input type="text" className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="es. Fusto birra → Beer" />
            </div>
            <div className="form-group">
              <label className="label">Priorità</label>
              <input type="number" className="input" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: parseInt(e.target.value) }))} min={1} max={100} />
            </div>
            <div className="form-group">
              <label className="label">Campo *</label>
              <select className="input" value={form.conditionField} onChange={(e) => setForm((p) => ({ ...p, conditionField: e.target.value }))}>
                {CONDITION_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Condizione *</label>
              <select className="input" value={form.conditionType} onChange={(e) => setForm((p) => ({ ...p, conditionType: e.target.value }))}>
                {CONDITION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Valore *</label>
              <input type="text" className="input" value={form.conditionValue} onChange={(e) => setForm((p) => ({ ...p, conditionValue: e.target.value }))} placeholder="es. fusto, mozzarella..." />
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
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Annulla</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Salvataggio...' : 'Salva regola'}
            </button>
          </div>
        </div>
      )}

      {/* Tabella regole */}
      <div className="table-container">
        {loading ? (
          <div className="flex items-center justify-center h-32"><RefreshCw className="animate-spin text-brand-600" size={24} /></div>
        ) : rules.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Brain size={36} className="mx-auto mb-2 opacity-30" />
            <p>Nessuna regola configurata</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Priorità</th>
                <th>Nome</th>
                <th>Condizione</th>
                <th>Categoria contabile</th>
                <th>Categoria inventario</th>
                <th>Match</th>
                <th>Creata</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className={cn(!rule.active && 'opacity-50')}>
                  <td>
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono text-sm">
                      {rule.priority}
                    </span>
                  </td>
                  <td className="font-medium text-gray-900">{rule.name}</td>
                  <td className="text-sm">
                    <span className="text-gray-500">{getFieldLabel(rule.conditionField)}</span>
                    <span className="mx-1 text-gray-300">·</span>
                    <span className="text-gray-500">{getCondLabel(rule.conditionType)}</span>
                    <span className="mx-1 text-gray-300">·</span>
                    <code className="bg-gray-100 px-1 rounded text-xs text-brand-700">"{rule.conditionValue}"</code>
                  </td>
                  <td><span className="text-sm">{getCatName(rule.accountingCategoryId, accCats)}</span></td>
                  <td><span className="text-sm text-gray-500">{rule.inventoryCategoryId ? getCatName(rule.inventoryCategoryId, invCats) : '—'}</span></td>
                  <td>
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                      {rule.matchCount}×
                    </span>
                  </td>
                  <td className="text-gray-400 text-xs">{formatDate(rule.createdAt)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggle(rule.id, rule.active)}
                        className={cn('btn-ghost btn-sm', rule.active ? 'text-green-600' : 'text-gray-400')}
                        title={rule.active ? 'Disattiva' : 'Attiva'}
                      >
                        {rule.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button onClick={() => handleDelete(rule.id)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50">
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
