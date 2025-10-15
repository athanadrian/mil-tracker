// // components/tools/regions/RegionsTable.tsx
// 'use client';

// import * as React from 'react';
// import { Button } from '@/components/ui/button';
// import { AppIcon } from '@/components/app-ui';
// import { appIcons } from '@/constants/app-icons';
// import { RegionDTO } from '@/types/tools/region';

// type Props = {
//   rows: RegionDTO[];
//   onEdit: (row: RegionDTO) => void;
//   onDelete: (row: RegionDTO) => void;
// };

// const RegionsTable = ({ rows, onEdit, onDelete }: Props) => {
//   return (
//     <div className='rounded-md border overflow-x-auto'>
//       <table className='w-full caption-bottom text-sm'>
//         <thead className='bg-muted/50'>
//           <tr className='text-left'>
//             <th className='p-2 w-[36%]'>Όνομα</th>
//             <th className='p-2 w-[24%]'>Code</th>
//             <th className='p-2'>Περιγραφή</th>
//             <th className='p-2 w-[160px] text-right'>Ενέργειες</th>
//           </tr>
//         </thead>
//         <tbody>
//           {rows.length === 0 ? (
//             <tr>
//               <td className='p-3 text-muted-foreground' colSpan={4}>
//                 Δεν υπάρχουν περιοχές.
//               </td>
//             </tr>
//           ) : (
//             rows.map((r) => (
//               <tr key={r.id} className='border-b last:border-b-0'>
//                 <td className='p-2 font-medium'>{r.name}</td>
//                 <td className='p-2'>{r.code ?? '—'}</td>
//                 <td className='p-2'>{r.description ?? '—'}</td>
//                 <td className='p-2'>
//                   <div className='flex justify-end gap-2'>
//                     <Button
//                       variant='outline'
//                       size='sm'
//                       onClick={() => onEdit(r)}
//                     >
//                       <AppIcon
//                         icon={appIcons.edit}
//                         size={14}
//                         className='mr-1'
//                       />
//                       Επεξεργασία
//                     </Button>
//                     <Button
//                       variant='destructive'
//                       size='sm'
//                       onClick={() => onDelete(r)}
//                     >
//                       <AppIcon
//                         icon={appIcons.delete}
//                         size={14}
//                         className='mr-1'
//                       />
//                       Διαγραφή
//                     </Button>
//                   </div>
//                 </td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default RegionsTable;

// components/tools/regions/RegionsTable.tsx
'use client';

import * as React from 'react';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppCrudMenu, AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { RegionDTO } from '@/types/tools/region';

type SortDir = 'asc' | 'desc';
type SortConfig = { field: keyof RegionDTO; direction: SortDir } | null;

type Props = {
  rows: RegionDTO[];
  onEdit?: (row: RegionDTO) => void;
  onDelete?: (row: RegionDTO) => void;
  /** Προαιρετικά για μαζική διαγραφή */
  onBulkDelete?: (ids: string[]) => Promise<void> | void;
  /** Μέγεθος σελίδας (default 10) */
  pageSize?: number;
  className?: string;
};

const RegionsTable: React.FC<Props> = ({
  rows: inputRows,
  onEdit,
  onDelete,
  onBulkDelete,
  pageSize = 5,
  className,
}) => {
  const router = useRouter();
  const [rows, setRows] = useState<RegionDTO[]>(() => inputRows ?? []);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sort, setSort] = useState<SortConfig>(null);
  const [page, setPage] = useState(1);

  useEffect(() => setRows(inputRows ?? []), [inputRows]);

  const collator = useMemo(
    () => new Intl.Collator('el', { sensitivity: 'base', numeric: true }),
    []
  );

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const { field, direction } = sort;
    const data = [...rows];
    data.sort((a, b) => {
      const av = (a?.[field] ?? '') as any;
      const bv = (b?.[field] ?? '') as any;
      const cmp = collator.compare(String(av ?? ''), String(bv ?? ''));
      return direction === 'asc' ? cmp : -cmp;
    });
    return data;
  }, [rows, sort, collator]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const paged = useMemo(
    () => sortedRows.slice(pageStart, pageStart + pageSize),
    [sortedRows, pageStart, pageSize]
  );

  const pageIds = paged.map((r) => r.id);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const someSelected =
    !allSelected && pageIds.some((id) => selectedIds.includes(id));

  const toggleSort = (field: keyof RegionDTO) => {
    setPage(1);
    setSort((prev) => {
      if (!prev || prev.field !== field) return { field, direction: 'asc' };
      return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedIds((cur) =>
      checked
        ? Array.from(new Set([...cur, ...pageIds]))
        : cur.filter((id) => !pageIds.includes(id))
    );
  };

  const handleSelect = (id: string) => {
    setSelectedIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );
  };

  const handleBulkDelete = useCallback(async () => {
    if (!onBulkDelete || selectedIds.length === 0) return;
    const ok = window.confirm(`Διαγραφή ${selectedIds.length} περιοχών;`);
    if (!ok) return;
    await onBulkDelete(selectedIds);
    setSelectedIds([]);
    router.refresh?.();
  }, [onBulkDelete, selectedIds, router]);

  const handleDeleteOne = async (row: RegionDTO) => {
    if (!onDelete) return;
    const ok = window.confirm(`Διαγραφή περιοχής «${row.name}»;`);
    if (!ok) return;
    await onDelete(row);
    router.refresh?.();
  };

  return (
    <div className={className}>
      {/* Bulk actions */}
      <div className='mb-2 flex justify-end'>
        {selectedIds.length > 0 && onBulkDelete && (
          <Button variant='destructive' size='sm' onClick={handleBulkDelete}>
            <AppIcon icon={appIcons.delete} size={16} className='mr-2' />
            Διαγραφή επιλεγμένων ({selectedIds.length})
          </Button>
        )}
      </div>

      <div className='rounded-md border overflow-x-auto'>
        <Table>
          <TableHeader className='bg-muted/50'>
            <TableRow>
              <TableHead className='w-[56px] text-center'>#</TableHead>
              <TableHead className='w-[50px]'>
                <Checkbox
                  checked={
                    allSelected ? true : someSelected ? 'indeterminate' : false
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>

              <TableHead
                className='cursor-pointer select-none'
                onClick={() => toggleSort('name')}
              >
                <span className='inline-flex items-center gap-2'>
                  <AppIcon icon={appIcons.regions} />
                  Όνομα
                  {sort?.field === 'name' && (
                    <AppIcon
                      icon={
                        sort.direction === 'asc' ? appIcons.sort : appIcons.sort
                      }
                    />
                  )}
                </span>
              </TableHead>

              <TableHead
                className='w-[20%] cursor-pointer select-none'
                onClick={() => toggleSort('code')}
              >
                <span className='inline-flex items-center gap-2'>
                  <AppIcon icon={appIcons.code} />
                  Code
                  {sort?.field === 'code' && (
                    <AppIcon
                      icon={
                        sort.direction === 'asc' ? appIcons.sort : appIcons.sort
                      }
                    />
                  )}
                </span>
              </TableHead>

              <TableHead
                className='cursor-pointer select-none'
                onClick={() => toggleSort('description')}
              >
                <span className='inline-flex items-center gap-2'>
                  <AppIcon icon={appIcons.description} />
                  Περιγραφή
                  {sort?.field === 'description' && (
                    <AppIcon
                      icon={
                        sort.direction === 'asc' ? appIcons.sort : appIcons.sort
                      }
                    />
                  )}
                </span>
              </TableHead>

              <TableHead className='w-[120px] text-right'>Ενέργειες</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='py-10 text-center text-muted-foreground'
                >
                  Δεν υπάρχουν περιοχές.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((r, idx) => (
                <TableRow key={r.id} className='border-b last:border-b-0'>
                  <TableCell className='text-center text-muted-foreground'>
                    {pageStart + idx + 1}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(r.id)}
                      onCheckedChange={() => handleSelect(r.id)}
                    />
                  </TableCell>
                  <TableCell className='font-medium'>{r.name}</TableCell>
                  <TableCell>{r.code ?? '—'}</TableCell>
                  <TableCell className='truncate max-w-[0]'>
                    {r.description ?? '—'}
                  </TableCell>
                  <TableCell className='text-right'>
                    <AppCrudMenu
                      trigger={
                        <button
                          className='inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent'
                          aria-label='Actions'
                        >
                          <AppIcon icon={appIcons.menu} size={16} />
                        </button>
                      }
                      showEdit={!!onEdit}
                      showDelete={!!onDelete}
                      onEdit={() => onEdit?.(r)}
                      onDelete={() => handleDeleteOne(r)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='mt-2 flex items-center justify-center gap-2'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => {
              setSelectedIds([]);
              setPage((p) => Math.max(1, p - 1));
            }}
            disabled={page === 1}
          >
            <AppIcon icon={appIcons.chevronLeft} size={16} />
          </Button>
          <span className='text-sm'>
            Σελίδα {page} από {totalPages}
          </span>
          <Button
            variant='outline'
            size='icon'
            onClick={() => {
              setSelectedIds([]);
              setPage((p) => Math.min(totalPages, p + 1));
            }}
            disabled={page === totalPages}
          >
            <AppIcon icon={appIcons.chevronRight} size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default RegionsTable;
