import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NOCTARA — Private Autonomous Digital World',
  description: 'Single-User Living AI Environment for ROOT (Khai)',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/main-logo.png'
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#030508'
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
