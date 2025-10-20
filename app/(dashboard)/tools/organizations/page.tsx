import React from 'react';
import { OrganizationsContainer } from '@/components/tools/organizations';
import { getOrganizations } from '@/actions/tools/organization.actions';
import { OrganizationDTO } from '@/types/tools/organization';
import {
  getSelectOptions,
  getSelectOptionsCached,
} from '@/actions/common.actions';
import { AppPageBreadcrumbs } from '@/components/app-ui';

// Υποθέτω ότι getOrganizations επιστρέφει απευθείας πίνακα OrganizationDTO.
// Αν επιστρέφει { ok, data } προσαρμόστε ανάλογα.
const OrganizationsPage = async () => {
  const [organizations, selectOptions] = await Promise.all([
    getOrganizations(),
    getSelectOptionsCached({
      include: { countries: true, organizations: true },
    }),
  ]);

  return (
    <div className='p-4 space-y-6'>
      <AppPageBreadcrumbs
        base={{ href: '/', label: 'Πίνακας Ελέγχου' }}
        segmentLabels={{ tools: 'Εργαλεία', organizations: 'Οργανισμοί' }}
      />
      <OrganizationsContainer
        organizations={organizations ?? []}
        selectOptions={selectOptions}
      />
    </div>
  );
};

export default OrganizationsPage;
