import { AppPageBreadcrumbs, AppPageTitle } from '@/components/app-ui';
import React from 'react';

const CountriesPage = () => {
  return (
    <div className='p-4 space-y-6'>
      <AppPageBreadcrumbs
        base={{ href: '/', label: 'Πίνακας Ελέγχου' }}
        segmentLabels={{ tools: 'Εργαλεία', countries: 'Χώρες' }}
      />
      <AppPageTitle
        title='Χώρες'
        subtitle='Διαχείριση στοιχείων χωρών'
        actionLabel='Νέα Χώρα'
        actionHref='/tools/countries/new'
        actionIconKey='add'
      />
      <div className='mt-4'>countriesPage</div>
    </div>
  );
};

export default CountriesPage;
