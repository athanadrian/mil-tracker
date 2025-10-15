'use client';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import InsetWithOffset from './InsetWithOffset';
import { ThemeProvider } from '@/providers/theme-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppDataProvider } from '@/providers/AdminDataProvider';
import { AdminCounts } from '@/types/nav';
//import { AppSidebar } from '.';

const AppSidebar = dynamic(() => import('@/components/layout/AppSidebar'), {
  ssr: false,
});

const Navbar = dynamic(() => import('@/components/layout/Navbar'), {
  ssr: false,
});

type MainLayoutProps = {
  children: ReactNode;
  initial: { counts: AdminCounts };
  defaultOpen: boolean;
};

const MainLayout = ({ children, initial, defaultOpen }: MainLayoutProps) => {
  return (
    <>
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
    </>
  );
};

export default MainLayout;
