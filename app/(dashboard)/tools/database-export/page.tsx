import { AppPageBreadcrumbs, AppPageTitle } from '@/components/app-ui';
import { ExportContainer, ImportLookupsCard } from '@/components/database';
import React from 'react';

const ExportDatabasePage = () => {
  return (
    <div className='p-4 space-y-6'>
      <AppPageBreadcrumbs
        base={{ href: '/', label: 'Πίνακας Ελέγχου' }}
        segmentLabels={{
          tools: 'Εργαλεία',
          'database-export': 'Εξαγωγή Δεδομένων',
        }}
      />
      <AppPageTitle
        title='Βάση Δεδομένων'
        subtitle='Εξαγωγή δεδομένων'
        // actionLabel='Νέα Χώρα'
        // actionHref='/tools/database/new'
        // actionIconKey='add'
      />
      <div className='mt-4'>
        <ExportContainer />{' '}
      </div>
    </div>
  );
};

export default ExportDatabasePage;
