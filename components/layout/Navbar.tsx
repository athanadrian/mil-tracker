'use client';
import { usePathname, useSearchParams } from 'next/navigation';

import ThemeSelector from './ThemeSelector';
import AccountLinks from './AccountLinks';
import { SidebarTrigger } from '@/components/ui/sidebar';

const Navbar = () => {
  const pathname = usePathname(); // π.χ. /personnel/create
  const searchParams = useSearchParams(); // π.χ. ?edit=123
  const query = searchParams.toString(); // "edit=123"
  const fullPath = query ? `${pathname}?${query}` : pathname;

  return (
    <nav className='h-[65px] ml-[1px] p-4 flex items-center justify-between sticky top-0 bg-background z-20 border-b'>
      <SidebarTrigger />
      <div className='text-base font-semibold text-center'>{fullPath}</div>
      {/* LEFT */}
      {/* RIGHT */}
      <div className='flex items-center gap-4'>
        {/* THEME MENU */}
        <ThemeSelector />
        <AccountLinks />
      </div>
    </nav>
  );
};

export default Navbar;
