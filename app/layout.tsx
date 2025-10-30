import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ShiftSmart API',
  description: 'Backend API for Reuters Breaking News shift scheduling',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
