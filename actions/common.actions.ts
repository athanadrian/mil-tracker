'use server';

import { cache as reactCache } from 'react';
import { unstable_cache as cache, revalidateTag } from 'next/cache';

import { prisma } from '@/lib/db';
import { AdminCounts } from '@/types/nav';
import { lookUpDataLinks } from '@/constants/links';
import { Prisma, UnitType } from '@prisma/client';
import { cap, toIdArray } from '@/lib/utils';

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
  database: 0,
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
      database: FAKE_LOOKUPS.database,
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

/* =======================
   Select Lookups (with cascades)
======================= */

export type SelectInclude = {
  countries?: boolean;
  regions?: boolean; // depends on your schema
  branches?: boolean;
  ranks?: boolean;
  organizations?: boolean;
  units?: boolean;
  positions?: boolean;
  specialties?: boolean;
  companies?: boolean;
};

export type GetSelectOptionsArgs = {
  // Optional cascade anchors
  cascade?: {
    countryId?: string | string[];
    regionId?: string | string[];
    organizationId?: string | string[];
    branchId?: string | string[];
    unitType?: UnitType | UnitType[];
  };

  include?: SelectInclude;

  // Per-lookup filtering / paging
  countriesWhere?: Prisma.CountryWhereInput;
  countriesTake?: number;
  countriesSkip?: number;

  regionsWhere?: any; // Prisma.RegionWhereInput if you have Region model
  regionsTake?: number;
  regionsSkip?: number;

  branchesWhere?: Prisma.ServiceBranchWhereInput;
  branchesTake?: number;
  branchesSkip?: number;

  ranksWhere?: Prisma.RankWhereInput;
  ranksTake?: number;
  ranksSkip?: number;

  organizationsWhere?: Prisma.OrganizationWhereInput;
  organizationsTake?: number;
  organizationsSkip?: number;

  unitsWhere?: Prisma.UnitWhereInput;
  unitsTake?: number;
  unitsSkip?: number;

  positionsWhere?: Prisma.PositionWhereInput;
  positionsTake?: number;
  positionsSkip?: number;

  specialtiesWhere?: Prisma.SpecialtyWhereInput;
  specialtiesTake?: number;
  specialtiesSkip?: number;

  companiesWhere?: Prisma.CompanyWhereInput;
  companiesTake?: number;
  companiesSkip?: number;
};

export const getSelectOptions = async ({
  cascade = {},
  include = {
    countries: true,
    regions: true,
    branches: true,
    ranks: true,
    organizations: true,
    units: true,
    positions: true,
    specialties: false,
    companies: false,
  },

  // Countries
  countriesWhere = {},
  countriesTake = 250,
  countriesSkip = 0,

  // Regions
  regionsWhere = {},
  regionsTake = 500,
  regionsSkip = 0,

  // Branches
  branchesWhere = {},
  branchesTake = 200,
  branchesSkip = 0,

  // Ranks
  ranksWhere = {},
  ranksTake = 500,
  ranksSkip = 0,

  // Organizations
  organizationsWhere = {},
  organizationsTake = 500,
  organizationsSkip = 0,

  // Units
  unitsWhere = {},
  unitsTake = 1000,
  unitsSkip = 0,

  // Positions
  positionsWhere = {},
  positionsTake = 500,
  positionsSkip = 0,

  // Specialties
  specialtiesWhere = {},
  specialtiesTake = 500,
  specialtiesSkip = 0,

  // Companies
  companiesWhere = {},
  companiesTake = 500,
  companiesSkip = 0,
}: GetSelectOptionsArgs = {}) => {
  const countryIds = toIdArray(cascade.countryId);
  const regionIds = toIdArray(cascade.regionId);
  const organizationIds = toIdArray(cascade.organizationId);
  const branchIds = toIdArray(cascade.branchId);
  const unitTypes = toIdArray(cascade.unitType as any);

  const tasks: Promise<void>[] = [];
  const res: Record<string, unknown> = {};

  if (include.countries) {
    tasks.push(
      prisma.country
        .findMany({
          where: { ...(countriesWhere || {}) },
          select: { id: true, name: true, iso2: true },
          orderBy: { name: 'asc' },
          take: cap(countriesTake, 1000),
          skip: countriesSkip || 0,
        })
        .then((v) => {
          (res as any).countries = v;
        })
    );
  }

  // If you don't have Region model, remove this block
  if (include.regions && (prisma as any).region) {
    const regionWhere = {
      ...(regionsWhere || {}),
      ...(countryIds.length ? { countryId: { in: countryIds } } : {}),
    } as any;

    tasks.push(
      (prisma as any).region
        .findMany({
          where: regionWhere,
          select: { id: true, name: true, code: true, countryId: true },
          orderBy: { name: 'asc' },
          take: cap(regionsTake, 2000),
          skip: regionsSkip || 0,
        })
        .then((v: any) => {
          (res as any).regions = v;
        })
    );
  }

  if (include.branches) {
    const where = {
      ...(branchesWhere || {}),
      ...(branchIds.length ? { id: { in: branchIds } } : {}),
    } as Prisma.ServiceBranchWhereInput;

    tasks.push(
      prisma.serviceBranch
        .findMany({
          where,
          select: { id: true, name: true, code: true },
          orderBy: { name: 'asc' },
          take: cap(branchesTake, 1000),
          skip: branchesSkip || 0,
        })
        .then((v) => {
          (res as any).branches = v;
        })
    );
  }

  if (include.ranks) {
    const where = {
      ...(ranksWhere || {}),
      ...(branchIds.length ? { branchId: { in: branchIds } } : {}), // if your Rank relates to Branch
    } as any;

    tasks.push(
      prisma.rank
        .findMany({
          where,
          select: { id: true, name: true, code: true, tier: true },
          orderBy: [{ tier: 'asc' as const }, { name: 'asc' as const }],
          take: cap(ranksTake, 2000),
          skip: ranksSkip || 0,
        })
        .then((v) => {
          (res as any).ranks = v;
        })
    );
  }

  if (include.organizations) {
    const where = {
      ...(organizationsWhere || {}),
      ...(countryIds.length ? { countryId: { in: countryIds } } : {}),
      ...(regionIds.length ? { regionId: { in: regionIds } } : {}), // if applicable
    } as any;

    tasks.push(
      prisma.organization
        .findMany({
          where,
          select: { id: true, name: true, code: true },
          orderBy: { name: 'asc' },
          take: cap(organizationsTake, 2000),
          skip: organizationsSkip || 0,
        })
        .then((v) => {
          (res as any).organizations = v;
        })
    );
  }

  if (include.units) {
    const where = {
      ...(unitsWhere || {}),
      ...(organizationIds.length
        ? { organizationId: { in: organizationIds } }
        : {}), // if Unit belongs to Organization
      ...(countryIds.length ? { countryId: { in: countryIds } } : {}), // if your schema has it
      ...(unitTypes.length ? { type: { in: unitTypes as any } } : {}),
    } as any;

    tasks.push(
      prisma.unit
        .findMany({
          where,
          select: {
            id: true,
            name: true,
            code: true,
            type: true /*, organizationId: true, countryId: true*/,
          },
          orderBy: { name: 'asc' },
          take: cap(unitsTake, 5000), // units can be many
          skip: unitsSkip || 0,
        })
        .then((v) => {
          (res as any).units = v;
        })
    );
  }

  if (include.positions) {
    tasks.push(
      prisma.position
        .findMany({
          where: { ...(positionsWhere || {}) },
          select: { id: true, name: true, code: true },
          orderBy: { name: 'asc' },
          take: cap(positionsTake, 2000),
          skip: positionsSkip || 0,
        })
        .then((v) => {
          (res as any).positions = v;
        })
    );
  }

  if (include.specialties && (prisma as any).specialty) {
    tasks.push(
      (prisma as any).specialty
        .findMany({
          where: { ...(specialtiesWhere || {}) },
          select: { id: true, name: true, code: true },
          orderBy: { name: 'asc' },
          take: cap(specialtiesTake, 2000),
          skip: specialtiesSkip || 0,
        })
        .then((v: any) => {
          (res as any).specialties = v;
        })
    );
  }

  if (include.companies && (prisma as any).company) {
    tasks.push(
      (prisma as any).company
        .findMany({
          where: { ...(companiesWhere || {}) },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
          take: cap(companiesTake, 2000),
          skip: companiesSkip || 0,
        })
        .then((v: any) => {
          (res as any).companies = v;
        })
    );
  }

  await Promise.all(tasks);
  return res; // JSON-safe
};

const BASE_TAG = 'lookups';

// σταθεροποίηση κλειδιού για τα args
function stableKey(args: unknown) {
  return JSON.stringify(args, Object.keys(args as any).sort());
}

// Παράγει tags ανάλογα με τα includes (π.χ. lookups:countries, lookups:ranks)
function tagsFromInclude(include?: SelectInclude) {
  const tags = [BASE_TAG];
  if (!include) return tags;
  for (const [k, v] of Object.entries(include)) {
    if (v) tags.push(`${BASE_TAG}:${k}`);
  }
  return tags;
}

/**
 * Cached wrapper της getSelectOptions.
 * Δεν πειράζουμε την getSelectOptions — απλώς την τυλίγουμε με unstable_cache.
 */
export async function getSelectOptionsCached(args: GetSelectOptionsArgs = {}) {
  const key = ['select-options', stableKey(args)];
  const tags = tagsFromInclude(args.include);

  const runner = cache(() => getSelectOptions(args), key, { tags });

  return runner();
}

/** Revalidate γενικά όλα τα lookups */
export async function revalidateAllLookups() {
  revalidateTag(BASE_TAG);
}

/** Revalidate μόνο συγκεκριμένα lookups (π.χ. 'countries', 'ranks') */
export async function revalidateLookups(...keys: (keyof SelectInclude)[]) {
  if (!keys.length) return revalidateAllLookups();
  for (const k of keys) revalidateTag(`${BASE_TAG}:${k}`);
}
