'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, AlertTriangle, Euro, Users,
  ShoppingCart, Receipt, ArrowRight, RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DashboardData {
  current: {
    totalRevenue: number;
    totalCosts: number;
    staffCost: number;
    netResult: number;
    revenueByCategory: Record<string, number>;
    costsByCategory: Record<string, number>;
  };
  prev: {
    totalRevenue: number;
    totalCosts: number;
    netResult: number;
  };
  trend: { month: string; ricavi: number; costi: number; netto: number }[];
  unresolvedCount: number;
  extraHours: number;
  insights: string[];
  categories: { id: string; name: string; type: string; color: string }[];
}

function DeltaBadge({ current, prev }: { current: number; prev: number }) {
  if (prev === 0) return null;
  const delta = ((current - prev) / Math.abs(prev)) * 100;
  const up = delta >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${up ? 'text-green-600' : 'text-red-600'}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-brand-600" size={32} />
      </div>
    );
  }

  if (!data) return <div className="alert-error">Errore nel caricamento dei dati.</div>;

  const { current, prev, trend, unresolvedCount, extraHours, insights, categories } = data;

  const getCatName = (id: string) => categories.find((c) => c.id === id)?.name || id;
  const getCatColor = (id: string) => categories.find((c) => c.id === id)?.color || '#94a3b8';

  const revenuePieData = Object.entries(current.revenueByCategory).map(([id, val]) => ({
    name: getCatName(id),
    value: val,
    color: getCatColor(id),
  })).filter((d) => d.value > 0);

  const costPieData = Object.entries(current.costsByCategory).map(([id, val]) => ({
    name: getCatName(id),
    value: parseFloat(val.toFixed(2)),
    color: getCatColor(id),
  })).filter((d) => d.value > 0);

  const now = new Date();
  const monthLabel = now.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Situazione economica — {monthLabel}</p>
        </div>
        {unresolvedCount > 0 && (
          <Link href="/classificazione">
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors">
              <AlertTriangle size={16} />
              {unresolvedCount} prodotti da classificare
              <ArrowRight size={14} />
            </div>
          </Link>
        )}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {insights.map((insight, i) => (
            <div key={i} className="alert-warning text-sm">
              {insight}
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ricavi totali</p>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(current.totalRevenue)}</p>
          <div className="mt-1">
            <DeltaBadge current={current.totalRevenue} prev={prev.totalRevenue} />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Costi totali</p>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Receipt size={16} className="text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(current.totalCosts)}</p>
          <div className="mt-1">
            <DeltaBadge current={current.totalCosts} prev={prev.totalCosts} />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Risultato netto</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${current.netResult >= 0 ? 'bg-brand-100' : 'bg-red-100'}`}>
              <Euro size={16} className={current.netResult >= 0 ? 'text-brand-600' : 'text-red-600'} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${current.netResult >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {formatCurrency(current.netResult)}
          </p>
          <div className="mt-1">
            <DeltaBadge current={current.netResult} prev={prev.netResult} />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Costo personale</p>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(current.staffCost)}</p>
          {extraHours > 0 && (
            <p className="text-xs text-orange-600 mt-1">{extraHours}h extra questo mese</p>
          )}
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend */}
        <div className="card p-5">
          <h2 className="section-title">Andamento ricavi / costi (6 mesi)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `€${v}`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="ricavi" stroke="#10b981" strokeWidth={2} dot={false} name="Ricavi" />
              <Line type="monotone" dataKey="costi" stroke="#ef4444" strokeWidth={2} dot={false} name="Costi" />
              <Line type="monotone" dataKey="netto" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Netto" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ricavi per categoria */}
        <div className="card p-5">
          <h2 className="section-title">Ricavi per categoria</h2>
          {revenuePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={revenuePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {revenuePieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Nessun dato ricavi per questo mese.
              <Link href="/vendite" className="ml-1 text-brand-600 hover:underline">Importa vendite</Link>
            </div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Costi per categoria */}
        <div className="card p-5">
          <h2 className="section-title">Costi per categoria</h2>
          {costPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={costPieData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {costPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Nessun costo registrato per questo mese.
            </div>
          )}
        </div>

        {/* Azioni rapide */}
        <div className="card p-5">
          <h2 className="section-title">Azioni rapide</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/fatture" className="p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-all text-center group">
              <Receipt size={24} className="mx-auto mb-2 text-gray-400 group-hover:text-brand-600" />
              <p className="text-sm font-medium text-gray-700">Carica fattura</p>
            </Link>
            <Link href="/spese" className="p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all text-center group">
              <Euro size={24} className="mx-auto mb-2 text-gray-400 group-hover:text-green-600" />
              <p className="text-sm font-medium text-gray-700">Aggiungi spesa</p>
            </Link>
            <Link href="/vendite" className="p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-center group">
              <ShoppingCart size={24} className="mx-auto mb-2 text-gray-400 group-hover:text-purple-600" />
              <p className="text-sm font-medium text-gray-700">Importa vendite</p>
            </Link>
            <Link href="/personale" className="p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-center group">
              <Users size={24} className="mx-auto mb-2 text-gray-400 group-hover:text-orange-600" />
              <p className="text-sm font-medium text-gray-700">Inserisci ore</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
