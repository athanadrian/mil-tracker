'use client';
import { SidebarInset, SidebarTrigger, useSidebar } from '../ui/sidebar';

const InsetWithOffset = ({ children }: { children: React.ReactNode }) => {
  const { state } = useSidebar(); // 'expanded' | 'collapsed'
  const pl = state === 'collapsed' ? '16px' : '220px'; // 64px ή 220px

  return (
    <SidebarInset
      // εγγυημένα μετακινεί το header/main δεξιά όσο χρειάζεται
      style={{ paddingLeft: pl }}
      className='transition-[padding-left] duration-200 ease-in-out'
    >
      {children}
    </SidebarInset>
  );
};
export default InsetWithOffset;
