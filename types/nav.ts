import type { UrlObject } from 'url';
import type { IconLike } from '@/components/app-ui';

export type LinkCategory =
  | 'database'
  | 'personnel'
  | 'documents'
  | 'application';

// Βάλε όλα τα keys που θες να μπορούν να εμφανίσουν badge
export type AdminCounts = {
  // tools/personnel
  directorates: number;
  departments: number;
  departmentSectors: number;
  headQuarters: number;
  formations: number;
  units: number;
  subUnits: number;
  branches: number;
  positions: number;

  //database
  database: number;
  // tools/documents
  docTypes: number;
  docTypeCategories: number;

  // tools/app
  countries: number;
  regions: number;
  organizations: number;

  // app
  documents: number;
  companies: number;
  equipments: number;
  personnel: number;
  tools: number;
};

export const initialCounts: AdminCounts = {
  directorates: 4,
  departments: 0,
  departmentSectors: 20,
  headQuarters: 5,
  formations: 12,
  units: 33,
  subUnits: 64,
  branches: 4,
  positions: 40,

  database: 0,
  docTypes: 6,
  docTypeCategories: 5,
  documents: 76,

  countries: 3,
  regions: 5,
  organizations: 6,

  companies: 4,
  equipments: 45,
  personnel: 145,
  tools: 0,
};

// Βασικός τύπος link (για main navigation, χωρίς υποχρεωτική κατηγορία)
export type AdminNavLink = {
  label: string;
  href: UrlObject;
  icon: IconLike | any;
  iconKey: string;
  // Όταν δεν θες badge, απλά ΠΑΡΑΛΕΙΨΕ το countKey (μην βάζεις null)
  countKey?: keyof AdminCounts;
  value?: string;
  accessibility?: string;
};

// Lookup link με υποχρεωτική κατηγορία (για grouping)
export type AdminLookupLink = AdminNavLink & {
  type: LinkCategory;
};

// Για grouping
export type Grouped = Record<LinkCategory, AdminLookupLink[]>;
