import ThemeSelector from './ThemeSelector';
import AccountLinks from './AccountLinks';
import { SidebarTrigger } from '@/components/ui/sidebar';

const Navbar = () => {
  return (
    <nav className='h-[65px] ml-[1px] p-4 flex items-center justify-between sticky top-0 bg-background z-20 border-b'>
      {/* LEFT */}
      <SidebarTrigger />
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
