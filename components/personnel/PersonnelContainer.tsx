'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  fetchMorePersonnel,
  type PersonDTO,
  type PersonnelListPayload,
} from '@/actions/person.actions';
import {
  EmptyState,
  FiltersContainer,
  PaginationControls,
} from '@/components/common';
import { appIcons } from '@/constants/app-icons';
import { PersonFilters } from '@/types/person';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { AppIcon, AppSelect } from '@/components/app-ui';
import {
  paginationTypes,
  PERSON_TYPE_OPTIONS,
  SERVICE_STATUS_OPTIONS,
} from '@/constants/categories';
import {
  CardsSkeleton,
  HeaderSkeleton,
  matchesQuery,
  PersonnelCards,
  TableSkeleton,
} from '@/components/personnel';
import { pushWithParams } from '@/lib/utils';
import PersonnelDataTable from './PersonnelDataTable';
import { SelectInclude } from '@/actions/common.actions';

type PersonnelContainerProps = {
  initial: PersonnelListPayload;
  initialFilters: PersonFilters;
  selectOptions: SelectInclude;
};

// Sort utils
const SORTABLE_FIELDS = [
  { key: 'lastName', label: 'Επώνυμο' },
  { key: 'firstName', label: 'Όνομα' },
  { key: 'rank', label: 'Βαθμός' },
  { key: 'branch', label: 'Κλάδος' },
  { key: 'country', label: 'Χώρα' },
  { key: 'status', label: 'Κατάσταση' },
  { key: 'type', label: 'Τύπος' },
  { key: 'retiredAt', label: 'Έτος Αποστ.' },
];
export const PAGE_SIZE = 10;
export const PERSONNEL_TABLE_CELLS = 10;
const PersonnelContainer = ({
  initialFilters,
  initial,
  selectOptions,
}: PersonnelContainerProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<PersonDTO[]>(initial.items || []);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initial.nextCursor || null
  );

  const [view, setView] = useState<'table' | 'cards'>('table');
  const [pending, setPending] = useState(false);
  const [paginationVariant, setPaginationVariant] = useState<
    'pages' | 'loadMore'
  >('pages');
  const [sortBy, setSortBy] = useState<string>('lastName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>(() => ({
    q: (initialFilters.q as string) || '',
    personType: Array.isArray(initialFilters.type)
      ? initialFilters.type.join(',')
      : (initialFilters.type as any) || '',
    serviceStatus: Array.isArray(initialFilters.status)
      ? initialFilters.status.join(',')
      : (initialFilters.status as any) || '',
    branchId: Array.isArray(initialFilters.branchId)
      ? initialFilters.branchId.join(',')
      : (initialFilters.branchId as any) || '',
    rankId: Array.isArray(initialFilters.rankId)
      ? initialFilters.rankId.join(',')
      : (initialFilters.rankId as any) || '',
    countryId: Array.isArray(initialFilters.countryId)
      ? initialFilters.countryId.join(',')
      : (initialFilters.countryId as any) || '',
  }));
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { ranks, branches, countries } = selectOptions;

  const filteredRows = useMemo(() => {
    return rows.filter((p) => {
      if (!matchesQuery(p, filters.q)) return false;

      if (filters.personType && p.type !== filters.personType) return false;
      if (filters.serviceStatus && p.status !== filters.serviceStatus)
        return false;

      if (filters.rankId && p.rank?.id !== filters.rankId) return false;
      if (filters.countryId && p.country?.id !== filters.countryId)
        return false;
      if (filters.branchId && p.branch?.id !== filters.branchId) return false;

      return true;
    });
    // αν θες, βάλε dependency απλά [rows, filters]
  }, [
    rows,
    filters.q,
    filters.personType,
    filters.serviceStatus,
    filters.rankId,
    filters.countryId,
    filters.branchId,
  ]);

  // reset when initial changes
  useEffect(() => {
    setRows(initial.items || []);
    setNextCursor(initial.nextCursor || null);
    setPending(false);
  }, [initial.items, initial.nextCursor]);

  // sync filters from props change
  useEffect(() => {
    setFilters((f) => ({
      ...f,
      q: (initialFilters.q as string) || '',
    }));
  }, [initialFilters]);

  // server loadMore (cursor)
  const handleServerLoadMore = useCallback(async () => {
    if (!nextCursor) return;
    setPending(true);
    try {
      const res = await fetchMorePersonnel({
        cursor: nextCursor,
        take: PAGE_SIZE,
        sortBy,
        sortDir,
        filters: initialFilters, // server-side uses typed filters; keep as-is for now
      });
      if (res?.items) {
        setRows((cur) => [...cur, ...res.items]);
        setNextCursor(res.nextCursor || null);
      }
    } finally {
      setPending(false);
    }
  }, [nextCursor, sortBy, sortDir, initialFilters]);

  // Filters schema for FiltersContainer
  const filtersSchema = useMemo(
    () => [
      {
        key: 'q',
        type: 'text',
        placeholder: 'Αναζήτηση ονόματος…',
        width: 280,
      },
      {
        key: 'serviceStatus',
        type: 'appselect',
        placeholder: 'Κατάσταση',
        options: SERVICE_STATUS_OPTIONS,
        getLabel: (o: any) => o?.label ?? '',
      },
      {
        key: 'personType',
        type: 'appselect',
        placeholder: 'Τύπος',
        options: PERSON_TYPE_OPTIONS,
        getLabel: (o: any) => o?.label ?? '',
      },
      {
        key: 'rankId',
        type: 'appselect',
        placeholder: 'Βαθμός',
        options: ranks,
        getLabel: (o: any) => (o?.label || o?.name) ?? '',
      },
      {
        key: 'branchId',
        type: 'appselect',
        placeholder: 'Όπλο',
        options: branches,
        getLabel: (o: any) => (o?.label || o?.name) ?? '',
      },
      {
        key: 'countryId',
        type: 'appselect',
        placeholder: 'Χώρα',
        options: countries,
        getLabel: (o: any) => (o?.label || o?.name) ?? '',
      },
    ],
    [ranks, branches, countries]
  );
  const paginationOptions = useMemo(
    () => paginationTypes.map((p) => ({ value: p.id, label: p.name })),
    []
  );

  // simple client-side pager when variant === 'pages'
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  useEffect(() => setPage(1), [filteredRows.length, paginationVariant]);

  // helper: τι τιμή συγκρίνουμε για κάθε πεδίο
  const pickSortableValue = (p: PersonDTO, field?: string): string | number => {
    switch (field) {
      case 'firstName':
        return p.firstName ?? '';
      case 'lastName':
        return p.lastName ?? '';
      case 'rank':
        return p.rank?.name ?? '';
      case 'branch':
        return p.branch?.name ?? '';
      case 'country':
        return p.country?.name ?? '';
      case 'status':
        return p.status ?? '';
      case 'type':
        return p.type ?? '';
      case 'retiredAt': {
        // έχεις μόνο retiredYear στο DTO σου – χρησιμοποίησέ το
        return p.retiredYear ?? 0;
      }
      default:
        return p.lastName ?? '';
    }
  };

  // safe sort field (προαιρετικό, ώστε να αξιοποιήσεις τα SORTABLE_FIELDS)
  const ALLOWED_SORTS = new Set(SORTABLE_FIELDS.map((f) => f.key));
  const safeSortBy = ALLOWED_SORTS.has(sortBy) ? sortBy : 'lastName';

  // comparator
  const dirFactor = sortDir === 'desc' ? -1 : 1;
  const sortedRows = useMemo(() => {
    const arr = [...filteredRows];
    arr.sort((a, b) => {
      const va = pickSortableValue(a, safeSortBy);
      const vb = pickSortableValue(b, safeSortBy);

      // αριθμοί vs strings
      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * dirFactor;
      }
      const sa = String(va).toLocaleLowerCase();
      const sb = String(vb).toLocaleLowerCase();
      if (sa === sb) return 0;
      return sa > sb ? 1 * dirFactor : -1 * dirFactor;
    });
    return arr;
  }, [filteredRows, safeSortBy, sortDir]);

  const visibleRows = useMemo(() => {
    if (paginationVariant === 'loadMore') return sortedRows; // show all loaded
    const start = (page - 1) * PAGE_SIZE;
    return sortedRows.slice(start, start + PAGE_SIZE);
  }, [sortedRows, page, paginationVariant]);

  const hasMoreLocal = useMemo(() => {
    return (
      paginationVariant === 'loadMore' &&
      rows.length < (initial.totalCount || 0)
    );
  }, [paginationVariant, rows.length, initial.totalCount]);

  // Sorting handler (server-friendly URL sync)
  const onSort = (field: string, dir: 'asc' | 'desc') => {
    setSortBy(field);
    setSortDir(dir);
    pushWithParams(searchParams, pathname, router, {
      sortBy: field,
      sortDir: dir,
    });
  };

  return (
    <>
      {/* Header summary & toggles */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center justify-between'>
            <span className='text-2xl font-bold'>
              Σύνολο: {initial.totalCount} άτομα
            </span>
            <div className='flex items-center gap-2'>
              {pending ? (
                <HeaderSkeleton />
              ) : (
                <div className='hidden sm:flex gap-3 text-sm text-muted-foreground'>
                  <div className='rounded-md border bg-muted/30 px-3 py-2'>
                    <div className='text-[11px] uppercase tracking-wide'>
                      Ενεργοί
                    </div>
                    <div className='font-semibold'>
                      {initial.breakdown?.active ?? 0}
                    </div>
                  </div>
                  <div className='rounded-md border bg-muted/30 px-3 py-2'>
                    <div className='text-[11px] uppercase tracking-wide'>
                      Απόστρατοι
                    </div>
                    <div className='font-semibold'>
                      {initial.breakdown?.retired ?? 0}
                    </div>
                  </div>
                </div>
              )}

              {/* pagination mode selector */}
              {view === 'cards' && (
                <AppSelect
                  value={paginationVariant}
                  onChange={(v: any) => setPaginationVariant(v)}
                  options={paginationOptions}
                  placeholder='Εμφάνιση'
                  showSelect
                  className='w-full sm:w-[200px]'
                  getLabel={(item: any) => item.label}
                />
              )}
              {/* toggle cards/table */}
              <Button
                variant='outline'
                size='icon'
                aria-label='Toggle view'
                onClick={() =>
                  setView((v) => (v === 'cards' ? 'table' : 'cards'))
                }
                title={view === 'cards' ? 'Πίνακας' : 'Κάρτες'}
              >
                <AppIcon
                  icon={view === 'cards' ? appIcons.table : appIcons.cards}
                  size={16}
                />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>
      {/* Filters */}
      <FiltersContainer
        schema={filtersSchema as any}
        filters={filters as any}
        onChange={(delta) => {
          setFilters((f) => ({ ...f, ...delta })); // q/personType/serviceStatus
          setPageIndex(0); // reset page όταν αλλάζει φίλτρο
        }}
        onClearAll={() => {
          setFilters({
            q: '',
            personType: '',
            serviceStatus: '',
            rankId: '',
            countryId: '',
            branchId: '',
          });
          setPageIndex(0);
        }}
      />
      {/* Content */}
      {pending ? (
        view === 'cards' ? (
          <CardsSkeleton cards={8} />
        ) : (
          <TableSkeleton
            rows={10}
            cells={PERSONNEL_TABLE_CELLS}
          ></TableSkeleton>
        )
      ) : view === 'cards' ? (
        <>
          <PersonnelCards rows={visibleRows} />
          {visibleRows.length === 0 && (
            <div className='flex flex-1 justify-center'>
              <EmptyState icon={appIcons.user_head} label='Προσωπικό' />
            </div>
          )}
          {/* skeletons όταν γίνεται server fetch για load more */}
          {paginationVariant === 'loadMore' && hasMoreLocal && (
            <div className='mt-4'>
              <CardsSkeleton cards={8} />
            </div>
          )}
        </>
      ) : (
        <PersonnelDataTable
          rows={visibleRows}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageIndex={setPageIndex}
          setPageSize={setPageSize}
        />
      )}
      {/* Pagination / Load more controls */}
      {view === 'cards' && (
        <PaginationControls
          variant={paginationVariant}
          page={page}
          totalPages={totalPages}
          hasMore={
            paginationVariant === 'loadMore'
              ? Boolean(nextCursor)
              : page < totalPages
          }
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          onLoadMore={handleServerLoadMore}
          className='mt-4'
        />
      )}
    </>
  );
};

export default PersonnelContainer;
