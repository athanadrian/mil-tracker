'use client';

import * as React from 'react';
import type { ComponentProps } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/app-ui';

// Πάρε ακριβώς τον τύπο του prop "icon" από το AppIcon
type AppIconProps = ComponentProps<typeof AppIcon>;
type Href = ComponentProps<typeof Link>['href'];

export interface StatProps {
  icon: AppIconProps['icon']; // ✅ ίδιος τύπος με του AppIcon
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** αν δοθεί, το card γίνεται link */
  href?: Href;
  /** αν δεν έχει href, μπορείς να περάσεις onClick */
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
  /** default 16 */
  iconSize?: number;
}

const Stat = ({
  icon,
  label,
  value,
  hint,
  href,
  onClick,
  className,
  iconClassName,
  iconSize = 20,
}: StatProps) => {
  const CardInner = (
    <div
      className={cn(
        'rounded-lg p-4 border bg-muted/30 transition-colors',
        href && 'hover:bg-muted/40 focus-visible:outline-none',
        className
      )}
    >
      <div className='flex items-center gap-2 text-muted-foreground text-sm'>
        <AppIcon icon={icon} size={iconSize} className={iconClassName} />
        <span className='truncate'>{label}</span>
      </div>

      <div className='mt-1 text-xl font-semibold'>{value}</div>

      {hint ? (
        <div className='mt-0.5 text-xs text-muted-foreground'>{hint}</div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className='block focus:outline-none group'>
        {CardInner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type='button'
        onClick={onClick}
        className='w-full text-left focus:outline-none'
      >
        {CardInner}
      </button>
    );
  }

  return CardInner;
};

export default Stat;
