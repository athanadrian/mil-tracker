import { getPersonDetailById } from '@/actions/person.actions';
import {
  AppCrudMenu,
  AppIcon,
  AppPageBreadcrumbs,
  AppPageTitle,
} from '@/components/app-ui';
import { PersonContainer } from '@/components/personnel';
import { Button } from '@/components/ui/button';
import { appIcons } from '@/constants/app-icons';
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

      <PersonContainer person={personDetails!} name={name} />
    </div>
  );
};

export default PersonPage;
