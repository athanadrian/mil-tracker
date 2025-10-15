import { getPersonDetailById } from '@/actions/person.actions';
import { AppPageBreadcrumbs } from '@/components/app-ui';
import { PersonContainer } from '@/components/personnel';
import React from 'react';

type PageProps = {
  params: Promise<{ id: string }>;
};
const PersonPage = async ({ params }: PageProps) => {
  const { id } = await params;
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

      <PersonContainer person={personDetails!} name={name} />
    </div>
  );
};

export default PersonPage;
