'use server';

import { cache as reactCache } from 'react';
import { unstable_cache as cache, revalidateTag } from 'next/cache';

import { prisma } from '@/lib/db';
import { AdminCounts } from '@/types/nav';
import { lookUpDataLinks } from '@/constants/links';

// Τα keys να ταιριάζουν με τα path segments σου
export type EntityKey =
  | 'countries'
  | 'personnel'
  | 'equipments'
  | 'companies'
  | 'documents'
  | 'meetings'
  | 'ranks'
  | 'positions'
  | 'units'
  | 'organizations'
  | 'branches'; // ServiceBranch
//****************** TO ADD *********************/
//   | 'departments'
//   | 'directorates'
//   | 'department-sectors'
//   | 'doc-types'
//   | 'doc-type-categories'

type Handler = {
  fetch: (id: string) => Promise<any>;
  format: (row: any) => string;
};

// Registry ανά entity
const ENTITY_HANDLERS: Record<EntityKey, Handler> = {
  units: {
    fetch: (id) =>
      prisma.unit.findUnique({
        where: { id },
        select: { name: true, code: true },
      }),
    format: (u) => (u?.code ? `${u.code} — ${u.name}` : u?.name) ?? '',
  },
  organizations: {
    fetch: (id) =>
      prisma.organization.findUnique({
        where: { id },
        select: { name: true, type: true },
      }),
    format: (o) => o?.name ?? '',
  },
  countries: {
    fetch: (id) =>
      prisma.country.findUnique({
        where: { id },
        select: { name: true, iso2: true },
      }),
    format: (c) => (c?.iso2 ? `${c.name} (${c.iso2})` : c?.name) ?? '',
  },
  personnel: {
    fetch: (id) =>
      prisma.person.findUnique({
        where: { id },
        select: {
          firstName: true,
          lastName: true,
          rank: { select: { name: true } },
        },
      }),
    format: (p) =>
      p
        ? `${p.lastName} ${p.firstName}${p.rank ? ` — ${p.rank.name}` : ''}`
        : '',
  },
  equipments: {
    fetch: (id) =>
      prisma.equipment.findUnique({
        where: { id },
        select: { name: true, model: true, category: true },
      }),
    format: (e) => (e?.model ? `${e.name} ${e.model}` : e?.name) ?? '',
  },
  companies: {
    fetch: (id) =>
      prisma.company.findUnique({ where: { id }, select: { name: true } }),
    format: (c) => c?.name ?? '',
  },
  documents: {
    fetch: (id) =>
      prisma.document.findUnique({ where: { id }, select: { name: true } }),
    format: (d) => d?.name ?? '',
  },
  branches: {
    fetch: (id) =>
      prisma.serviceBranch.findUnique({
        where: { id },
        select: { name: true },
      }),
    format: (b) => b?.name ?? '',
  },
  ranks: {
    fetch: (id) =>
      prisma.rank.findUnique({
        where: { id },
        select: { name: true, code: true },
      }),
    format: (r) => (r?.code ? `${r.code} — ${r.name}` : r?.name) ?? '',
  },
  positions: {
    fetch: (id) =>
      prisma.position.findUnique({
        where: { id },
        select: { name: true, code: true },
      }),
    format: (r) => (r?.code ? `${r.code} — ${r.name}` : r?.name) ?? '',
  },
  meetings: {
    fetch: (id) =>
      prisma.meeting.findUnique({
        where: { id },
        select: { date: true, location: true },
      }),
    format: (m) =>
      m
        ? `Συνάντηση ${new Date(m.date).toLocaleDateString()}${
            m.location ? ` — ${m.location}` : ''
          }`
        : '',
  },
};

// Ενιαία server action (με caching ανά request)
export const getEntityName = reactCache(
  async (entity: EntityKey, id: string): Promise<string | null> => {
    const handler = ENTITY_HANDLERS[entity];
    if (!handler || !id) return null;
    const row = await handler.fetch(id);
    const label = handler.format(row);
    return label || null;
  }
);

// “Ψεύτικα” counts για πίνακες που δεν έχουν υλοποιηθεί ακόμη
const FAKE_LOOKUPS = {
  directorates: 4,
  departments: 11,
  departmentSectors: 20,
  docTypes: 6,
  docTypeCategories: 5,
} as const;

export const getSidebarCounts = cache(
  async (): Promise<AdminCounts> => {
    // Πραγματικά counts σε ένα transaction
    const [
      countries,
      organizations,
      personnel,
      equipments,
      companies,
      documents,
      regions,
      positions,
      branches,
      headQuarters,
      formations,
      units,
      subUnits,
    ] = await prisma.$transaction([
      prisma.country.count(),
      prisma.organization.count(),
      prisma.person.count(),
      prisma.equipment.count(),
      prisma.company.count(),
      prisma.document.count(),
      prisma.region.count(),
      prisma.position.count(),
      prisma.serviceBranch.count(),

      // Units by type
      prisma.unit.count({ where: { type: 'HQ' } }),
      prisma.unit.count({ where: { type: 'FORMATION' } }),
      prisma.unit.count({ where: { type: 'UNIT' } }),
      prisma.unit.count({ where: { type: 'SUBUNIT' } }),
    ]);

    const tools = lookUpDataLinks.length;

    const result: AdminCounts = {
      // tools/personnel
      directorates: FAKE_LOOKUPS.directorates,
      departments: FAKE_LOOKUPS.departments,
      departmentSectors: FAKE_LOOKUPS.departmentSectors,
      headQuarters,
      formations,
      units,
      subUnits,
      branches,
      positions,

      // tools/documents
      docTypes: FAKE_LOOKUPS.docTypes,
      docTypeCategories: FAKE_LOOKUPS.docTypeCategories,

      // tools/app
      countries,
      regions,
      organizations,

      // app
      documents,
      companies,
      equipments,
      personnel,
      tools,
    };

    return result;
  },
  ['sidebar-counts'],
  { tags: ['sidebar-counts'] }
);

export async function revalidateSidebarCounts() {
  revalidateTag('sidebar-counts');
}
