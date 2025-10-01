## Εξαγωγή .exe

```bash
npm run prisma:generate
rm -rf dist .next
npm run build
npm run dist:win
```

```cmd
αν θέλω να δουλέψει το debug.log πρε΄πει να προσθέσω
στο c/users/{my-user}/AppData/roaming/mil tracker/
το αρχείο debug-health.flag (παίζει το ρόλο flag)
```

```cmd
να μεταφέρουμε κι άλλα IPC σε modules
(π.χ. agreements, orgUnits, equipment categories) ή να
προσθέσουμε Zod validation; Θα στο στήσω κατευθείαν.
```

```cmd
DATABASE_URL="file:../data/mil.db" npx prisma migrate dev --name .........
npx prisma generate --schema=prisma/schema.prisma
```

```cmd
WIN
set MIL_DEBUG=1 && "C:\Users\group8\Documents\DEV\ai-e-nis\mil-tracker\dist\win-unpacked\Mil Tracker.exe"
MAC
MIL_DEBUG=1 /Applications/Mil\ Tracker.app/Contents/MacOS/Mil\ Tracker


DATABASE_URL="file:./data/mil.db"
```

> Καθάρισμα main.cjs
> Καθάρισμα package.json
> Καθάρισμα global.d.ts
> Καθάρισμα

> **\*** add migration after setting up DB prisma

```bash
npx prisma migrate dev --name (migration distinctive name)
```

> **\*\*** reset migrations

```bash m -rf prisma/migrations // delete folder
npx prisma migrate reset // reset migrations
npx prisma migrate dev --name init  //set initial migration
```

```bash
Μετά από οποιοδήποτε write (create/update/delete) που επηρεάζει counts, κάλεσε:

import { revalidateSidebarCounts } from '@/actions/sidebar-counts'

await revalidateSidebarCounts()
```

```js
// components/personnel/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { PersonDTO } from '@/actions/person.actions';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { countEntityImages, getAvatarFromImages } from '@/ui/person-helpers';

const yearFromISO = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : String(d.getFullYear());
};

export const personnelColumns: ColumnDef<PersonDTO>[] = [
  {
    id: '#',
    header: '#',
    enableHiding: false,
    enableSorting: false,
    cell: ({ row, table }) => {
      const baseIndex = (table.options.meta as any)?.baseIndex ?? 0;
      return baseIndex + row.index + 1;
    },
    size: 48,
  },
  {
    id: 'photo',
    header: 'Φωτο',
    enableSorting: false,
    cell: ({ row }) => {
      const p = row.original;
      const fullName = `${p.lastName} ${p.firstName}`.trim();
      const avatar = getAvatarFromImages(p.personImagePaths);
      const imagesCount = countEntityImages(p.personImagePaths);
      return (
        <div className="relative inline-block">
          <div className="h-10 w-10 rounded-full bg-muted overflow-hidden ring-1 ring-border flex items-center justify-center">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[11px] font-medium text-muted-foreground">
                {p.firstName?.[0]}{p.lastName?.[0]}
              </span>
            )}
          </div>
          {imagesCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {imagesCount}
            </span>
          )}
        </div>
      );
    },
    size: 72,
  },
  {
    accessorKey: 'lastName',
    header: 'Ονοματεπώνυμο',
    cell: ({ row }) => {
      const p = row.original;
      const fullName = `${p.lastName} ${p.firstName}`.trim();
      const nick = p.nickname ? `«${p.nickname}»` : '';
      return (
        <div className="flex flex-col">
          <span className="font-medium">{fullName}</span>
          {nick ? <span className="text-xs text-muted-foreground">{nick}</span> : null}
        </div>
      );
    },
  },
  { accessorKey: 'rank.name', header: 'Βαθμός' },
  { accessorKey: 'branch.name', header: 'Κλάδος' },
  { accessorKey: 'country.name', header: 'Χώρα' },
  { accessorKey: 'status', header: 'Κατάσταση' },
  { accessorKey: 'type', header: 'Τύπος' },
  {
    id: 'installations',
    header: 'Τοποθετήσεις',
    enableSorting: false,
    cell: ({ row }) => {
      const p = row.original;
      const items = [...(p.installations || [])]
        .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
        .slice(0, 3);
      if (!items.length) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          {items.map((it) => {
            const startY = yearFromISO(it.startDate);
            const endY = yearFromISO(it.endDate);
            const place = it.unit?.name || it.organization?.name || it.country?.name || '—';
            const role = it.position?.name || it.type;
            return (
              <div key={it.id} className="flex items-center gap-2">
                <span className="text-foreground font-medium">{startY}{endY !== '—' ? `–${endY}` : ''}</span>
                <span className="truncate">{place}</span>
                <span className="text-[11px] italic">{role}</span>
              </div>
            );
          })}
        </div>
      );
    },
    size: 280,
  },
  {
    id: 'promotions',
    header: 'Προαγωγές',
    enableSorting: false,
    cell: ({ row }) => {
      const p = row.original;
      const items = [...(p.promotions || [])].sort((a, b) => b.year - a.year).slice(0, 3);
      if (!items.length) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          {items.map((pr, i) => (
            <div key={`${p.id}-pr-${i}`} className="flex items-center gap-2">
              <span className="text-foreground font-medium">{pr.year}</span>
              <span className="truncate">{pr.rank?.name}</span>
              {pr.rank?.code && <span className="text-[11px]">({pr.rank.code})</span>}
            </div>
          ))}
        </div>
      );
    },
    size: 220,
  },
  { accessorKey: 'meetingsCount', header: 'Συναντήσεις' },
  {
    id: 'actions',
    header: () => <div className="text-right">Ενέργειες</div>,
    enableSorting: false,
    enableHiding: false,
    cell: () => (
      <div className="text-right">
        <div className="inline-flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Προβολή">
            <AppIcon icon={appIcons.view} size={16} />
          </Button>
          <Button variant="ghost" size="icon" title="Επεξεργασία">
            <AppIcon icon={appIcons.edit} size={16} />
          </Button>
        </div>
      </div>
    ),
  },
];

// components/personnel/DataTable.tsx
'use client';

import * as React from 'react';
import {
  ColumnDef,
  VisibilityState,
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { cn } from '@/lib/utils';

type Props<TData> = {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  className?: string;
  baseIndex?: number;
  /** εξωτερικό sort (για URL/server sync) */
  sorting?: SortingState;
  onSortingChange?: (updater: SortingState) => void;
  manualSorting?: boolean; // true αν θες ο server να ταξινομεί
  initialVisibility?: VisibilityState; // default visible/hidden columns
};

export function DataTable<TData>({
  data,
  columns,
  className,
  baseIndex = 0,
  sorting,
  onSortingChange,
  manualSorting = false,
  initialVisibility,
}: Props<TData>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialVisibility || {});
  const [localSorting, setLocalSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
      sorting: manualSorting ? (sorting ?? []) : localSorting,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: manualSorting ? onSortingChange : setLocalSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    manualSorting,
    meta: { baseIndex },
  });

  return (
    <div className={cn('rounded-md border overflow-x-auto', className)}>
      {/* Toolbar: Column toggle */}
      <div className="flex items-center justify-end p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <AppIcon icon={appIcons.columns} size={14} className="mr-1" />
              Κολώνες
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {table
              .getAllLeafColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  className="capitalize"
                >
                  {col.columnDef.header as any}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id} style={{ width: h.getSize() }}>
                  {h.isPlaceholder ? null : h.column.getCanSort() ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-1 -ml-2 inline-flex items-center gap-1"
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {h.column.columnDef.header as any}
                      {{
                        asc: <AppIcon icon={appIcons.chevronUp} size={14} />,
                        desc: <AppIcon icon={appIcons.chevronDown} size={14} />,
                      }[h.column.getIsSorted() as 'asc' | 'desc'] ?? (
                        <AppIcon icon={appIcons.sort} size={12} className="text-muted-foreground" />
                      )}
                    </Button>
                  ) : (
                    h.column.columnDef.header as any
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="align-top">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                  {cell.renderCell()}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground">
                Χωρίς δεδομένα
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

import { DataTable } from '@/components/personnel/DataTable';
import { personnelColumns } from '@/components/personnel/columns';

// client sort (table-driven):
<DataTable
  data={visibleRows}
  columns={personnelColumns}
  baseIndex={paginationVariant === 'pages' ? (page - 1) * PAGE_SIZE : 0}
/>

// ή, για server/URL-driven sort:
<DataTable
  data={visibleRows}
  columns={personnelColumns}
  baseIndex={paginationVariant === 'pages' ? (page - 1) * PAGE_SIZE : 0}
  manualSorting
  sorting={[{ id: sortBy, desc: sortDir === 'desc' }]}
  onSortingChange={(next) => {
    const s = next[0];
    if (!s) return;
    const dir = s.desc ? 'desc' : 'asc';
    onSort(s.id as string, dir); // κρατάς URL + server fetch
  }}
/>


```
