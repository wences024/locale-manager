'use client';

import { useEffect, useState } from 'react';
import { Plus, BookOpen, RefreshCw } from 'lucide-react';

interface AccCat { id: string; name: string; type: string; color: string; icon?: string; }
interface InvCat { id: string; name: string; color: string; }

export default function CategoriePage() {
  const [accCats, setAccCats] = useState<AccCat[]>([]);
  const [invCats, setInvCats] = useState<InvCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccForm, setShowAccForm] = useState(false);
  const [showInvForm, setShowInvForm] = useState(false);
  const [accForm, setAccForm] = useState({ name: '', type: 'cost', color: '#0ea5e9', icon: '' });
  const [invForm, setInvForm] = useState({ name: '', color: '#10b981' });
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    fetch('/api/categorie')
      .then((r) => r.json())
      .then((d) => { setAccCats(d.accountingCategories); setInvCats(d.inventoryCategories); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  async function handleSaveAcc() {
    setSaving(true);
    await fetch('/api/categorie', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...accForm, type: 'accounting' }) });
    setShowAccForm(false);
    setSaving(false);
    fetchData();
  }

  async function handleSaveInv() {
    setSaving(true);
    await fetch('/api/categorie', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'inventory', ...invForm }) });
    setShowInvForm(false);
    setSaving(false);
    fetchData();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin text-brand-600" size={32} /></div>;

  const revenueCats = accCats.filter((c) => c.type === 'revenue');
  const costCats = accCats.filter((c) => c.type === 'cost');

  return (
    <div className="fade-in space-y-8">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><BookOpen size={24} /> Categorie</h1>
        <p className="page-subtitle">Gestisci le categorie contabili e di inventario</p>
      </div>

      {/* Categorie contabili */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Categorie contabili</h2>
          <button onClick={() => setShowAccForm(!showAccForm)} className="btn-secondary btn-sm">
            <Plus size={14} /> Aggiungi
          </button>
        </div>

        {showAccForm && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="col-span-2">
                <label className="label">Nome</label>
                <input type="text" className="input" value={accForm.name} onChange={(e) => setAccForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Tipo</label>
                <select className="input" value={accForm.type} onChange={(e) => setAccForm((p) => ({ ...p, type: e.target.value }))}>
                  <option value="revenue">Ricavo</option>
                  <option value="cost">Costo</option>
                </select>
              </div>
              <div>
                <label className="label">Colore</label>
                <input type="color" className="input p-1 h-10" value={accForm.color} onChange={(e) => setAccForm((p) => ({ ...p, color: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAccForm(false)} className="btn-secondary btn-sm">Annulla</button>
              <button onClick={handleSaveAcc} className="btn-primary btn-sm" disabled={saving}>Salva</button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ricavi</p>
            <div className="flex flex-wrap gap-2">
              {revenueCats.map((c) => (
                <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm font-medium">{c.icon && <span className="mr-1">{c.icon}</span>}{c.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Costi</p>
            <div className="flex flex-wrap gap-2">
              {costCats.map((c) => (
                <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm font-medium">{c.icon && <span className="mr-1">{c.icon}</span>}{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categorie inventario */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Categorie inventario</h2>
          <button onClick={() => setShowInvForm(!showInvForm)} className="btn-secondary btn-sm">
            <Plus size={14} /> Aggiungi
          </button>
        </div>

        {showInvForm && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label">Nome</label>
                <input type="text" className="input" value={invForm.name} onChange={(e) => setInvForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Colore</label>
                <input type="color" className="input p-1 h-10" value={invForm.color} onChange={(e) => setInvForm((p) => ({ ...p, color: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowInvForm(false)} className="btn-secondary btn-sm">Annulla</button>
              <button onClick={handleSaveInv} className="btn-primary btn-sm" disabled={saving}>Salva</button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {invCats.map((c) => (
            <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="text-sm font-medium">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
