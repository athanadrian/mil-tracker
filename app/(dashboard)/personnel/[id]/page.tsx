import { getPersonDetailById } from '@/actions/person.actions';
import { AppPageBreadcrumbs, AppPageTitle } from '@/components/app-ui';
import { PersonContainer } from '@/components/personnel';
import React from 'react';
type Props = { params: { id: string } };

const PersonPage = async ({ params }: Props) => {
  const { id } = params;
  const personDetails = await getPersonDetailById(id);
  console.log('personDetails', personDetails);

  const name =
    `${personDetails?.firstName ?? ''} ${
      personDetails?.lastName ?? ''
    }`.trim() || 'Άγνωστος';

  return (
    <div className='p-4 space-y-6'>
      <AppPageBreadcrumbs
        base={{ href: '/', label: 'Πίνακας Ελέγχου' }}
        segmentLabels={{ personnel: 'Προσωπικό', [id]: name }}
      />

      <AppPageTitle
        title={name}
        subtitle={`Προβολή στοιχείων ${name}`}
        actionLabel='Επεξεργασία'
        actionHref={`/personnel/create?edit=${id}`}
        actionIconKey='edit'
      />
      <PersonContainer person={personDetails!} />
    </div>
  );
};

export default PersonPage;
