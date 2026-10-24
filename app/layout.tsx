import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Instrument_Sans, Spline_Sans_Mono } from 'next/font/google';
import './globals.css';

const display = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600', '700'], style: ['normal', 'italic'], variable: '--f-display' });
const texto = Instrument_Sans({ subsets: ['latin'], variable: '--f-texto' });
const mono = Spline_Sans_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--f-mono' });

export const metadata: Metadata = {
  title: 'Ateliê de Costura',
  description: 'Gestão de ordens de serviço, agenda de entregas e caixa do ateliê.',
  icons: { icon: '/logo.jpeg' },
};

export const viewport: Viewport = { themeColor: '#2a1b38' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${texto.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
