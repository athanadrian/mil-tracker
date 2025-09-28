'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AppIcon, AppIconProps } from '@/components/app-ui';

type EmptyStateProps = {
  icon?: AppIconProps['icon'];
  label: string;
  className?: string;
};

const EmptyState = ({ icon, label, className }: EmptyStateProps) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground',
        className
      )}
    >
      {icon ? <AppIcon icon={icon} /> : null}
      <span>Δεν βρέθηκαν {label}.</span>
    </div>
  );
};

export default EmptyState;
