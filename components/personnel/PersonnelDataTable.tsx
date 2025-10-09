'use client';

import * as React from 'react';
import { AppDataTable } from '@/components/app-ui';
import type { PersonDTO } from '@/actions/person.actions';
import { makePersonnelColumns } from './personnel-columns';
import { useRouter } from 'next/navigation';

type PersonnelDataTableProps = {
  rows: PersonDTO[];
  pageSize: number;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  pageIndex: number;
  setPageIndex: React.Dispatch<React.SetStateAction<number>>;
  onView?: (p: PersonDTO) => void;
  onEdit?: (p: PersonDTO) => void;
  /** Αρχικές ορατές κολώνες (προαιρετικό) */
  initialVisibility?: Record<string, boolean>;
  /** Επιλογές μεγέθους σελίδας */
  pageSizeOptions?: number[];
};

const PersonnelDataTable = ({
  rows,
  pageSize,
  setPageSize,
  pageIndex,
  setPageIndex,
  onView,
  onEdit,
  initialVisibility,
  pageSizeOptions = [10, 25, 50, 100],
}: PersonnelDataTableProps) => {
  // columns πρέπει να είναι stable reference
  const router = useRouter();
  const columns = React.useMemo(
    () => makePersonnelColumns({ onView, onEdit, router }),
    [onView, onEdit]
  );

  return (
    <AppDataTable
      data={rows}
      columns={columns}
      baseIndex={pageIndex * pageSize}
      // pagination (controlled)
      pageIndex={pageIndex}
      onPageIndexChange={setPageIndex}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      pageSizeOptions={pageSizeOptions}
      // column visibility (προαιρετικά)
      initialVisibility={initialVisibility}
      // client sorting (default). Για server sorting: πέρασε manualSorting & onSortingChange
    />
  );
};

export default PersonnelDataTable;
