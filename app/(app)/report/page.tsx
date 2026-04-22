'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { RefreshCw, TrendingUp, TrendingDown, Printer } from 'lucide-react';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';

interface ReportData {
  month: string;
  totalRevenue: number; totalCosts: number; netResult: number;
  invoiceCosts: number; manualCosts: number; staffCost: number;
  fixedCosts: number; variableCosts: number;
  totalOrdinaryHours: number; totalExtraHours: number;
  revenueByCategory: Record<string, number>;
  costsByCategory: Record<string, number>;
  unresolvedCount: number;
  accountingCategories: { id: string; name: string; type: string; color: string }[];
}

export default function ReportPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    setLoading(true);
    fetch(`/api/report?month=${month}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [month]);

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin text-brand-600" size={32} /></div>;
  if (!data) return <div className="alert-error">Errore nel caricamento.</div>;

  const getCatName = (id: string) => data.accountingCategories.find((c) => c.id === id)?.name || id;
  const getCatColor = (id: string) => data.accountingCategories.find((c) => c.id === id)?.color || '#94a3b8';

  const revData = Object.entries(data.revenueByCategory)
    .map(([id, val]) => ({ name: getCatName(id), value: parseFloat(val.toFixed(2)), color: getCatColor(id) }))
    .filter((d) => d.value > 0);

  const costData = Object.entries(data.costsByCategory)
    .map(([id, val]) => ({ name: getCatName(id), value: parseFloat(val.toFixed(2)), color: getCatColor(id) }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const marginPercent = data.totalRevenue > 0 ? (data.netResult / data.totalRevenue) : 0;
  const staffPercent = data.totalRevenue > 0 ? (data.staffCost / data.totalRevenue) : 0;

  const monthLabel = new Date(month + '-15').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  return (
    <div className="fade-in space-y-6 print:space-y-4">
      {/* Header */}
      <div className="page-header flex items-start justify-between flex-wrap gap-4 print:hidden">
        <div>
          <h1 className="page-title">Report mensile</h1>
          <p className="page-subtitle">Analisi economica per il mese selezionato</p>
        </div>
        <div className="flex gap-3 items-center">
          <input type="month" className="input w-auto" value={month} onChange={(e) => setMonth(e.target.value)} />
          <button onClick={() => window.print()} className="btn-secondary">
            <Printer size={16} /> Stampa
          </button>
        </div>
      </div>

      {/* Titolo report (print) */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-2xl font-bold">Report mensile — {monthLabel}</h1>
      </div>

      {/* Alert non classificati */}
      {data.unresolvedCount > 0 && (
        <div className="alert-warning print:hidden">
          ⚠️ Attenzione: {data.unresolvedCount} prodotti non classificati potrebbero influenzare i dati.
        </div>
      )}

      {/* KPI principali */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ricavi totali', value: formatCurrency(data.totalRevenue), color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Costi totali', value: formatCurrency(data.totalCosts), color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Risultato netto', value: formatCurrency(data.netResult), color: data.netResult >= 0 ? 'text-brand-700' : 'text-red-700', bg: data.netResult >= 0 ? 'bg-brand-50' : 'bg-red-50' },
          { label: 'Margine %', value: formatPercent(marginPercent), color: marginPercent >= 0 ? 'text-green-700' : 'text-red-700', bg: 'bg-gray-50' },
        ].map((kpi) => (
          <div key={kpi.label} className={cn('card p-5', kpi.bg)}>
            <p className="text-xs text-gray-600 mb-1">{kpi.label}</p>
            <p className={cn('text-2xl font-bold', kpi.color)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Dettaglio costi */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Costi fissi', value: formatCurrency(data.fixedCosts) },
          { label: 'Costi variabili', value: formatCurrency(data.variableCosts) },
          { label: 'Costo personale', value: formatCurrency(data.staffCost), extra: `${formatPercent(staffPercent)} dei ricavi` },
          { label: 'Ore extra personale', value: `${data.totalExtraHours}h`, extra: `${data.totalOrdinaryHours}h ordinarie` },
        ].map((item) => (
          <div key={item.label} className="stat-card">
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className="text-xl font-bold text-gray-900">{item.value}</p>
            {item.extra && <p className="text-xs text-gray-400 mt-0.5">{item.extra}</p>}
          </div>
        ))}
      </div>

      {/* Grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ricavi per categoria */}
        <div className="card p-5">
          <h2 className="section-title">Ricavi per categoria</h2>
          {revData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={revData} cx="50%" cy="50%" outerRadius={85} dataKey="value" paddingAngle={2}>
                  {revData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Nessun dato ricavi</div>
          )}
        </div>

        {/* Costi per categoria */}
        <div className="card p-5">
          <h2 className="section-title">Costi per categoria</h2>
          {costData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={costData} layout="vertical" margin={{ left: 100, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {costData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Nessun dato costi</div>
          )}
        </div>
      </div>

      {/* Tabella riepilogo */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="section-title mb-0">Riepilogo costi per categoria</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Importo</th>
              <th>% sui ricavi</th>
              <th>% sui costi</th>
            </tr>
          </thead>
          <tbody>
            {costData.map((item) => (
              <tr key={item.name}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                </td>
                <td className="font-semibold">{formatCurrency(item.value)}</td>
                <td className={cn('font-medium', data.totalRevenue > 0 && item.value / data.totalRevenue > 0.3 ? 'text-red-600' : 'text-gray-600')}>
                  {data.totalRevenue > 0 ? formatPercent(item.value / data.totalRevenue) : '—'}
                </td>
                <td>{data.totalCosts > 0 ? formatPercent(item.value / data.totalCosts) : '—'}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-bold">
              <td>Totale costi</td>
              <td>{formatCurrency(data.totalCosts)}</td>
              <td>{data.totalRevenue > 0 ? formatPercent(data.totalCosts / data.totalRevenue) : '—'}</td>
              <td>100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
