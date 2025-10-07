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
import { AppCrudMenu, AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { cn } from '@/lib/utils';
// Αν έχεις ήδη helpers:
import {
  countEntityImages,
  getAvatarFromImages,
  yearFromISO,
} from '@/lib/utils';
import { Flag } from '../common';

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
      cell: ({ row }) => (
        <Flag
          flag={row.original.country?.flag}
          name={row.original.country?.name}
        />
      ),
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
          <AppCrudMenu
            trigger={
              <button
                className='inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent'
                aria-label='Actions'
              >
                <AppIcon icon={appIcons.dots_menu} size={16} />
              </button>
            }
            showView
            showEdit
            showDelete
            onView={() => onView?.(p)}
            onEdit={() => onEdit?.(p)}
            onDelete={() => {
              /* άνοιξε dialog διαγραφής αν έχεις */
            }}
            items={[
              {
                key: 'add-intallation',
                label: 'Προσθήκη Τοποθέτησης',
                icon: <AppIcon icon={appIcons.add} />,
                onAction: () => {},
              },
              {
                key: 'add-work',
                label: 'Προσθήκη Προαγωγής',
                icon: <AppIcon icon={appIcons.add} />,
                onAction: () => {},
              },
            ]}
          />
        );
      },
    },
  ];

  return columns;
}

// Προαιρετικά: σταθερό export αν δεν χρειάζεσαι callbacks
export const personnelColumns: ColumnDef<PersonDTO, any>[] =
  makePersonnelColumns();
