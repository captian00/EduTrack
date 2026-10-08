import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { AppProviders } from '@/lib/query/app-providers';

const manrope = Manrope({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'EduTrack',
  description: 'Quản lý lớp học, điểm danh và học phí',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
