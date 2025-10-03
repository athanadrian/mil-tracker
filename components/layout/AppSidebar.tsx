'use client';

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
import { useCounts } from '@/providers/AdminDataProvider';

const AdminSidebar = () => {
  const { counts } = useCounts();

  const groups = React.useMemo<Grouped>(() => {
    return lookUpDataLinks.reduce<Grouped>(
      (acc, link) => {
        acc[link.type].push(link);
        return acc;
      },
      { database: [], personnel: [], documents: [], application: [] }
    );
  }, []);

  function hasCountKey(
    link: AdminNavLink
  ): link is AdminNavLink & { countKey: keyof AdminCounts } {
    return typeof link.countKey !== 'undefined';
  }

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

      <SidebarContent className='scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 w-[220px]'>
        {/* Εφαρμογή */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminLinks.map((link) => (
                <CollapsibleMenuItem
                  key={link.label}
                  href={link.href}
                  icon={link.icon}
                  label={link.label}
                  badge={
                    hasCountKey(link) ? counts[link.countKey] ?? 0 : undefined
                  }
                  accessibility={link.accessibility}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className='flex items-center justify-between'>
            <span>Βάση Δεδομένων</span>
            <AppIcon
              icon={appIcons.database}
              className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180'
            />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {groups.database.map((link) => (
                <CollapsibleMenuItem
                  key={link.label}
                  href={link.href}
                  icon={link.icon}
                  label={link.label}
                  badge={
                    hasCountKey(link) ? counts[link.countKey] ?? 0 : undefined
                  }
                  accessibility={link.accessibility}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Προσωπικό */}
        <Collapsible defaultOpen className='group/collapsible'>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className='flex items-center justify-between'>
                <span>Προσωπικό</span>
                <AppIcon
                  icon={appIcons.chevronDown}
                  className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180'
                />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groups.personnel.map((link) => (
                    <CollapsibleMenuItem
                      key={link.value ?? link.label}
                      href={link.href}
                      icon={link.icon}
                      label={link.label}
                      badge={
                        link.countKey ? counts[link.countKey] ?? 0 : undefined
                      }
                      accessibility={link.accessibility}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Έγγραφα */}
        <Collapsible defaultOpen className='group/collapsible'>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className='flex items-center justify-between'>
                <span>Έγγραφα</span>
                <AppIcon
                  icon={appIcons.chevronDown}
                  className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180'
                />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groups.documents.map((link) => (
                    <CollapsibleMenuItem
                      key={link.value ?? link.label}
                      href={link.href}
                      icon={link.icon}
                      label={link.label}
                      badge={
                        link.countKey ? counts[link.countKey] ?? 0 : undefined
                      }
                      accessibility={link.accessibility}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Εφαρμογή */}
        <Collapsible defaultOpen className='group/collapsible'>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className='flex items-center justify-between'>
                <span>Εφαρμογή</span>
                <AppIcon
                  icon={appIcons.chevronDown}
                  className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180'
                />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groups.application.map((link) => (
                    <CollapsibleMenuItem
                      key={link.value ?? link.label}
                      href={link.href}
                      icon={link.icon}
                      label={link.label}
                      badge={
                        link.countKey ? counts[link.countKey] ?? 0 : undefined
                      }
                      accessibility={link.accessibility}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
};
export default AdminSidebar;
