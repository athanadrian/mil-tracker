import { AppPageBreadcrumbs } from '@/components/app-ui';
import React from 'react';

const PersonPage = (props: any) => {
  console.log('props', props);
  return (
    <div className='p-4 space-y-6'>
      <AppPageBreadcrumbs
        base={{ href: '/', label: 'Πίνακας Ελέγχου' }}
        segmentLabels={{ personnel: 'Προσωπικό', person: 'some person' }}
      />
    </div>
  );
};

export default PersonPage;
