import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { CollapsibleMenuItem } from '@/components/layout';
import { adminLinks, lookUpDataLinks } from '@/constants/links';
import { AdminCounts, AdminNavLink, Grouped } from '@/types/nav';
import AppSidebarCLIENT from './AppSidebarCLIENT';
import { getSidebarCounts } from '@/actions/common.actions';

const AppSidebarSRV = async () => {
  const [counts] = await Promise.all([getSidebarCounts()]);
  return (
    <Sidebar
      collapsible='icon'
      className='group/sidebar [--sidebar-width:300px] [--sidebar-width-icon:64px] mb-5'
    >
      <SidebarHeader className='py-4'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                href={{ pathname: '/' }}
                className='
                  flex items-center gap-2 overflow-visible
                  group-data-[state=collapsed]/sidebar:justify-center
                '
              >
                {/* LOGO WRAPPER: σταθερό μέγεθος, χωρίς shrink/overflow */}
                <span className='relative h-[30px] w-[30px] shrink-0 overflow-visible'>
                  <Image
                    src='/images/icon.png'
                    alt='logo'
                    fill
                    sizes='30px'
                    className='object-contain !block'
                    // αν έχεις optimizer θέματα σε Electron:
                    // unoptimized
                    priority
                  />
                </span>
                <span
                  className=' text-lg font-medium leading-5
                    truncate
                    transition-all duration-300 ease-in-out
                    group-data-[state=collapsed]/sidebar:opacity-0
                    group-data-[state=collapsed]/sidebar:max-w-0
                    group-data-[state=collapsed]/sidebar:ml-0
                    group-data-[state=expanded]/sidebar:opacity-100
                    group-data-[state=expanded]/sidebar:max-w-[160px]
                    group-data-[state=expanded]/sidebar:ml-2
                  '
                >
                  Mil Tracker
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator className='m-0' />

      <AppSidebarCLIENT counts={counts} />
      <SidebarRail />
    </Sidebar>
  );
};
export default AppSidebarSRV;
