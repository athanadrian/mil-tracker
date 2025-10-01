// // components/personnel/columns.tsx
// 'use client';

// import type { ColumnDef } from '@tanstack/react-table';
// import type { PersonDTO } from '@/actions/person.actions';
// import { Button } from '@/components/ui/button';
// import { AppIcon } from '@/components/app-ui';
// import { appIcons } from '@/constants/app-icons';
// import {
//   countEntityImages,
//   getAvatarFromImages,
//   yearFromISO,
// } from '@/lib/utils';

// export const personnelColumns: ColumnDef<PersonDTO>[] = [
//   {
//     id: '#',
//     header: '#',
//     enableHiding: false,
//     enableSorting: false,
//     cell: ({ row, table }) => {
//       const baseIndex = (table.options.meta as any)?.baseIndex ?? 0;
//       return baseIndex + row.index + 1;
//     },
//     size: 48,
//   },
//   {
//     id: 'photo',
//     header: 'Φωτο',
//     enableSorting: false,
//     cell: ({ row }) => {
//       const p = row.original;
//       const fullName = `${p.lastName} ${p.firstName}`.trim();
//       const avatar = getAvatarFromImages(p.personImagePaths);
//       const imagesCount = countEntityImages(p.personImagePaths);
//       return (
//         <div className='relative inline-block'>
//           <div className='h-10 w-10 rounded-full bg-muted overflow-hidden ring-1 ring-border flex items-center justify-center'>
//             {avatar ? (
//               // eslint-disable-next-line @next/next/no-img-element
//               <img
//                 src={avatar}
//                 alt={fullName}
//                 className='h-full w-full object-cover'
//               />
//             ) : (
//               <span className='text-[11px] font-medium text-muted-foreground'>
//                 {p.firstName?.[0]}
//                 {p.lastName?.[0]}
//               </span>
//             )}
//           </div>
//           {imagesCount > 0 && (
//             <span className='absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground'>
//               {imagesCount}
//             </span>
//           )}
//         </div>
//       );
//     },
//     size: 72,
//   },
//   {
//     accessorKey: 'lastName',
//     header: 'Ονοματεπώνυμο',
//     cell: ({ row }) => {
//       const p = row.original;
//       const fullName = `${p.lastName} ${p.firstName}`.trim();
//       const nick = p.nickname ? `«${p.nickname}»` : '';
//       return (
//         <div className='flex flex-col'>
//           <span className='font-medium'>{fullName}</span>
//           {nick ? (
//             <span className='text-xs text-muted-foreground'>{nick}</span>
//           ) : null}
//         </div>
//       );
//     },
//   },
//   { accessorKey: 'rank.name', header: 'Βαθμός' },
//   { accessorKey: 'branch.name', header: 'Κλάδος' },
//   { accessorKey: 'country.name', header: 'Χώρα' },
//   { accessorKey: 'status', header: 'Κατάσταση' },
//   { accessorKey: 'type', header: 'Τύπος' },
//   {
//     id: 'installations',
//     header: 'Τοποθετήσεις',
//     enableSorting: false,
//     cell: ({ row }) => {
//       const p = row.original;
//       const items = [...(p.installations || [])]
//         .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
//         .slice(0, 3);
//       if (!items.length)
//         return <span className='text-xs text-muted-foreground'>—</span>;
//       return (
//         <div className='flex flex-col gap-1 text-xs text-muted-foreground'>
//           {items.map((it) => {
//             const startY = yearFromISO(it.startDate);
//             const endY = yearFromISO(it.endDate);
//             const place =
//               it.unit?.name || it.organization?.name || it.country?.name || '—';
//             const role = it.position?.name || it.type;
//             return (
//               <div key={it.id} className='flex items-center gap-2'>
//                 <span className='text-foreground font-medium'>
//                   {startY}
//                   {endY !== '—' ? `–${endY}` : ''}
//                 </span>
//                 <span className='truncate'>{place}</span>
//                 <span className='text-[11px] italic'>{role}</span>
//               </div>
//             );
//           })}
//         </div>
//       );
//     },
//     size: 280,
//   },
//   {
//     id: 'promotions',
//     header: 'Προαγωγές',
//     enableSorting: false,
//     cell: ({ row }) => {
//       const p = row.original;
//       const items = [...(p.promotions || [])]
//         .sort((a, b) => b.year - a.year)
//         .slice(0, 3);
//       if (!items.length)
//         return <span className='text-xs text-muted-foreground'>—</span>;
//       return (
//         <div className='flex flex-col gap-1 text-xs text-muted-foreground'>
//           {items.map((pr, i) => (
//             <div key={`${p.id}-pr-${i}`} className='flex items-center gap-2'>
//               <span className='text-foreground font-medium'>{pr.year}</span>
//               <span className='truncate'>{pr.rank?.name}</span>
//               {pr.rank?.code && (
//                 <span className='text-[11px]'>({pr.rank.code})</span>
//               )}
//             </div>
//           ))}
//         </div>
//       );
//     },
//     size: 220,
//   },
//   { accessorKey: 'meetingsCount', header: 'Συναντήσεις' },
//   {
//     id: 'actions',
//     header: () => <div className='text-right'>Ενέργειες</div>,
//     enableSorting: false,
//     enableHiding: false,
//     cell: () => (
//       <div className='text-right'>
//         <div className='inline-flex items-center gap-1'>
//           <Button variant='ghost' size='icon' title='Προβολή'>
//             <AppIcon icon={appIcons.view} size={16} />
//           </Button>
//           <Button variant='ghost' size='icon' title='Επεξεργασία'>
//             <AppIcon icon={appIcons.edit} size={16} />
//           </Button>
//         </div>
//       </div>
//     ),
//   },
// ];

'use client';

const norm = (v: unknown) => (v == null ? '' : String(v).toLowerCase());

const personHaystack = (p: PersonDTO): string[] => {
  const basics = [
    p.firstName,
    p.lastName,
    p.nickname,
    p.rank?.name,
    p.rank?.code,
    p.branch?.name,
    p.country?.name,
    p.type, // MILITARY / CIVILIAN
    p.status, // ACTIVE / RESERVE / RETIRED
  ];

  const inst = (p.installations ?? []).flatMap((i) => [
    i.unit?.name,
    i.unit?.code,
    i.organization?.name,
    i.country?.name,
    i.position?.name,
    i.position?.code,
    i.rankAtTime?.name,
    i.rankAtTime?.code,
    i.installationYear,
  ]);

  const promos = (p.promotions ?? []).flatMap((pr) => [
    pr.year,
    pr.rank?.name,
    pr.rank?.code,
  ]);

  return [...basics, ...inst, ...promos].filter(Boolean).map(norm);
};

export const matchesQuery = (p: PersonDTO, q: string) => {
  const needle = norm(q).trim();
  if (!needle) return true;
  return personHaystack(p).some((h) => h.includes(needle));
};

import Image from 'next/image';
import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { PersonDTO } from '@/actions/person.actions';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { cn } from '@/lib/utils';
// Αν έχεις ήδη helpers:
import {
  countEntityImages,
  getAvatarFromImages,
  yearFromISO,
} from '@/lib/utils';

function formatInstallationRow(
  inst: PersonDTO['installations'][number]
): string {
  const y1 =
    yearFromISO(inst.startDate) ??
    (inst.installationYear ? String(inst.installationYear) : undefined);
  const y2 = yearFromISO(inst.endDate);
  const when = y1 ? `${y1}${y2 ? '–' + y2 : ''}` : y2 ? y2 : '';
  const where =
    inst.unit?.name ??
    inst.organization?.name ??
    inst.position?.name ??
    inst.country?.name ??
    '';
  const role = inst.position?.name;
  const rank = inst.rankAtTime?.name;
  const meta = [role, rank].filter(Boolean).join(' • ');
  return [when, where, meta].filter(Boolean).join(' · ');
}

function formatPromotionRow(pr: PersonDTO['promotions'][number]): string {
  return `${pr.year}${pr.rank?.name ? ' · ' + pr.rank.name : ''}`;
}

/**
 * Δημιουργεί τις στήλες του πίνακα προσωπικού
 * - Έχουμε σταθερά IDs ώστε να δουλεύει sorting με nested fields
 * - Τα cells είναι “πλούσια” (avatar, badges, lists)
 */
export function makePersonnelColumns(opts?: {
  onView?: (p: PersonDTO) => void;
  onEdit?: (p: PersonDTO) => void;
}): ColumnDef<PersonDTO, any>[] {
  const { onView, onEdit } = opts || {};

  const columns: ColumnDef<PersonDTO, any>[] = [
    // Index (βασίζεται στο table.meta.baseIndex)
    {
      id: 'idx',
      header: '#',
      enableSorting: false,
      size: 48,
      cell: ({ row, table }) => {
        const base = (table.options.meta as any)?.baseIndex ?? 0;
        return (
          <span className='text-xs text-muted-foreground'>
            {base + row.index + 1}
          </span>
        );
      },
    },

    // Avatar + badge φωτογραφιών
    {
      id: 'photo',
      header: 'Φώτο',
      enableSorting: false,
      size: 64,
      cell: ({ row }) => {
        const p = row.original;
        const fullName = `${p.lastName} ${p.firstName}`.trim();
        const avatar = getAvatarFromImages(p.personImagePaths);
        const imagesCount = countEntityImages(p.personImagePaths);
        return (
          <div className='relative h-10 w-10 rounded-full overflow-hidden bg-muted flex items-center justify-center'>
            {avatar ? (
              <Image
                src={avatar}
                alt={fullName}
                fill
                className='object-cover'
                sizes='40px'
              />
            ) : (
              <AppIcon
                icon={appIcons.user_head}
                size={18}
                className='text-muted-foreground'
              />
            )}
            {imagesCount > 0 && (
              <span className='absolute -bottom-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-5 text-center'>
                {imagesCount}
              </span>
            )}
          </div>
        );
      },
    },

    // Ονοματεπώνυμο (sort by lastName)
    {
      id: 'lastName',
      header: 'Ονοματεπώνυμο',
      accessorFn: (p) => p.lastName ?? '',
      sortingFn: 'alphanumeric',
      size: 260,
      cell: ({ row }) => {
        const p = row.original;
        const fullName = `${p.lastName} ${p.firstName}`.trim();
        const nick = p.nickname ? `«${p.nickname}»` : '';
        return (
          <div className='flex flex-col'>
            <span className='font-medium'>{fullName}</span>
            {nick ? (
              <span className='text-xs text-muted-foreground'>{nick}</span>
            ) : null}
          </div>
        );
      },
    },

    // Βαθμός
    {
      id: 'rank',
      header: 'Βαθμός',
      accessorFn: (p) => p.rank?.name ?? '',
      sortingFn: 'alphanumeric',
      size: 160,
      cell: ({ row }) => row.original.rank?.name ?? '—',
    },

    // Κλάδος
    {
      id: 'branch',
      header: 'Κλάδος',
      accessorFn: (p) => p.branch?.name ?? '',
      sortingFn: 'alphanumeric',
      size: 160,
      cell: ({ row }) => row.original.branch?.name ?? '—',
    },

    // Χώρα
    {
      id: 'country',
      header: 'Χώρα',
      accessorFn: (p) => p.country?.name ?? '',
      sortingFn: 'alphanumeric',
      size: 160,
      cell: ({ row }) => row.original.country?.name ?? '—',
    },

    // Κατάσταση
    {
      id: 'status',
      header: 'Κατάσταση',
      accessorFn: (p) => p.status ?? '',
      sortingFn: 'alphanumeric',
      size: 140,
      cell: ({ row }) => row.original.status,
    },

    // Τύπος
    {
      id: 'type',
      header: 'Τύπος',
      accessorFn: (p) => p.type ?? '',
      sortingFn: 'alphanumeric',
      size: 120,
      cell: ({ row }) => row.original.type,
    },

    // Τοποθετήσεις (latest first, μέσα στο κελί)
    {
      id: 'installations',
      header: 'Τοποθετήσεις',
      enableSorting: false,
      size: 360,
      cell: ({ row }) => {
        const list = [...(row.original.installations ?? [])].sort((a, b) =>
          (b.startDate || '').localeCompare(a.startDate || '')
        );
        return list.length ? (
          <div className='flex flex-col gap-1 text-xs text-muted-foreground'>
            {list.map((inst) => (
              <div key={inst.id} className='truncate'>
                {formatInstallationRow(inst)}
              </div>
            ))}
          </div>
        ) : (
          <span className='text-muted-foreground'>—</span>
        );
      },
    },

    // Προαγωγές (latest first)
    {
      id: 'promotions',
      header: 'Προαγωγές',
      enableSorting: false,
      size: 260,
      cell: ({ row }) => {
        const list = [...(row.original.promotions ?? [])].sort(
          (a, b) => b.year - a.year
        );
        return list.length ? (
          <div className='flex flex-col gap-1 text-xs text-muted-foreground'>
            {list.map((pr, i) => (
              <div key={`${row.original.id}-pr-${i}`} className='truncate'>
                {formatPromotionRow(pr)}
              </div>
            ))}
          </div>
        ) : (
          <span className='text-muted-foreground'>—</span>
        );
      },
    },

    // Συναντήσεις
    {
      id: 'meetings',
      header: 'Συναντήσεις',
      accessorFn: (p) => p.meetingsCount ?? 0,
      sortingFn: 'basic',
      size: 120,
      cell: ({ row }) => row.original.meetingsCount,
    },

    // Actions (view/edit)
    {
      id: 'actions',
      header: () => (
        <span className='inline-block w-full text-right'>Ενέργειες</span>
      ),
      enableSorting: false,
      size: 140,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className='w-full flex items-center justify-end gap-1'>
            <Button
              variant='ghost'
              size='icon'
              title='Προβολή'
              onClick={() => onView?.(p)}
            >
              <AppIcon icon={appIcons.view} size={16} />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              title='Επεξεργασία'
              onClick={() => onEdit?.(p)}
            >
              <AppIcon icon={appIcons.edit} size={16} />
            </Button>
          </div>
        );
      },
    },
  ];

  return columns;
}

// Προαιρετικά: σταθερό export αν δεν χρειάζεσαι callbacks
export const personnelColumns: ColumnDef<PersonDTO, any>[] =
  makePersonnelColumns();
