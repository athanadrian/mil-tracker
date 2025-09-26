import React from 'react';
import ThemeSelector from './ThemeSelector';
import AccountLinks from './AccountLinks';

const Navbar = () => {
  return (
    <nav className='p-4 flex items-center justify-between sticky top-0 bg-background z-0 border-b'>
      {/* LEFT */}
      {/* <SidebarTrigger /> */}Trigger
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
