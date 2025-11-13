import type React from 'react';
import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShiftSmart - Reuters Scheduling',
  description: 'Intelligent shift scheduling for Reuters Breaking News team',
  generator: 'v0.app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
