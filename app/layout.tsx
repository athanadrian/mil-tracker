import { ReactNode } from 'react';
import './globals.css';

export const metadata = { title: 'Military Asset Tracker' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='min-h-screen bg-background text-foreground'>
        <div className='mx-auto max-w-7xl p-4'>{children}</div>
      </body>
    </html>
  );
}
