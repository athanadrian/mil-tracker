import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ReadonlyURLSearchParams } from 'next/navigation';

import { Prisma, ServiceStatus, PersonType } from '@prisma/client';
import { getEntityName, type EntityKey } from '@/actions/common.actions';
import { PersonFilters } from '@/types/person';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// helper για AutoBreadcrumbs κτλ.
export const loaderFor = (entity: EntityKey) => async (id: string) =>
  getEntityName(entity, id);

/* =======================
Common parseFilters (TypeScript)
- Joins arrays → CSV (a,b,c)
- Returns '' for missing keys → stable shape
- Includes ALL keys from searchParams
- Also guarantees all DEFAULT_FILTER_KEYS below
- Accepts extraKeys per page
======================= */

export const DEFAULT_FILTER_KEYS = [
  'q',
  // Ranges
  'dateFrom',
  'dateTo',
  // IDs (entities)
  'regionId',
  'countryId',
  'organizationId',
  'unitId',
  'parentUnitId',
  'branchId',
  'rankId',
  'specialtyId',
  'positionId',
  'personId',
  'meetingId',
  'equipmentId',
  'companyId',
  'documentId',
  'relatedId',
  // Enums / flags (schema-specific)
  'organizationType',
  'unitType',
  'personType',
  'equipmentCategory',
  'assignmentStatus',
  'rankTier',
  'relatedType',
  'postingType',
  'serviceStatus',
  'documentCategory',
  'documentAction',
  // Generic fallbacks (use sparingly so you can map to specific ones later)
  'status',
  'type',
] as const;

export type DefaultFilterKey = (typeof DEFAULT_FILTER_KEYS)[number];

export type ParsedFilters = Record<DefaultFilterKey, string> &
  Record<string, string>;

function toCsv(v: unknown): string {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map(String).filter(Boolean).join(',');
  return String(v);
}

function getAll(
  sp: URLSearchParams | Record<string, any>,
  key: string
): string[] {
  const anySp = sp as any;
  if (anySp && typeof anySp.getAll === 'function') {
    // URLSearchParams-like
    const arr = anySp.getAll(key);
    return Array.isArray(arr) ? arr.map(String) : [];
  }
  const raw = (sp as Record<string, any>)[key];
  if (Array.isArray(raw)) return raw.map(String);
  if (raw == null) return [];
  return [String(raw)];
}

export function parseFilters(
  sp: URLSearchParams | Record<string, string | string[] | undefined> = {},
  extraKeys: readonly string[] = []
): ParsedFilters {
  const keys = new Set<string>(DEFAULT_FILTER_KEYS as readonly string[]);

  // Add keys present in the provided search params
  if (sp && typeof (sp as any).keys === 'function') {
    // URLSearchParams
    for (const k of (sp as URLSearchParams).keys()) keys.add(k);
  } else if (sp && typeof sp === 'object') {
    for (const k of Object.keys(sp)) keys.add(k);
  }

  // Add caller-provided keys
  for (const k of extraKeys) keys.add(k);

  const out: Record<string, string> = {};
  for (const k of keys) {
    const vals = getAll(sp as any, k);
    out[k] = vals.length ? toCsv(vals) : '';
  }

  // Ensure TypeScript sees all defaults guaranteed
  const typed = out as ParsedFilters;
  return typed;
}

// Helpers for consumers
export const fromCsv = (s: string): string[] =>
  s ? s.split(',').filter(Boolean) : [];
export const boolFromCsv = (s: string): boolean | undefined =>
  s === '' ? undefined : s.split(',')[0] === 'true';

/* =======================
Filters adapter: ParsedFilters -> PersonFilters
- Μετατρέπει CSV strings σε arrays
- Κάνει validation στα enum values με βάση τα Prisma enums
======================= */

const arrOrU = <T>(arr: T[]): T[] | undefined => (arr.length ? arr : undefined);

function csvToEnumArr<T>(
  csv: string | undefined,
  enumObj: Record<string, string>
): T[] {
  if (!csv) return [];
  const raw = csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const allowed = new Set<string>(Object.values(enumObj));
  return raw.filter((v) => allowed.has(v)).map((v) => v as unknown as T);
}

export function toPersonFilters(pf: ParsedFilters): PersonFilters {
  const branchIds = fromCsv(pf.branchId || (pf as any).branch);
  const countryIds = fromCsv(pf.countryId || (pf as any).country);
  const rankIds = fromCsv(pf.rankId || (pf as any).rank);

  const statuses = csvToEnumArr<ServiceStatus>(
    pf.serviceStatus || pf.status,
    ServiceStatus
  );
  const types = csvToEnumArr<PersonType>(pf.personType || pf.type, PersonType);

  return {
    q: pf.q || undefined,
    branchId: arrOrU(branchIds),
    countryId: arrOrU(countryIds),
    rankId: arrOrU(rankIds),
    status: arrOrU(statuses),
    type: arrOrU(types),
  };
}

// robust counter for images in entityImagePaths JSON
export const countEntityImages = (json: any): number => {
  if (!json) return 0;
  try {
    // if string (single path)
    if (typeof json === 'string') return json ? 1 : 0;
    // if array of strings/objects
    if (Array.isArray(json)) return json.length;
    // object: look for common keys
    const keys = ['gallery', 'images', 'photos', 'paths'];
    let n = 0;
    for (const k of keys) {
      const v = (json as any)[k];
      if (Array.isArray(v)) n += v.length;
    }
    // avatar / thumbnail (single)
    if ((json as any).avatar) n += 1;
    if ((json as any).thumbnail) n += 1;
    return n;
  } catch {
    return 0;
  }
};

// utils/pushWithParams.ts

type ParamValue = string | number | boolean | null | undefined;

// Δέχεται οποιονδήποτε router με push(...args)
type RouterLike = { push: (...args: any[]) => void };

export function pushWithParams(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
  pathname: string,
  router: RouterLike,
  next: Record<string, ParamValue>
): void {
  const params = new URLSearchParams(searchParams.toString());

  for (const [k, v] of Object.entries(next)) {
    // ίδιο semantics με το αρχικό σου (falsy => delete):
    // αν θες ΜΟΝΟ ''/null/undefined να διαγράφονται, χρησιμοποίησε:
    // if (v === '' || v == null) { params.delete(k); } else { params.set(k, String(v)); }
    if (!v) params.delete(k);
    else params.set(k, String(v));
  }

  const qs = params.size ? `?${params.toString()}` : '';
  router.push(`${pathname}${qs}`, { scroll: false });
}

export const getAvatarFromPaths = (json: any): string | undefined => {
  if (!json) return undefined;
  try {
    if (typeof json === 'string') return json || undefined;
    if (json.avatar) return String(json.avatar);
    if (json.thumbnail) return String(json.thumbnail);
    const keys = ['gallery', 'images', 'photos', 'paths'];
    for (const k of keys) {
      const v = (json as any)[k];
      if (Array.isArray(v) && v.length) return String(v[0]);
    }
  } catch {}
  return undefined;
};

export const getAvatarFromImages = (json: any): string | null => {
  if (!json) return null;
  try {
    if (typeof json === 'string') return json || null;
    if ((json as any).avatar) return String((json as any).avatar);
    if ((json as any).thumbnail) return String((json as any).thumbnail);
    const gallery =
      (json as any).gallery ||
      (json as any).images ||
      (json as any).photos ||
      (json as any).paths;
    if (Array.isArray(gallery) && gallery.length) return String(gallery[0]);
    return null;
  } catch {
    return null;
  }
};

export const yearFromISO = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : String(d.getFullYear());
};

// ΠΑΝΤΑ επιστρέφει string[]
export const toIdArray = (v?: string | string[] | null) =>
  Array.isArray(v) ? v.filter(Boolean) : v ? [v] : [];

export const cap = (n: number | undefined, max = 1000) =>
  Math.min(Math.max(n ?? 50, 0), max);

export function toStringArray(json: unknown): string[] {
  if (json == null) return [];

  // array => stringify τα items
  if (Array.isArray(json)) return json.map((x) => String(x)).filter(Boolean);

  // string => είτε JSON.parse αν είναι '[...]', είτε ένα απλό path
  if (typeof json === 'string') {
    const s = json.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed))
        return parsed.map((x) => String(x)).filter(Boolean);
      return [s];
    } catch {
      return [s];
    }
  }

  // αντικείμενο με { paths: [...] }
  if (
    typeof json === 'object' &&
    'paths' in (json as any) &&
    Array.isArray((json as any).paths)
  ) {
    return (json as any).paths.map((x: any) => String(x)).filter(Boolean);
  }

  return [];
}

export function toStringArrayFromJson(
  v: Prisma.JsonValue | null | undefined
): string[] {
  if (!v) return [];
  try {
    if (Array.isArray(v)) {
      return v.map((x) => (typeof x === 'string' ? x : '')).filter(Boolean);
    }
    // αν έρχεται stringified json
    if (typeof v === 'string') {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) {
        return parsed
          .map((x) => (typeof x === 'string' ? x : ''))
          .filter(Boolean);
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export function fmtDate(d?: string | number | Date | null): string {
  if (!d) return '—';
  const dd = new Date(d);
  return isNaN(dd.getTime()) ? '—' : dd.toLocaleDateString();
}

// utils/formatDate.ts
export function formatDateISOToDDMMYYYY(iso: string, locale = 'el-GR') {
  // Αποφυγή timezone drift: κρατάμε UTC
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}
