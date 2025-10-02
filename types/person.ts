// e.g. src/lib/types/person.ts
import type { PersonType, ServiceStatus } from '@prisma/client';

/**
 * Filters για το personnel listing.
 * - Τα ids δέχονται single ή array (multi-select).
 * - Τα enums δέχονται single ή array τιμές.
 */
export type PersonFilters = {
  q?: string; // full-text (firstName/lastName/nickname)
  branchId?: string | string[];
  countryId?: string | string[];
  rankId?: string | string[];
  status?: ServiceStatus | ServiceStatus[];
  type?: PersonType | PersonType[];
};

export type GetPersonnelArgs = {
  take?: number; // default 50
  sortBy?: string; // see safeSortField
  sortDir?: 'asc' | 'desc';
  cursor?: string | null; // id cursor
  filters?: PersonFilters;
};
