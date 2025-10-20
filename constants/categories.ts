import { buildLabelMap } from '@/lib/utils';
import { OptionIVL } from '@/types/common';
import type {
  OrganizationType,
  PersonType,
  ServiceStatus,
} from '@prisma/client';

export const ORGANIZATION_TYPE_OPTIONS = [
  { id: 'MILITARY', value: 'MILITARY', label: 'Military' },
  { id: 'GOVERNMENT', value: 'GOVERNMENT', label: 'Government' },
  { id: 'NGO', value: 'NGO', label: 'NGO' },
  { id: 'ALLIANCE', value: 'ALLIANCE', label: 'Alliance Bloc' },
  { id: 'ECONOMIC_BLOC', value: 'ECONOMIC_BLOC', label: 'Economic ' },
  { id: 'MINISTRY', value: 'MINISTRY', label: 'Ministry' },
  { id: 'INTELLIGENCE', value: 'INTELLIGENCE', label: 'Intelligence' },
  {
    id: 'DEFENSE_MINISTRY',
    value: 'DEFENSE_MINISTRY',
    label: 'Defense Ministry',
  },
  { id: 'OTHER', value: 'OTHER', label: 'Other' },
] satisfies OptionIVL<OrganizationType>[];
export const ORG_TYPE_LABEL_MAP = buildLabelMap<OrganizationType>(
  ORGANIZATION_TYPE_OPTIONS
);

export const SERVICE_STATUS_OPTIONS = [
  { id: 'ACTIVE', value: 'ACTIVE', label: 'Ενεργός' },
  { id: 'RESERVE', value: 'RESERVE', label: 'Εφεδρεία' },
  { id: 'RETIRED', value: 'RETIRED', label: 'Αποστρατεία' },
] satisfies OptionIVL<ServiceStatus>[];

export const PERSON_TYPE_OPTIONS = [
  { id: 'MILITARY', value: 'MILITARY', label: 'Στρατιωτικός' },
  { id: 'CIVILIAN', value: 'CIVILIAN', label: 'Πολίτης' },
] satisfies OptionIVL<PersonType>[];

export const paginationTypes = [
  { id: 'pages', name: 'Σελιδοποίηση' },
  { id: 'loadMore', name: 'Φόρτωση άλλων' },
];

// Γρήγορος helper με find (καλό για ad-hoc χρήση)
export function getCategoryLabel(
  value: OrganizationType | string,
  categories: ReadonlyArray<OptionIVL>
): string {
  return categories.find((c) => c.value === value)?.label ?? String(value);
}
