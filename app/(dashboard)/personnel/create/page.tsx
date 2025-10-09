import { getPersonDetailById } from '@/actions/person.actions';
import { AppPageBreadcrumbs, AppPageTitle } from '@/components/app-ui';
import React from 'react';

type Props = {
  searchParams: { edit?: string };
};

const AddEditPersonPage = async ({ searchParams }: Props) => {
  const sp = await searchParams;
  const editId = sp?.edit;
  let crumbLabel = 'Δημιουργία';

  if (editId) {
    const person = await getPersonDetailById(editId);
    const name =
      `${person?.firstName ?? ''} ${person?.lastName ?? ''}`.trim() ||
      'Άγνωστος';
    crumbLabel = `Επεξεργασία (${name})`;
  }

  return (
    <div className='p-4 space-y-6'>
      <AppPageBreadcrumbs
        base={{ href: '/', label: 'Πίνακας Ελέγχου' }}
        segmentLabels={{ personnel: 'Προσωπικό', create: crumbLabel }}
      />

      <AppPageTitle
        title={crumbLabel}
        subtitle={editId ? `Επεξεργασία στοιχείων` : `Δημιουργία νέου`}
        actionLabel={editId ? 'Αποθήκευση' : undefined}
        actionIconKey={editId ? 'save' : undefined}
      />

      {/* ...your form/component for create/edit... */}
    </div>
  );
};

export default AddEditPersonPage;
