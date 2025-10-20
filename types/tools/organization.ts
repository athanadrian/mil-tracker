import z from 'zod';
import { organizationSchema } from '@/validations/tools/organization.validation';

export type OrganizationInput = z.infer<typeof organizationSchema>;
// types/tools/organization.ts
import type { OrganizationType } from '@prisma/client';

export type CountryMiniDTO = {
  id: string;
  name: string;
  iso2?: string | null;
  flag?: string | null;
};

export type OrganizationParentMiniDTO = {
  id: string;
  name: string;
  code?: string | null;
};

/**
 * Πλήρες DTO για Organization όπως το επιστρέφουμε από getOrganizations()
 * - Περιλαμβάνει:
 *   - core πεδία (type, code, description, organizationImage)
 *   - single FK (country/countryId) — αν το διατηρείς για συμβατότητα
 *   - hierarchy (parent/parentId)
 *   - M2M χώρες (countries[])
 *   - timestamps (ISO strings)
 */
export type OrganizationDTO = {
  id: string;
  name: string;
  type: OrganizationType;

  code?: string | null;
  description?: string | null;
  organizationImage?: string | null;

  // single FK (αν το κρατάς ακόμη)
  countryId?: string | null;
  country?: CountryMiniDTO | null;

  // ιεραρχία
  parentId?: string | null;
  parent?: OrganizationParentMiniDTO | null;

  // M2M χώρες (μέσω CountryOrganization)
  countries?: CountryMiniDTO[];

  createdAt?: string; // ISO
  updatedAt?: string; // ISO
};

/**
 * Input payload για φόρμα/ενέργειες (ταιριάζει στο zod schema + extra για M2M)
 * - Αν δεν θες single countryId πια, κράτα το ως optional/null
 * - countriesIds: οι επιλεγμένες χώρες (M2M)
 */
export type OrganizationInputDTO = {
  name: string;
  type: OrganizationType;

  code?: string | null;
  description?: string | null;
  organizationImage?: string | null;

  countryId?: string | null; // optional (legacy)
  parentId?: string | null; // για ιεραρχία

  countriesIds?: string[]; // M2M επιλογές
};
