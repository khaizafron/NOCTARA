import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NOCTARA — Private Autonomous Digital World',
  description: 'Single-User Living AI Environment for ROOT (Khai)'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#08090d] text-zinc-100 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
