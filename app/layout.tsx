import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LocaleManager – Gestione Bar & Ristorante',
  description: 'Sistema di gestione economica e operativa per bar e ristoranti',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
