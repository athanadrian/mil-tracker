'use client';

import * as React from 'react';
import Link from 'next/link';
import type { UrlObject } from 'url';

import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AppIcon } from '@/components/app-ui';
import type { IconLike } from '@/components/app-ui';

export interface CollapsibleMenuItemProps {
  href: UrlObject;
  icon: IconLike;
  label: string;
  accessibility?: string;
  badge?: number | null;
  prefetch?: boolean;
}

const CollapsibleMenuItem: React.FC<CollapsibleMenuItemProps> = ({
  href,
  icon,
  label,
  accessibility,
  prefetch = true,
  badge = 0,
}) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const IconWithBadge = (
    <span className='relative inline-flex'>
      <AppIcon icon={icon} size={18} srText={accessibility} />
      {isCollapsed && !!badge && badge > 0 && (
        <span
          aria-label={`${badge} notifications`}
          className='absolute -right-1 -top-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center shadow-sm'
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </span>
  );

  const Button = (
    <SidebarMenuButton asChild>
      <Link
        href={href}
        className='flex items-center gap-2'
        aria-label={accessibility}
        prefetch={prefetch}
      >
        {IconWithBadge}
        <span className='truncate'>{label}</span>
      </Link>
    </SidebarMenuButton>
  );

  return (
    <SidebarMenuItem>
      {isCollapsed ? (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>{Button}</TooltipTrigger>
            <TooltipContent side='right' align='center'>
              {label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        Button
      )}

      {!isCollapsed && !!badge && badge > 0 && (
        <SidebarMenuBadge>{badge > 999 ? '999+' : badge}</SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
};

export default CollapsibleMenuItem;
