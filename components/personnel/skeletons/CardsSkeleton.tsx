import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const CardsSkeleton = ({
  cards = 8,
  className = '',
}: {
  cards?: number;
  className?: string;
}) => {
  const items = Array.from({ length: Math.max(1, cards) });
  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {items.map((_, i) => (
        <Card key={i} className='overflow-hidden'>
          <CardHeader className='pb-2 space-y-2'>
            <Skeleton className='h-4 w-1/2' />
            <Skeleton className='h-3 w-20' />
          </CardHeader>
          <CardContent className='space-y-3'>
            <Skeleton className='h-3 w-3/4' />
            <Skeleton className='h-3 w-2/3' />
            <Skeleton className='h-3 w-1/2' />
            <div className='pt-2 flex justify-end gap-2'>
              <Skeleton className='h-8 w-8 rounded-md' />
              <Skeleton className='h-8 w-8 rounded-md' />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
export default CardsSkeleton;
