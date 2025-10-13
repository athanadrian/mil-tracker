'use client';

import { TableHead } from '@/components/ui/table';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { cn } from '@/lib/utils';
import { memo } from 'react';

type Dir = 'asc' | 'desc';

function nextDir(cur?: Dir): Dir {
  return cur === 'asc' ? 'desc' : 'asc';
}

export type SortableThProps = {
  label: string;
  field: string;
  /** Όνομα πεδίου που είναι ενεργό */
  sortBy?: string;
  /** Κατεύθυνση τρέχοντος sort */
  sortDir?: Dir;
  /**
   * Callback sorting. Αν δώσεις μόνο (field), το component θα κάνει
   * εσωτερικό toggle και θα καλέσει με (field, nextDir).
   */
  onSort: (field: string, dir: Dir) => void;

  /** Στοίχιση: left|center|right */
  align?: 'left' | 'center' | 'right';
  /** Δείξε idle icon όταν δεν είναι active */
  showIdleIcon?: boolean;
  className?: string;
};

const SortableTh = memo(function SortableTh({
  label,
  field,
  sortBy,
  sortDir,
  onSort,
  align = 'left',
  showIdleIcon = false,
  className,
}: SortableThProps) {
  const active = sortBy === field;
  const dir: Dir = active ? sortDir || 'asc' : 'asc';

  const alignClass =
    align === 'right'
      ? 'text-right'
      : align === 'center'
      ? 'text-center'
      : 'text-left';

  const handleClick = () => {
    // Αν ο γονιός υποστηρίζει δεύτερο arg, του περνάμε dir,
    // αλλιώς αρκεί το field και κάνει ο ίδιος toggle.
    const next = active ? nextDir(sortDir) : 'asc';
    // Κάλεσέ το ΠΑΝΤΑ με (field, next) για καθαρότητα
    onSort(field, next);
  };

  return (
    <TableHead
      className={cn('select-none', alignClass, className)}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type='button'
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-1 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
          alignClass
        )}
        title={`Sort by ${label}`}
      >
        <span>{label}</span>
        {active ? (
          dir === 'asc' ? (
            <AppIcon icon={appIcons.chevronUp} size={16} />
          ) : (
            <AppIcon icon={appIcons.chevronDown} size={16} />
          )
        ) : showIdleIcon ? (
          <AppIcon
            icon={appIcons.sort}
            size={14}
            className='text-muted-foreground'
          />
        ) : null}
      </button>
    </TableHead>
  );
});
export default SortableTh;
