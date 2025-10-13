import { AppPageBreadcrumbs, AppPageTitle } from '@/components/app-ui';
import { ImportLookupsCard } from '@/components/database';
import React from 'react';

const ImportDatabasePage = () => {
  return (
    <div className='p-4 space-y-6'>
      <AppPageBreadcrumbs
        base={{ href: '/', label: 'Πίνακας Ελέγχου' }}
        segmentLabels={{
          tools: 'Εργαλεία',
          'database-import': 'Εισαγωγή Δεδομένων',
        }}
      />
      <AppPageTitle
        title='Βάση Δεδομένων'
        subtitle='Εισαγωγή δεδομένων από Φύλλο Εργασίας(.xlxs)'
      />
      <div className='mt-4'>
        <ImportLookupsCard />
      </div>
    </div>
  );
};

export default ImportDatabasePage;
