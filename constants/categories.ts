import type { PersonType, ServiceStatus } from '@prisma/client';

type OptionIVL<T extends string = string> = {
  id: T;
  value: T;
  label: string;
};

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
