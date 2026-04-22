'use client';

import { useEffect, useState } from 'react';
import { Plus, Users, RefreshCw, Trash2, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface StaffMember {
  id: string; name: string; role: string; hourlyRate: number; extraHourlyRate: number;
  employmentType: string; startDate: string; active: boolean;
}
interface StaffHours {
  id: string; staffMemberId: string; date: string;
  ordinaryHours: number; extraHours: number; totalCost: number; notes?: string;
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  dipendente: 'Dipendente',
  collaboratore: 'Collaboratore',
  freelance: 'Freelance',
};

export default function PersonalePage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [hours, setHours] = useState<StaffHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showHoursForm, setShowHoursForm] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', role: '', hourlyRate: '', extraHourlyRate: '', employmentType: 'dipendente', startDate: '' });
  const [hoursForm, setHoursForm] = useState({ staffMemberId: '', date: new Date().toISOString().split('T')[0], ordinaryHours: '8', extraHours: '0', notes: '' });
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const fetchData = () => {
    fetch('/api/personale')
      .then((r) => r.json())
      .then((d) => { setStaff(d.staffMembers); setHours(d.staffHours); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  async function handleSaveMember() {
    if (!staffForm.name) return;
    setSaving(true);
    await fetch('/api/personale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...staffForm,
        hourlyRate: parseFloat(staffForm.hourlyRate),
        extraHourlyRate: parseFloat(staffForm.extraHourlyRate),
      }),
    });
    setShowStaffForm(false);
    setSaving(false);
    fetchData();
  }

  async function handleSaveHours() {
    if (!hoursForm.staffMemberId) return;
    setSaving(true);
    await fetch('/api/personale/ore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...hoursForm,
        ordinaryHours: parseFloat(hoursForm.ordinaryHours),
        extraHours: parseFloat(hoursForm.extraHours),
      }),
    });
    setShowHoursForm(false);
    setSaving(false);
    fetchData();
  }

  async function handleDeleteHours(id: string) {
    await fetch('/api/personale/ore', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchData();
  }

  const monthHours = hours.filter((h) => h.date.startsWith(selectedMonth));
  const totalStaffCost = monthHours.reduce((s, h) => s + h.totalCost, 0);
  const totalOrdinary = monthHours.reduce((s, h) => s + h.ordinaryHours, 0);
  const totalExtra = monthHours.reduce((s, h) => s + h.extraHours, 0);

  const getStaffName = (id: string) => staff.find((s) => s.id === id)?.name || '—';
  const getStaffRole = (id: string) => staff.find((s) => s.id === id)?.role || '';

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="page-header flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Personale</h1>
          <p className="page-subtitle">Dipendenti, ore e costo del lavoro</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHoursForm(!showHoursForm)} className="btn-secondary">
            <Clock size={16} /> Inserisci ore
          </button>
          <button onClick={() => setShowStaffForm(!showStaffForm)} className="btn-primary">
            <Plus size={16} /> Aggiungi persona
          </button>
        </div>
      </div>

      {/* Stats mensili */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="month"
          className="input w-auto"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
        <div className="flex gap-4">
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
            <span className="text-xs text-gray-500">Ore ordinarie: </span>
            <span className="font-bold">{totalOrdinary}h</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
            <span className="text-xs text-gray-500">Ore extra: </span>
            <span className="font-bold text-orange-600">{totalExtra}h</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
            <span className="text-xs text-gray-500">Costo totale: </span>
            <span className="font-bold text-brand-700">{formatCurrency(totalStaffCost)}</span>
          </div>
        </div>
      </div>

      {/* Form anagrafica */}
      {showStaffForm && (
        <div className="card p-5">
          <h2 className="section-title">Nuova persona</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group md:col-span-2">
              <label className="label">Nome e cognome *</label>
              <input type="text" className="input" value={staffForm.name} onChange={(e) => setStaffForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Ruolo</label>
              <input type="text" className="input" value={staffForm.role} onChange={(e) => setStaffForm((p) => ({ ...p, role: e.target.value }))} placeholder="es. Cameriere" />
            </div>
            <div className="form-group">
              <label className="label">Tipo contratto</label>
              <select className="input" value={staffForm.employmentType} onChange={(e) => setStaffForm((p) => ({ ...p, employmentType: e.target.value }))}>
                <option value="dipendente">Dipendente</option>
                <option value="collaboratore">Collaboratore</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Tariffa oraria ordinaria (€)</label>
              <input type="number" step="0.01" className="input" value={staffForm.hourlyRate} onChange={(e) => setStaffForm((p) => ({ ...p, hourlyRate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Tariffa ore extra (€)</label>
              <input type="number" step="0.01" className="input" value={staffForm.extraHourlyRate} onChange={(e) => setStaffForm((p) => ({ ...p, extraHourlyRate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Data inizio</label>
              <input type="date" className="input" value={staffForm.startDate} onChange={(e) => setStaffForm((p) => ({ ...p, startDate: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowStaffForm(false)} className="btn-secondary">Annulla</button>
            <button onClick={handleSaveMember} className="btn-primary" disabled={saving}>Salva</button>
          </div>
        </div>
      )}

      {/* Form ore */}
      {showHoursForm && (
        <div className="card p-5">
          <h2 className="section-title">Inserimento ore</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="label">Persona *</label>
              <select className="input" value={hoursForm.staffMemberId} onChange={(e) => setHoursForm((p) => ({ ...p, staffMemberId: e.target.value }))}>
                <option value="">— Scegli —</option>
                {staff.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Data *</label>
              <input type="date" className="input" value={hoursForm.date} onChange={(e) => setHoursForm((p) => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Ore ordinarie</label>
              <input type="number" step="0.5" className="input" value={hoursForm.ordinaryHours} onChange={(e) => setHoursForm((p) => ({ ...p, ordinaryHours: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Ore extra</label>
              <input type="number" step="0.5" className="input" value={hoursForm.extraHours} onChange={(e) => setHoursForm((p) => ({ ...p, extraHours: e.target.value }))} />
            </div>
            <div className="form-group md:col-span-2">
              <label className="label">Note</label>
              <input type="text" className="input" value={hoursForm.notes} onChange={(e) => setHoursForm((p) => ({ ...p, notes: e.target.value }))} placeholder="es. Serata evento" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowHoursForm(false)} className="btn-secondary">Annulla</button>
            <button onClick={handleSaveHours} className="btn-primary" disabled={saving}>Salva ore</button>
          </div>
        </div>
      )}

      {/* Lista staff */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="section-title mb-0">Anagrafica personale</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32"><RefreshCw className="animate-spin text-brand-600" size={24} /></div>
        ) : staff.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Users size={36} className="mx-auto mb-2 opacity-30" />
            <p>Nessun dipendente ancora</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Ruolo</th>
                <th>Tipo</th>
                <th>Tariffa ord.</th>
                <th>Tariffa extra</th>
                <th>Ore mese</th>
                <th>Costo mese</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => {
                const memberHours = monthHours.filter((h) => h.staffMemberId === s.id);
                const ord = memberHours.reduce((acc, h) => acc + h.ordinaryHours, 0);
                const ext = memberHours.reduce((acc, h) => acc + h.extraHours, 0);
                const cost = memberHours.reduce((acc, h) => acc + h.totalCost, 0);
                return (
                  <tr key={s.id}>
                    <td className="font-medium text-gray-900">{s.name}</td>
                    <td className="text-gray-500">{s.role}</td>
                    <td><span className="badge bg-gray-100 text-gray-700">{EMPLOYMENT_LABELS[s.employmentType] || s.employmentType}</span></td>
                    <td>{formatCurrency(s.hourlyRate)}/h</td>
                    <td>{formatCurrency(s.extraHourlyRate)}/h</td>
                    <td>
                      <span>{ord}h</span>
                      {ext > 0 && <span className="text-orange-600 ml-1">+{ext}h extra</span>}
                    </td>
                    <td className="font-bold">{formatCurrency(cost)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Ore del mese */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="section-title mb-0">Ore registrate — {selectedMonth}</h2>
        </div>
        {monthHours.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Nessuna ora registrata per questo mese</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Persona</th>
                <th>Ruolo</th>
                <th>Ore ord.</th>
                <th>Ore extra</th>
                <th>Costo</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {monthHours.sort((a, b) => b.date.localeCompare(a.date)).map((h) => (
                <tr key={h.id}>
                  <td className="text-gray-500 whitespace-nowrap">{formatDate(h.date)}</td>
                  <td className="font-medium">{getStaffName(h.staffMemberId)}</td>
                  <td className="text-gray-500 text-xs">{getStaffRole(h.staffMemberId)}</td>
                  <td>{h.ordinaryHours}h</td>
                  <td className={h.extraHours > 0 ? 'text-orange-600 font-medium' : 'text-gray-400'}>{h.extraHours}h</td>
                  <td className="font-semibold">{formatCurrency(h.totalCost)}</td>
                  <td className="text-gray-400 text-xs">{h.notes || '—'}</td>
                  <td>
                    <button onClick={() => handleDeleteHours(h.id)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
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
