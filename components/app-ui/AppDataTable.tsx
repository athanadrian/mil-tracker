'use client';

import * as React from 'react';
import {
  ColumnDef,
  VisibilityState,
  SortingState,
  OnChangeFn,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { AppIcon, AppSelect } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { cn } from '@/lib/utils';

type Props<TData> = {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  className?: string;

  /** Για σωστή αρίθμηση όταν γίνεται external pagination */
  baseIndex?: number;

  /** Sorting: client (default) ή manual/server */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  manualSorting?: boolean;

  /** Αρχική ορατότητα στηλών (id -> visible?) */
  initialVisibility?: VisibilityState;

  /** Pages-only pagination (client ή server) */
  pageIndex?: number; // 0-based
  pageSize?: number;
  onPageIndexChange?: (idx: number) => void;
  onPageSizeChange?: (size: number) => void;
  manualPagination?: boolean; // true όταν τις σελίδες τις δίνει ο server
  totalCount?: number; // για server pagination (υπολογισμός pageCount)
  pageSizeOptions?: number[]; // default [10, 25, 50, 100]
};

export function AppDataTable<TData>({
  data,
  columns,
  className,
  baseIndex = 0,

  // sorting
  sorting,
  onSortingChange,
  manualSorting = false,

  // columns
  initialVisibility,

  // pagination
  pageIndex: controlledPageIndex,
  pageSize: controlledPageSize,
  onPageIndexChange,
  onPageSizeChange,
  manualPagination = false,
  totalCount,
  pageSizeOptions = [10, 25, 50, 100],
}: Props<TData>) {
  /* ---------------------------- Column visibility ---------------------------- */
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialVisibility || {});

  /* -------------------------------- Sorting --------------------------------- */
  const [localSorting, setLocalSorting] = React.useState<SortingState>([]);
  const handleSortingChange: OnChangeFn<SortingState> =
    manualSorting && onSortingChange ? onSortingChange : setLocalSorting;

  /* -------------------------------- Pagination ------------------------------- */
  const [localPageIndex, setLocalPageIndex] = React.useState(0);
  const [localPageSize, setLocalPageSize] = React.useState(
    pageSizeOptions[0] ?? 10
  );

  // controlled vs uncontrolled
  const pageIndex = controlledPageIndex ?? localPageIndex;
  const pageSize = controlledPageSize ?? localPageSize;

  const setPageIndex = (idx: number) => {
    onPageIndexChange ? onPageIndexChange(idx) : setLocalPageIndex(idx);
  };

  const setPageSize = (size: number) => {
    onPageSizeChange ? onPageSizeChange(size) : setLocalPageSize(size);
    setPageIndex(0); // reset στη 1η σελίδα όταν αλλάζει το μέγεθος
  };

  // Σταθεροποιούμε refs για data/columns
  const dataMemo = React.useMemo(() => data, [data]);
  const columnsMemo = React.useMemo(() => columns, [columns]);

  /* --------------------------------- Table ---------------------------------- */
  const table = useReactTable({
    data: dataMemo,
    columns: columnsMemo,
    state: {
      columnVisibility,
      sorting: manualSorting ? sorting ?? [] : localSorting,
      pagination: { pageIndex, pageSize },
    },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: handleSortingChange,

    // Σωστό propagate αλλαγών pagination σε controlled/uncontrolled setters
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex, pageSize })
          : updater;
      if (typeof next.pageIndex === 'number') setPageIndex(next.pageIndex);
      if (typeof next.pageSize === 'number') setPageSize(next.pageSize);
    },

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getPaginationRowModel: manualPagination
      ? undefined
      : getPaginationRowModel(),

    manualSorting,
    manualPagination,

    // Όταν manual pagination, δώσε pageCount (απαραίτητο για σωστή πλοήγηση)
    pageCount:
      manualPagination && typeof totalCount === 'number'
        ? Math.max(1, Math.ceil(totalCount / pageSize))
        : undefined,

    // Pass meta (για index column)
    meta: { baseIndex },
    autoResetPageIndex: false,
    //autoResetSorting: false,
    autoResetExpanded: false,
  });

  const totalPages = table.getPageCount() || 1;
  const canPrev = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();

  const goPrev = () => {
    const next = Math.max(0, pageIndex - 1);
    if (next !== pageIndex) setPageIndex(next);
  };

  const goNext = () => {
    const next = Math.min(totalPages - 1, pageIndex + 1);
    if (next !== pageIndex) setPageIndex(next);
  };

  React.useEffect(() => {
    const pageCount = Math.max(1, Math.ceil(data.length / pageSize));
    if (pageIndex > pageCount - 1) onPageIndexChange?.(pageCount - 1);
  }, [data.length, pageSize]);

  return (
    <div className={cn('rounded-md border overflow-x-auto', className)}>
      {/* Toolbar: Page size + Column visibility */}
      <div className='flex flex-wrap items-center justify-end gap-2 p-2'>
        <AppSelect
          value={String(pageSize)}
          onChange={(v: any) => {
            const raw = typeof v === 'object' ? v?.value ?? v?.id : v;
            const num = Number(raw);
            if (!Number.isFinite(num) || num < 1) return;
            setPageSize(num);
          }}
          options={pageSizeOptions.map((n) => ({
            id: String(n),
            value: n,
            label: `${n}/σελίδα`,
          }))}
          showSelect
          className='w-[140px]'
          placeholder='Μέγεθος'
          getLabel={(o: any) => o.label}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm'>
              <AppIcon icon={appIcons.table} size={14} className='mr-1' />
              Κολώνες
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-44'>
            {table
              .getAllLeafColumns()
              .filter((c) => c.getCanHide())
              .map((col) => {
                const label =
                  typeof col.columnDef.header === 'function'
                    ? col.id
                    : String(col.columnDef.header ?? col.id);
                return (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                    className='capitalize'
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id} style={{ width: h.getSize() }}>
                  {h.isPlaceholder ? null : h.column.getCanSort() ? (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 px-1 -ml-2 inline-flex items-center gap-1'
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {{
                        asc: <AppIcon icon={appIcons.chevronUp} size={14} />,
                        desc: <AppIcon icon={appIcons.chevronDown} size={14} />,
                      }[h.column.getIsSorted() as 'asc' | 'desc'] ?? (
                        <AppIcon
                          icon={appIcons.sort}
                          size={12}
                          className='text-muted-foreground'
                        />
                      )}
                    </Button>
                  ) : (
                    flexRender(h.column.columnDef.header, h.getContext())
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className='align-top'>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  style={{ width: cell.column.getSize() }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}

          {data.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className='text-center text-sm text-muted-foreground'
              >
                Χωρίς δεδομένα
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Footer pagination controls */}
      <div className='flex items-center justify-center gap-2 p-2'>
        {/* <Button
          variant='outline'
          size='icon'
          onClick={() => table.previousPage()}
          disabled={!canPrev}
          aria-label='Προηγούμενη σελίδα'
        > */}
        <Button
          variant='outline'
          size='icon'
          onClick={goPrev}
          disabled={pageIndex === 0}
        >
          <AppIcon icon={appIcons.chevronLeft} size={16} />
        </Button>

        {/* <span className='text-sm'>
          Σελίδα {table.getState().pagination.pageIndex + 1} από {totalPages}
        </span> */}
        <span className='text-sm'>
          Σελίδα {pageIndex + 1} από {totalPages}
        </span>

        {/* <Button
          variant='outline'
          size='icon'
          onClick={() => table.nextPage()}
          disabled={!canNext}
          aria-label='Επόμενη σελίδα'
        > */}
        <Button
          variant='outline'
          size='icon'
          onClick={goNext}
          disabled={pageIndex >= totalPages - 1}
        >
          <AppIcon icon={appIcons.chevronRight} size={16} />
        </Button>
      </div>
    </div>
  );
}

export default AppDataTable;
