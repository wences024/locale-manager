'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Receipt, ShoppingCart, Package, Users,
  FileText, AlertTriangle, Warehouse, Settings, BookOpen,
  Truck, PlusCircle, BarChart3, Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'Principale',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/report', label: 'Report mensili', icon: BarChart3 },
    ],
  },
  {
    label: 'Acquisti e costi',
    items: [
      { href: '/fatture', label: 'Fatture acquisti', icon: Receipt },
      { href: '/spese', label: 'Spese manuali', icon: PlusCircle },
      { href: '/classificazione', label: 'Da classificare', icon: AlertTriangle, badge: true },
    ],
  },
  {
    label: 'Vendite',
    items: [
      { href: '/vendite', label: 'Vendite', icon: ShoppingCart },
    ],
  },
  {
    label: 'Inventario e prodotti',
    items: [
      { href: '/inventario', label: 'Inventario', icon: Warehouse },
      { href: '/fornitori', label: 'Fornitori', icon: Truck },
    ],
  },
  {
    label: 'Personale',
    items: [
      { href: '/personale', label: 'Personale', icon: Users },
    ],
  },
  {
    label: 'Configurazione',
    items: [
      { href: '/regole', label: 'Regole AI', icon: Brain },
      { href: '/categorie', label: 'Categorie', icon: BookOpen },
      { href: '/impostazioni', label: 'Impostazioni', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-lg shrink-0">
            🍽️
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">LocaleManager</p>
            <p className="text-xs text-gray-400">Bar & Ristorante</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-3 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'sidebar-link',
                      active ? 'sidebar-link-active' : 'sidebar-link-inactive'
                    )}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">v0.1.0 · 2024</p>
      </div>
    </aside>
  );
}
