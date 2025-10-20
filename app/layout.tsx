import { ReactNode } from 'react';
import { Noto_Sans, JetBrains_Mono } from 'next/font/google';
import { cookies } from 'next/headers';

import { getSidebarCounts } from '@/actions/common.actions';
import { Toaster } from '@/components/common';
import { AppSidebar, MainLayout, Navbar } from '@/components/layout';
import dynamic from 'next/dynamic';
import { ThemeProvider } from '@/providers/theme-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppDataProvider } from '@/providers/AdminDataProvider';
import { AdminCounts } from '@/types/nav';
import './globals.css';
import InsetWithOffset from '@/components/layout/InsetWithOffset';

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

const RootLayout = async ({ children }: { children: ReactNode }) => {
  const [cookieStore, counts] = await Promise.all([
    cookies(),
    getSidebarCounts(),
  ]);

  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  const initial = { counts };
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
          {/* <AppDataProvider initial={initial}>
            <SidebarProvider defaultOpen={defaultOpen}> */}
          {/* <MainLayout
            children={children}
            initial={initial}
            defaultOpen={defaultOpen}
          /> */}
          <AppDataProvider initial={initial}>
            <SidebarProvider defaultOpen={defaultOpen}>
              <AppSidebar />
              <main className='w-full'>
                <InsetWithOffset>
                  <Navbar />
                  <div className='px-2 py-4'>{children}</div>
                </InsetWithOffset>
              </main>
            </SidebarProvider>
          </AppDataProvider>
          {/* </SidebarProvider>
          </AppDataProvider>*/}
        </ThemeProvider>
        <Toaster richColors />
      </body>
    </html>
  );
};
export default RootLayout;
