import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const HeaderSkeleton = ({ className = '' }: { className?: string }) => {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div className='flex-1'>
        <Skeleton className='h-6 w-40' />
        <div className='mt-2 flex gap-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-4 w-16' />
        </div>
      </div>
      <div className='hidden sm:flex gap-3'>
        <div className='rounded-md border bg-muted/30 px-3 py-2'>
          <Skeleton className='h-3 w-14' />
          <Skeleton className='mt-2 h-4 w-10' />
        </div>
        <div className='rounded-md border bg-muted/30 px-3 py-2'>
          <Skeleton className='h-3 w-14' />
          <Skeleton className='mt-2 h-4 w-10' />
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Skeleton className='h-9 w-40' />
        <Skeleton className='h-9 w-9 rounded-md' />
      </div>
    </div>
  );
};
export default HeaderSkeleton;
