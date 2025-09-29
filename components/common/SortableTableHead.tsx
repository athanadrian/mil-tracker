'use client';

import * as React from 'react';
import { TableHead } from '@/components/ui/table';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc';

export type SortState<F extends string = string> = {
  field: F;
  direction: SortDirection;
};

export type SortableTableHeadProps<F extends string = string> = {
  label: React.ReactNode;
  field: F;
  sort?: SortState<F> | null;
  onSort?: (field: F) => void;
  alignRight?: boolean;
  className?: string;
};

function SortableTableHead<F extends string = string>({
  label,
  field,
  sort,
  onSort,
  alignRight = false,
  className,
}: SortableTableHeadProps<F>): React.JSX.Element {
  const isActive = !!sort && sort.field === field;
  const dir: SortDirection = sort?.direction === 'asc' ? 'asc' : 'desc';

  const ariaSort: React.AriaAttributes['aria-sort'] = isActive
    ? dir === 'asc'
      ? 'ascending'
      : 'descending'
    : 'none';

  return (
    <TableHead
      className={cn(
        'cursor-pointer select-none',
        alignRight && 'text-right',
        className
      )}
      onClick={() => onSort?.(field)}
      aria-sort={ariaSort}
    >
      <span className='inline-flex items-center'>
        {label}
        {isActive ? (
          dir === 'asc' ? (
            <AppIcon icon={appIcons.chevronUp} size={16} className='ml-1' />
          ) : (
            <AppIcon icon={appIcons.chevronDown} size={16} className='ml-1' />
          )
        ) : null}
      </span>
    </TableHead>
  );
}

export default SortableTableHead;
