import { appIcons } from './app-icons';
import type { Route } from 'next';

export type adminLink = {
  label: string;
  href: Route;
  icon: any;
  iconKey: string;
  countKey?: string | null;
  value?: string | null;
  accessibility?: string;
  type?: string;
};

export const adminLinks: readonly adminLink[] = [
  {
    label: 'Πίνακας Ελέγχου',
    href: '/dashboard',
    icon: appIcons.dashboard,
    iconKey: 'dashboard',
    countKey: null,
    accessibility: 'Πίνακας Ελέγχου',
  },
  {
    label: 'Προσωπικό',
    href: '/personnel',
    icon: appIcons.personnel,
    iconKey: 'personnel',
    countKey: 'personnel',
    accessibility: 'Προσωπικό',
  },
  {
    label: 'Χώρες',
    href: '/countries',
    icon: appIcons.countries,
    iconKey: 'countries',
    countKey: 'countries',
    accessibility: 'Χώρες',
  },
  {
    label: 'Εξοπλισμοί',
    href: '/buildings',
    icon: appIcons.equipment,
    iconKey: 'buildings',
    countKey: 'buildings',
    accessibility: 'Εξοπλισμοί',
  },
  {
    label: 'Εταιρείες',
    href: '/companies',
    icon: appIcons.companies,
    iconKey: 'companies',
    countKey: 'companies',
    accessibility: 'Εταιρείες',
  },
  {
    label: 'Έγγραφα',
    href: '/documents',
    icon: appIcons.documents,
    iconKey: 'documents',
    countKey: 'documents',
    accessibility: 'Εταιρείες',
  },
  {
    label: 'Εργαλεία',
    href: '/tools',
    icon: appIcons.tools,
    iconKey: 'tools',
    countKey: 'tools',
    accessibility: 'Εργαλεία',
  },
] as const;

export const lookUpDataLinks: adminLink[] = [
  {
    label: 'Διευθύνσεις',
    href: '/admin/dashboard/tools/directorates',
    icon: appIcons.directorates,
    iconKey: 'directorates',
    countKey: 'directorates',
    value: 'directorates',
    type: 'personnel',
  },
  {
    label: 'Τμήματα',
    href: '/admin/dashboard/tools/departments',
    icon: appIcons.departments,
    iconKey: 'departments',
    countKey: 'departments',
    value: 'departments',
    type: 'personnel',
  },
  {
    label: 'Τομείς',
    href: '/admin/dashboard/tools/department-sectors',
    icon: appIcons.sectors,
    iconKey: 'departmentSectors',
    countKey: 'departmentSectors',
    value: 'departmentSectors',
    type: 'personnel',
  },
  {
    label: 'Μείζονες Μονάδες',
    href: '/admin/dashboard/tools/main-units',
    icon: appIcons.mainUnits,
    iconKey: 'mainUnits',
    countKey: 'mainUnits',
    value: 'mainUnits',
    type: 'personnel',
  },
  {
    label: 'Υπο Μονάδες',
    href: '/admin/dashboard/tools/interim-units',
    icon: appIcons.interimUnits,
    iconKey: 'interimUnits',
    countKey: 'interimUnits',
    value: 'interimUnits',
    type: 'personnel',
  },
  {
    label: 'Μονάδες',
    href: '/admin/dashboard/tools/units',
    icon: appIcons.units,
    iconKey: 'units',
    countKey: 'units',
    value: 'units',
    type: 'personnel',
  },
  {
    label: 'Κλάδοι',
    href: '/admin/dashboard/tools/branches',
    icon: appIcons.branches,
    iconKey: 'branches',
    countKey: 'branches',
    value: 'branches',
    type: 'personnel',
  },
  {
    label: 'Καθήκοντα',
    href: '/admin/dashboard/tools/positions',
    icon: appIcons.positions,
    iconKey: 'positions',
    countKey: 'positions',
    value: 'positions',
    type: 'personnel',
  },
  {
    label: 'Τύποι Εγγράφων',
    href: '/admin/dashboard/tools/docTypes',
    icon: appIcons.docTypes,
    iconKey: 'docTypes',
    countKey: 'docTypes',
    value: 'docTypes',
    type: 'documents',
  },
  {
    label: 'Τύποι Εξερχομένων Εγγράφων',
    href: '/admin/dashboard/tools/docTypeCategories',
    icon: appIcons.docTypeCategories,
    iconKey: 'docTypeCategories',
    countKey: 'docTypeCategories',
    value: 'docTypeCategories',
    type: 'documents',
  },
  {
    label: 'Χώρες',
    href: '/staff/dashboard/tools/countries',
    icon: appIcons.countries,
    iconKey: 'countries',
    countKey: 'countries',
    value: 'countries',
    type: 'application',
  },
  {
    label: 'Γεωγραφικές Περιοχές',
    href: '/staff/dashboard/tools/regions',
    icon: appIcons.regions,
    iconKey: 'regions',
    countKey: 'regions',
    value: 'regions',
    type: 'application',
  },
  {
    label: 'Οργανισμοί',
    href: '/staff/dashboard/tools/organizations',
    icon: appIcons.organizations,
    iconKey: 'organizations',
    countKey: 'organizations',
    value: 'organizations',
    type: 'application',
  },
] as const;

export const navLinks: adminLink[] = [
  {
    href: '/',
    label: 'Πίνακας Ελέγχου',
    icon: appIcons.dashboard,
    iconKey: 'dashboard',
    accessibility: 'Πίνακας Ελέγχου',
  },
  //   {
  //     href: '/reports ',
  //     label: 'Αναφορές',
  //     icon: appIcons.reports,
  //     iconKey: 'reports',
  //     accessibility: 'Αναφορές',
  //   },
  {
    href: '/profile ',
    label: 'Προφιλ',
    icon: appIcons.user_user,
    iconKey: 'user_user',
    accessibility: 'Προφιλ',
  },
  //   {
  //     href: '/admin/dashboard ',
  //     label: 'Κεντρική Διαχείριση',
  //     icon: appIcons.dashboard,
  //     iconKey: 'admin',
  //     accessibility: 'Κεντρική Διαχείριση',
  //   },
];
