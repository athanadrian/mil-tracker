'use server';

import { prisma } from '@/lib/db';
import { toStringArray } from '@/lib/utils';
import { GetPersonnelArgs } from '@/types/person';
import type {
  Prisma,
  PostingType,
  ServiceStatus,
  UnitType,
  PersonType,
} from '@prisma/client';

/* =======================
   DTO types
======================= */

export type InstallationDTO = {
  id: string;
  type: PostingType;
  startDate: string; // ISO
  endDate?: string | null; // ISO
  installationYear?: number | null;
  unit?: {
    id: string;
    name: string;
    code?: string | null;
    type: UnitType;
  } | null;
  organization?: { id: string; name: string } | null;
  country?: { id: string; name: string; flag?: string | null } | null;
  position?: { id: string; name: string; code?: string | null } | null;
  rankAtTime?: { id: string; name: string; code?: string | null } | null;
};

export type PromotionDTO = {
  year: number;
  rank: { id: string; name: string; code?: string | null };
};

export type PersonDTO = {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string | null;

  type: PersonType;
  status: ServiceStatus;
  retiredYear: number | null;

  /** JSON από τη βάση (avatar, gallery κ.λπ.) */
  personImagePaths: Prisma.JsonValue | null;

  country?: { id: string; name: string; flag?: string | null } | null;
  branch?: { id: string; name: string; code?: string | null } | null;
  rank?: { id: string; name: string; code?: string | null } | null;

  promotions: PromotionDTO[];
  installations: InstallationDTO[];
  meetingsCount: number;
};

/* ================== Single person (by id) ================== */

export type InstallationDetailDTO = {
  id: string;
  type: PostingType;
  startDate: string; // ISO
  endDate?: string | null; // ISO
  installationYear?: number | null;
  role?: string | null;
  orderNumber?: string | null;
  orderDate?: string | null; // ISO
  unit?:
    | { id: string; name: string; code?: string | null; type: UnitType }
    | undefined;
  organization?: { id: string; name: string; code?: string | null } | undefined;
  country: {
    id: string;
    name: string;
    iso2?: string | null; // <-- επιτρέπει null
    flag?: string | null;
  } | null;
  position?: { id: string; name: string; code?: string | null } | undefined;
  rankAtTime?:
    | { id: string; name: string; code?: string | null; tier: string }
    | undefined;
};

export type PromotionDetailDTO = {
  id: string;
  promotionYear: number;
  rank: {
    id: string;
    name: string;
    code?: string | null;
    tier: string;
    level?: number | null;
  };
};

export type PersonDetailDTO = {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string | null;

  type: PersonType;
  status: ServiceStatus;
  retiredYear: number | null;

  email?: string | null;
  phone?: string | null;
  description?: string | null;

  /** JSON από τη βάση (avatar, gallery κ.λπ.) */
  personImagePaths: Prisma.JsonValue | null;

  country: {
    id: string;
    name: string;
    iso2?: string | null; // <-- επιτρέπει null
    flag?: string | null;
  } | null;
  branch: { id: string; name: string; code?: string | null } | null;
  rank: { id: string; name: string; code?: string | null; tier: string } | null;
  specialty: { id: string; name: string; code?: string | null } | null;
  organization: { id: string; name: string; code?: string | null } | null;
  company: { id: string; name: string } | null;

  meetingsCount: number;
  hasMeetings: boolean;

  latestInstallation: InstallationDetailDTO | null;
  installations: InstallationDetailDTO[];
  promotions: PromotionDetailDTO[];
};

/* =======================
   Helpers (sorting, dir)
======================= */
const safeSortField = (sortBy?: string) => {
  const allowed: Record<string, true> = {
    lastName: true,
    firstName: true,
    status: true,
    type: true,
    retiredAt: true,
    createdAt: true,
    updatedAt: true,
    // pseudo fields that map to nested sorts
    rank: true,
    branch: true,
    country: true,
  };
  return sortBy && allowed[sortBy] ? sortBy : 'lastName';
};

const dir = (v?: string): 'asc' | 'desc' => (v === 'desc' ? 'desc' : 'asc');

// Build Prisma orderBy supporting a handful of nested relations
function buildOrderBy(sortBy?: string, sortDir?: string) {
  const field = safeSortField(sortBy);
  const direction = dir(sortDir);

  if (field === 'rank')
    return [
      { rank: { name: direction } },
      { lastName: 'asc' },
      { firstName: 'asc' },
      { id: 'asc' },
    ];
  if (field === 'branch')
    return [
      { branch: { name: direction } },
      { lastName: 'asc' },
      { firstName: 'asc' },
      { id: 'asc' },
    ];
  if (field === 'country')
    return [
      { country: { name: direction } },
      { lastName: 'asc' },
      { firstName: 'asc' },
      { id: 'asc' },
    ];

  // default scalar field sort with stable tie-breakers
  return [
    { [field]: direction } as any,
    { lastName: 'asc' },
    { firstName: 'asc' },
    { id: 'asc' },
  ];
}

/* =======================
   Types
======================= */

export type PersonnelListItem = PersonDTO; // same shape as your DTO list item

export type PersonnelListPayload = {
  items: PersonnelListItem[];
  nextCursor: string | null;
  totalCount: number;
  breakdown: {
    active: number;
    retired: number;
    byType: Record<string, number>;
  };
};

/* =======================
   Query (cursor-based)
======================= */
export const getPersonnelData = async ({
  take = 50,
  sortBy = 'lastName',
  sortDir = 'asc',
  cursor,
  filters = {},
}: GetPersonnelArgs = {}): Promise<PersonnelListPayload> => {
  // Safety caps
  take = Math.min(200, Math.max(1, take));

  // Normalize filters (allow array or single)
  const norm = <T>(val?: T | T[]): T[] =>
    Array.isArray(val) ? val : val ? [val] : [];

  const branchIds = norm(filters.branchId);
  const countryIds = norm(filters.countryId);
  const statuses = norm(filters.status);
  const types = norm(filters.type);

  const q = (filters.q || '').trim();
  const txt = { contains: q }; // SQLite: χωρίς mode
  const maybeYear = /^\d{4}$/.test(q) ? Number(q) : null;

  const startOfYear = (y: number) => new Date(y, 0, 1);
  const startOfNextYear = (y: number) => new Date(y + 1, 0, 1);

  const where: Prisma.PersonWhereInput = {
    ...(q
      ? {
          OR: [
            // Person text fields
            { firstName: txt },
            { lastName: txt },
            { nickname: txt },

            // current person relations (χρησιμοποίησε relation where)
            { rank: { is: { name: txt } } },
            { rank: { is: { code: txt } } },
            { branch: { is: { name: txt } } },
            { country: { is: { name: txt } } },

            // PROMOTIONS
            {
              promotions: {
                some: {
                  OR: [
                    { rank: { is: { name: txt } } },
                    { rank: { is: { code: txt } } },
                    ...(maybeYear ? [{ promotionYear: maybeYear }] : []),
                  ],
                },
              },
            },

            // INSTALLATIONS / POSTINGS
            {
              postings: {
                some: {
                  OR: [
                    { role: txt },
                    { unit: { is: { name: txt } } },
                    { unit: { is: { code: txt } } },
                    { organization: { is: { name: txt } } },
                    { country: { is: { name: txt } } },
                    { position: { is: { name: txt } } },
                    { position: { is: { code: txt } } },
                    { rankAtTime: { is: { name: txt } } },
                    { rankAtTime: { is: { code: txt } } },

                    ...(maybeYear ? [{ installationYear: maybeYear }] : []),
                    ...(maybeYear
                      ? [
                          {
                            startDate: {
                              gte: startOfYear(maybeYear),
                              lt: startOfNextYear(maybeYear),
                            },
                          },
                          {
                            endDate: {
                              gte: startOfYear(maybeYear),
                              lt: startOfNextYear(maybeYear),
                            },
                          },
                        ]
                      : []),
                  ],
                },
              },
            },

            // retiredAt στο ίδιο έτος (optional)
            ...(maybeYear
              ? [
                  {
                    retiredAt: {
                      gte: startOfYear(maybeYear),
                      lt: startOfNextYear(maybeYear),
                    },
                  },
                ]
              : []),
          ],
        }
      : {}),

    // υπόλοιπα filters
    ...(branchIds.length ? { branchId: { in: branchIds } } : {}),
    ...(countryIds.length ? { countryId: { in: countryIds } } : {}),
    ...(statuses.length ? { status: { in: statuses } } : {}),
    ...(types.length ? { type: { in: types } } : {}),
  };

  const orderBy = buildOrderBy(sortBy, sortDir);

  const items = await prisma.person.findMany({
    where,
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy,
    include: {
      country: { select: { id: true, name: true, flag: true } },
      branch: { select: { id: true, name: true, code: true } },
      rank: { select: { id: true, name: true, code: true } },
      promotions: {
        include: { rank: { select: { id: true, name: true, code: true } } },
      },
      postings: {
        include: {
          unit: { select: { id: true, name: true, code: true, type: true } },
          organization: { select: { id: true, name: true } },
          country: { select: { id: true, name: true, flag: true } },
          position: { select: { id: true, name: true, code: true } },
          rankAtTime: { select: { id: true, name: true, code: true } },
        },
      },
      meetings: { select: { meetingId: true } },
    },
  });

  const nextCursor = items.length === take ? items[items.length - 1].id : null;

  // Map to DTOs
  const dtoItems: PersonDTO[] = items.map((p) => {
    const retiredYear =
      p.status === 'RETIRED' && p.retiredAt
        ? new Date(p.retiredAt).getFullYear()
        : null;

    const installations: InstallationDTO[] = p.postings.map((pp) => ({
      id: pp.id,
      type: pp.type,
      startDate: pp.startDate.toISOString(),
      endDate: pp.endDate ? pp.endDate.toISOString() : null,
      installationYear: pp.installationYear ?? null,
      unit: pp.unit
        ? {
            id: pp.unit.id,
            name: pp.unit.name,
            code: pp.unit.code,
            type: pp.unit.type,
          }
        : null,
      organization: pp.organization
        ? { id: pp.organization.id, name: pp.organization.name }
        : null,
      country: pp.country
        ? { id: pp.country.id, name: pp.country.name, flag: pp.country.flag }
        : null,
      position: pp.position
        ? { id: pp.position.id, name: pp.position.name, code: pp.position.code }
        : null,
      rankAtTime: pp.rankAtTime
        ? {
            id: pp.rankAtTime.id,
            name: pp.rankAtTime.name,
            code: pp.rankAtTime.code,
          }
        : null,
    }));

    const promotions: PromotionDTO[] = p.promotions
      .map((pr) => ({
        year: pr.promotionYear,
        rank: { id: pr.rank.id, name: pr.rank.name, code: pr.rank.code },
      }))
      .sort((a, b) => a.year - b.year);

    return {
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      nickname: p.nickname,
      type: p.type,
      status: p.status,
      retiredYear,
      personImagePaths: (p.personImagePaths ?? null) as Prisma.JsonValue | null,
      country: p.country
        ? { id: p.country.id, name: p.country.name, flag: p.country.flag }
        : null,
      branch: p.branch
        ? { id: p.branch.id, name: p.branch.name, code: p.branch.code }
        : null,
      rank: p.rank
        ? { id: p.rank.id, name: p.rank.name, code: p.rank.code }
        : null,
      promotions,
      installations,
      meetingsCount: p.meetings.length,
    };
  });

  // Aggregates
  const [totalCount, active, retired, typeRows] = await Promise.all([
    prisma.person.count({ where }),
    prisma.person.count({
      where: { ...where, status: 'ACTIVE' as ServiceStatus },
    }),
    prisma.person.count({
      where: { ...where, status: 'RETIRED' as ServiceStatus },
    }),
    prisma.person.groupBy({ by: ['type'], _count: { _all: true }, where }),
  ]);

  const byType: Record<string, number> = {};
  for (const row of typeRows)
    byType[(row as any).type] = (row as any)._count._all;

  return {
    items: dtoItems,
    nextCursor,
    totalCount,
    breakdown: { active, retired, byType },
  };
};

// -----------------------------
// FETCH MORE (append-only payload)
// -----------------------------
export const fetchMorePersonnel = async ({
  cursor,
  filters = {},
  take = 50,
  sortBy = 'lastName',
  sortDir = 'asc',
}: GetPersonnelArgs) => {
  const res = await getPersonnelData({
    take,
    sortBy,
    sortDir,
    cursor: cursor || undefined,
    filters,
  });
  return {
    items: res.items,
    nextCursor: res.nextCursor,
  };
};

/* =======================
   Single person (by id)
   — aligned with your Detail DTOs
======================= */
export const getPersonDetailById = async (
  id: string
): Promise<PersonDetailDTO | null> => {
  const p = await prisma.person.findUnique({
    where: { id },
    include: {
      country: { select: { id: true, name: true, iso2: true, flag: true } },
      branch: { select: { id: true, name: true, code: true } },
      rank: { select: { id: true, name: true, code: true, tier: true } },
      specialty: { select: { id: true, name: true, code: true } },
      organization: { select: { id: true, name: true, code: true } },
      company: { select: { id: true, name: true } },
      promotions: {
        select: {
          id: true,
          promotionYear: true,
          rank: {
            select: {
              id: true,
              name: true,
              code: true,
              tier: true,
              level: true,
            },
          },
        },
      },
      postings: {
        include: {
          unit: { select: { id: true, name: true, code: true, type: true } },
          organization: { select: { id: true, name: true, code: true } },
          country: { select: { id: true, name: true, iso2: true, flag: true } },
          position: { select: { id: true, name: true, code: true } },
          rankAtTime: {
            select: { id: true, name: true, code: true, tier: true },
          },
        },
        orderBy: [{ startDate: 'desc' }],
      },
      meetings: { select: { meetingId: true } },
    },
  });

  if (!p) return null;

  const retiredYear =
    p.status === 'RETIRED' && p.retiredAt
      ? new Date(p.retiredAt).getFullYear()
      : null;

  const installations: InstallationDetailDTO[] = p.postings.map((pp) => ({
    id: pp.id,
    type: pp.type,
    startDate: pp.startDate.toISOString(),
    endDate: pp.endDate ? pp.endDate.toISOString() : null,
    installationYear: pp.installationYear ?? null,
    role: pp.role ?? null,
    orderNumber: pp.orderNumber ?? null,
    orderDate: pp.orderDate ? pp.orderDate.toISOString() : null,
    unit: pp.unit
      ? {
          id: pp.unit.id,
          name: pp.unit.name,
          code: pp.unit.code,
          type: pp.unit.type,
        }
      : undefined,
    organization: pp.organization
      ? {
          id: pp.organization.id,
          name: pp.organization.name,
          code: pp.organization.code,
        }
      : undefined,
    country: pp.country
      ? {
          id: pp.country.id,
          name: pp.country.name,
          flag: pp.country.flag ?? null,
        }
      : null,
    position: pp.position
      ? { id: pp.position.id, name: pp.position.name, code: pp.position.code }
      : undefined,
    rankAtTime: pp.rankAtTime
      ? {
          id: pp.rankAtTime.id,
          name: pp.rankAtTime.name,
          code: pp.rankAtTime.code,
          tier: (pp.rankAtTime as any).tier,
        }
      : undefined,
  }));

  const promotions: PromotionDetailDTO[] = p.promotions
    .map((pr) => ({
      id: pr.id,
      promotionYear: pr.promotionYear,
      rank: {
        id: pr.rank.id,
        name: pr.rank.name,
        code: pr.rank.code ?? undefined,
        tier: pr.rank.tier,
        level: (pr.rank as any).level ?? null,
      },
    }))
    .sort((a, b) => a.promotionYear - b.promotionYear);

  const latestInstallation = installations[0] ?? null; // because postings ordered desc

  const detail: PersonDetailDTO = {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    nickname: p.nickname,
    type: p.type,
    status: p.status,
    retiredYear,
    email: (p as any).email ?? null,
    phone: (p as any).phone ?? null,
    personImagePaths: (p.personImagePaths ?? null) as Prisma.JsonValue | null,
    country: p.country
      ? {
          id: p.country.id,
          name: p.country.name,
          iso2: p.country.iso2,
          flag: p.country.flag,
        }
      : null,
    branch: p.branch
      ? { id: p.branch.id, name: p.branch.name, code: p.branch.code }
      : null,
    rank: p.rank
      ? {
          id: p.rank.id,
          name: p.rank.name,
          code: p.rank.code,
          tier: (p.rank as any).tier,
        }
      : null,
    specialty: p.specialty
      ? { id: p.specialty.id, name: p.specialty.name, code: p.specialty.code }
      : null,
    organization: p.organization
      ? {
          id: p.organization.id,
          name: p.organization.name,
          code: p.organization.code,
        }
      : null,
    company: p.company ? { id: p.company.id, name: p.company.name } : null,
    meetingsCount: p.meetings.length,
    hasMeetings: p.meetings.length > 0,
    latestInstallation,
    installations,
    promotions,
  };

  return detail
    ? {
        ...detail,
        personImagePaths: toStringArray(detail.personImagePaths),
      }
    : null;
};
