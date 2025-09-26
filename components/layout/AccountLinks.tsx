'use client';
import Link from 'next/link';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { navLinks } from '@/constants/links';
import { UserIcon } from '@/components/layout';

const AccountLinks = () => {
  const imageUrl = null; // Replace with actual user image URL if available
  return (
    <>
      {' '}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' className='flex gap-4 max-w-[100px]'>
            <AppIcon icon={appIcons.menu} size={24} className='w-6 h-6' />
            <UserIcon imageUrl={imageUrl} />
            <span className='sr-only'>open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-52' align='start' sideOffset={10}>
          <>
            {navLinks.map((link) => (
              <DropdownMenuItem key={link.href}>
                <Link
                  href={link.href}
                  className='flex items-center gap-3 capitalize w-full'
                  aria-label={link.accessibility}
                >
                  <AppIcon
                    icon={link.icon}
                    size={18}
                    srText={link.accessibility}
                  />
                  {link.label}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default AccountLinks;
