import { ReactNode } from 'react';
import { Noto_Sans, JetBrains_Mono } from 'next/font/google';

import { AppSidebar, Navbar } from '@/components/layout';
import { ThemeProvider } from '@/providers/theme-provider';
import './globals.css';

export const metadata = { title: 'Military Asset Tracker' };

export const notoSans = Noto_Sans({
  variable: '--font-geist-sans',
  subsets: ['latin', 'latin-ext', 'greek', 'greek-ext'],
  display: 'swap',
  weight: ['400', '500', '600', '700'], // ό,τι χρειάζεσαι
});

export const jetMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'latin-ext', 'greek'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${notoSans.variable} ${jetMono.variable} antialiased flex`}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <AppSidebar />
          <main className='w-full'>
            <Navbar />
            <div className='px-4'>{children}</div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
