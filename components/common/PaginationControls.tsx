'use client';

import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { cn } from '@/lib/utils';

type PaginationVariant = 'loadMore' | 'pages';

export type PaginationControlsProps = {
  /** 'loadMore' (default) ή 'pages' */
  variant?: PaginationVariant;
  /** Τρέχουσα σελίδα (για 'pages') */
  page: number;
  /** Σύνολο σελίδων (για 'pages') */
  totalPages: number;
  /** Υπάρχουν κι άλλα δεδομένα; (για 'loadMore') */
  hasMore?: boolean;
  /** Πίσω σελίδα (για 'pages') */
  onPrev?: () => void;
  /** Επόμενη σελίδα (για 'pages') */
  onNext?: () => void;
  /** Φέρε περισσότερα (για 'loadMore') */
  onLoadMore?: () => void;
  /** Ενδείκτης φόρτωσης */
  loading?: boolean;
  className?: string;
};

const PaginationControls = ({
  variant = 'loadMore',
  page,
  totalPages,
  hasMore = false,
  onPrev,
  onNext,
  onLoadMore,
  loading = false,
  className,
}: PaginationControlsProps) => {
  if (variant === 'loadMore') {
    if (!hasMore) return null;
    return (
      <div className={cn('flex justify-center mt-3', className)}>
        <Button
          variant='outline'
          onClick={onLoadMore}
          disabled={loading || !onLoadMore}
          className='min-w-[160px]'
        >
          <AppIcon icon={appIcons.chevronDown} size={16} className='mr-2' />
          {loading ? 'Loading…' : 'Φόρτωση Υπολοίπων'}
        </Button>
      </div>
    );
  }

  // variant === 'pages'
  if (totalPages <= 1) return null;

  return (
    <div
      className={cn('flex items-center justify-center gap-2 mt-3', className)}
    >
      <Button
        variant='outline'
        size='icon'
        onClick={onPrev}
        disabled={page === 1 || loading || !onPrev}
        aria-label='Προηγούμενη σελίδα'
      >
        <AppIcon icon={appIcons.chevronLeft} size={16} />
      </Button>

      <span className='text-sm'>
        Σελίδα {page}
        {totalPages > 1 ? ` από ${totalPages}` : hasMore ? ' …' : ''}
      </span>

      <Button
        variant='outline'
        size='icon'
        onClick={onNext}
        disabled={page === totalPages || loading || !onNext}
        aria-label='Επόμενη σελίδα'
      >
        <AppIcon icon={appIcons.chevronRight} size={16} />
      </Button>
    </div>
  );
};

export default PaginationControls;
