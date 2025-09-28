'use server';

import { prisma } from '@/lib/db';
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
  country?: { id: string; name: string } | null;
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

  country?: { id: string; name: string } | null;
  branch?: { id: string; name: string; code?: string | null } | null;
  rank?: { id: string; name: string; code?: string | null } | null;

  promotions: PromotionDTO[];
  installations: InstallationDTO[];
  meetingsCount: number;
};

/* =======================
   Prisma payload type
======================= */

type PersonWithRelations = Prisma.PersonGetPayload<{
  include: {
    country: { select: { id: true; name: true } };
    branch: { select: { id: true; name: true; code: true } };
    rank: { select: { id: true; name: true; code: true } };
    promotions: {
      include: { rank: { select: { id: true; name: true; code: true } } };
    };
    postings: {
      include: {
        unit: { select: { id: true; name: true; code: true; type: true } };
        organization: { select: { id: true; name: true } };
        country: { select: { id: true; name: true } };
        position: { select: { id: true; name: true; code: true } };
        rankAtTime: { select: { id: true; name: true; code: true } };
      };
    };
    meetings: { select: { meetingId: true } };
  };
}>;

/* =======================
   Φίλτρα & paging
======================= */

export type PersonFilters = {
  search?: string;
  branchId?: string;
  countryId?: string;
  status?: ServiceStatus;
  type?: PersonType;
};

export type Paging = {
  page?: number; // 1-based
  pageSize?: number; // default 50
};

/* ================== Helpers ================== */

function toISO(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

/* =======================
   Server Action
======================= */

export const getPersonnelData = async (
  filters: PersonFilters = {},
  paging: Paging = {}
): Promise<PersonDTO[]> => {
  const page = Math.max(1, paging.page ?? 1);
  const take = Math.min(200, Math.max(1, paging.pageSize ?? 50));
  const skip = (page - 1) * take;

  // SQLite: χωρίς mode: 'insensitive'
  const where: Prisma.PersonWhereInput = {
    ...(filters.search
      ? {
          OR: [
            { firstName: { contains: filters.search } },
            { lastName: { contains: filters.search } },
            { nickname: { contains: filters.search } },
          ],
        }
      : {}),
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
    ...(filters.countryId ? { countryId: filters.countryId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.type ? { type: filters.type } : {}),
  };

  const persons: PersonWithRelations[] = await prisma.person.findMany({
    where,
    include: {
      country: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true, code: true } },
      rank: { select: { id: true, name: true, code: true } },
      promotions: {
        include: { rank: { select: { id: true, name: true, code: true } } },
      },
      postings: {
        include: {
          unit: { select: { id: true, name: true, code: true, type: true } },
          organization: { select: { id: true, name: true } },
          country: { select: { id: true, name: true } },
          position: { select: { id: true, name: true, code: true } },
          rankAtTime: { select: { id: true, name: true, code: true } },
        },
      },
      meetings: { select: { meetingId: true } },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    skip,
    take,
  });

  const result: PersonDTO[] = persons.map((p) => {
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
      country: pp.country ? { id: pp.country.id, name: pp.country.name } : null,
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
      country: p.country ? { id: p.country.id, name: p.country.name } : null,
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

  return result;
};

/* ================== Single person (by id) ================== */

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
  country?: { id: string; name: string; iso2?: string | null } | undefined;
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

  country: { id: string; name: string; iso2?: string | null } | null;
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

export async function getPersonById(
  id: string
): Promise<PersonDetailDTO | null> {
  const p = await prisma.person.findUnique({
    where: { id },
    include: {
      country: { select: { id: true, name: true, iso2: true } },
      branch: { select: { id: true, name: true, code: true } },
      rank: { select: { id: true, name: true, code: true, tier: true } },
      specialty: { select: { id: true, name: true, code: true } },
      organization: { select: { id: true, name: true, code: true } },
      company: { select: { id: true, name: true } },
      postings: {
        orderBy: { startDate: 'desc' },
        include: {
          unit: { select: { id: true, name: true, code: true, type: true } },
          organization: { select: { id: true, name: true, code: true } },
          country: { select: { id: true, name: true, iso2: true } },
          position: { select: { id: true, name: true, code: true } },
          rankAtTime: {
            select: { id: true, name: true, code: true, tier: true },
          },
        },
      },
      promotions: {
        orderBy: { promotionYear: 'desc' },
        include: {
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
      _count: { select: { meetings: true } },
    },
  });

  if (!p) return null;

  // Προσοχή: δεν χρησιμοποιούμε enum value imports — κάνουμε σύγκριση με literal
  const retiredYear =
    p.status === ('RETIRED' as ServiceStatus) && p.retiredAt
      ? new Date(p.retiredAt).getFullYear()
      : null;

  const installations: InstallationDetailDTO[] = p.postings.map((pp) => ({
    id: pp.id,
    type: pp.type,
    startDate: toISO(pp.startDate)!,
    endDate: toISO(pp.endDate),
    installationYear: pp.installationYear ?? null,
    role: pp.role ?? null,
    orderNumber: pp.orderNumber ?? null,
    orderDate: toISO(pp.orderDate),
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
      ? { id: pp.country.id, name: pp.country.name, iso2: pp.country.iso2 }
      : undefined,
    position: pp.position
      ? { id: pp.position.id, name: pp.position.name, code: pp.position.code }
      : undefined,
    rankAtTime: pp.rankAtTime
      ? {
          id: pp.rankAtTime.id,
          name: pp.rankAtTime.name,
          code: pp.rankAtTime.code,
          tier: pp.rankAtTime.tier,
        }
      : undefined,
  }));

  const promotions: PromotionDetailDTO[] = p.promotions.map((pr) => ({
    id: pr.id,
    promotionYear: pr.promotionYear,
    rank: {
      id: pr.rank.id,
      name: pr.rank.name,
      code: pr.rank.code,
      tier: pr.rank.tier,
      level: pr.rank.level,
    },
  }));

  return {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    nickname: p.nickname,

    type: p.type,
    status: p.status,
    retiredYear,

    email: p.email,
    phone: p.phone,

    country: p.country
      ? { id: p.country.id, name: p.country.name, iso2: p.country.iso2 }
      : null,
    branch: p.branch
      ? { id: p.branch.id, name: p.branch.name, code: p.branch.code }
      : null,
    rank: p.rank
      ? {
          id: p.rank.id,
          name: p.rank.name,
          code: p.rank.code,
          tier: p.rank.tier,
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

    meetingsCount: p._count.meetings,
    hasMeetings: p._count.meetings > 0,

    latestInstallation: installations[0] ?? null,
    installations,
    promotions,
  };
}
