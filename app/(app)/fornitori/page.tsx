'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, Save, X, Truck, Search, RefreshCw } from 'lucide-react';

interface Supplier {
  id: string; name: string; vatNumber?: string; address?: string;
  email?: string; phone?: string; notes?: string;
}

const emptyForm = { name: '', vatNumber: '', address: '', email: '', phone: '', notes: '' };

export default function FornitoriPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = () => {
    fetch('/api/fornitori')
      .then((r) => r.json())
      .then((d) => setSuppliers(d.suppliers))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  async function handleSave() {
    if (!form.name) return;
    setSaving(true);
    const url = editId ? `/api/fornitori/${editId}` : '/api/fornitori';
    const method = editId ? 'PATCH' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    setSaving(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questo fornitore?')) return;
    await fetch(`/api/fornitori/${id}`, { method: 'DELETE' });
    fetchData();
  }

  function startEdit(s: Supplier) {
    setEditId(s.id);
    setForm({ name: s.name, vatNumber: s.vatNumber || '', address: s.address || '', email: s.email || '', phone: s.phone || '', notes: s.notes || '' });
    setShowForm(true);
  }

  const filtered = suppliers.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="page-header flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2"><Truck size={24} /> Fornitori</h1>
          <p className="page-subtitle">Gestisci i fornitori del locale</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} className="btn-primary">
          <Plus size={16} /> Nuovo fornitore
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">{editId ? 'Modifica fornitore' : 'Nuovo fornitore'}</h2>
            <button onClick={() => setShowForm(false)} className="btn-ghost btn-sm"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="form-group md:col-span-2">
              <label className="label">Ragione sociale *</label>
              <input type="text" className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="es. Metro Cash&Carry" />
            </div>
            <div className="form-group">
              <label className="label">Partita IVA</label>
              <input type="text" className="input" value={form.vatNumber} onChange={(e) => setForm((p) => ({ ...p, vatNumber: e.target.value }))} />
            </div>
            <div className="form-group md:col-span-2">
              <label className="label">Indirizzo</label>
              <input type="text" className="input" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Telefono</label>
              <input type="tel" className="input" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="form-group md:col-span-2">
              <label className="label">Note</label>
              <input type="text" className="input" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Annulla</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </div>
      )}

      {/* Ricerca */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Cerca fornitore..." className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Tabella */}
      <div className="table-container">
        {loading ? (
          <div className="flex items-center justify-center h-32"><RefreshCw className="animate-spin text-brand-600" size={24} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Truck size={36} className="mx-auto mb-2 opacity-30" />
            <p>Nessun fornitore trovato</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Ragione sociale</th>
                <th>P.IVA</th>
                <th>Indirizzo</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium text-gray-900">{s.name}</td>
                  <td className="font-mono text-xs text-gray-500">{s.vatNumber || '—'}</td>
                  <td className="text-gray-500 text-sm">{s.address || '—'}</td>
                  <td className="text-gray-500 text-sm">{s.email || '—'}</td>
                  <td className="text-gray-500 text-sm">{s.phone || '—'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(s)} className="btn-ghost btn-sm">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50">
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
