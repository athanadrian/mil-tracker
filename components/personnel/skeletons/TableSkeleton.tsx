import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type TableSkeletonProps = {
  rows?: number;
  cells?: number;
  className?: string;
  /** Optional custom header row skeleton. If omitted, a default is rendered. */
  children?: React.ReactNode;
};

const TableSkeleton = ({
  rows = 10,
  cells = 8,
  className = '',
  children,
}: TableSkeletonProps) => {
  const r = Math.max(1, rows);
  const c = Math.max(1, cells);
  const widths = [
    'w-[30%]',
    'w-[15%]',
    'w-[12%]',
    'w-[12%]',
    'w-[10%]',
    'w-[10%]',
    'w-[6%]',
    'w-[5%]',
  ];

  return (
    <div className={cn('rounded-md border overflow-hidden', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {children
              ? children
              : Array.from({ length: c }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton
                      className={cn('h-4', widths[i % widths.length] || 'w-24')}
                    />
                  </TableHead>
                ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: r }).map((_, ri) => (
            <TableRow key={ri} className='hover:bg-transparent'>
              {Array.from({ length: c }).map((__, ci) => (
                <TableCell key={ci}>
                  <Skeleton
                    className={cn('h-4', widths[ci % widths.length] || 'w-20')}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
export default TableSkeleton;
