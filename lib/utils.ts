import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(date: string): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateLong(date: string): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function getMonthName(month: number): string {
  return new Date(2024, month - 1, 1).toLocaleDateString('it-IT', { month: 'long' });
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export const STATUS_LABELS: Record<string, string> = {
  pending: 'In attesa',
  ai_classified: 'Classificato da AI',
  user_confirmed: 'Confermato',
  user_corrected: 'Corretto',
  unresolved: 'Da verificare',
  parsing: 'In elaborazione',
  parsed: 'Estratto',
  reviewed: 'In revisione',
  confirmed: 'Confermato',
  error: 'Errore',
  imported: 'Importato',
  preview: 'Anteprima',
  cancelled: 'Annullato',
  resolved: 'Risolto',
  merged: 'Unito',
  auto: 'Automatico',
  manual: 'Manuale',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  ai_classified: 'bg-blue-100 text-blue-800',
  user_confirmed: 'bg-green-100 text-green-800',
  user_corrected: 'bg-purple-100 text-purple-800',
  unresolved: 'bg-red-100 text-red-800',
  parsing: 'bg-blue-100 text-blue-800',
  parsed: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-orange-100 text-orange-800',
  confirmed: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  imported: 'bg-green-100 text-green-800',
  preview: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-800',
  resolved: 'bg-green-100 text-green-800',
  merged: 'bg-purple-100 text-purple-800',
  auto: 'bg-blue-100 text-blue-800',
  manual: 'bg-purple-100 text-purple-800',
};

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + '...';
}
