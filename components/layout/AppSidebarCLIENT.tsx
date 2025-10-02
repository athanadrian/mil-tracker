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

const AdminSidebarCLIENT = ({ counts }: { counts: AdminCounts }) => {
  console.log('counts', counts);
  const groups = React.useMemo<Grouped>(() => {
    return lookUpDataLinks.reduce<Grouped>(
      (acc, link) => {
        acc[link.type].push(link);
        return acc;
      },
      { personnel: [], documents: [], application: [] }
    );
  }, []);

  function hasCountKey(
    link: AdminNavLink
  ): link is AdminNavLink & { countKey: keyof AdminCounts } {
    return typeof link.countKey !== 'undefined';
  }

  return (
    <SidebarContent className='scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 w-[220px]'>
      {/* Εφαρμογή */}
      <SidebarGroup>
        {/* <SidebarGroupLabel>Εφαρμογή</SidebarGroupLabel> */}
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
  );
};
export default AdminSidebarCLIENT;
