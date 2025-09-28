import { AppPageBreadcrumbs, AppPageTitle } from '@/components/app-ui';
import { StatsContainer } from '@/components/common';
import React from 'react';

const ToolsPage = () => {
  return (
    <div className='p-4 space-y-6'>
      <AppPageBreadcrumbs
        base={{ href: '/', label: 'Πίνακας Ελέγχου' }}
        segmentLabels={{ tools: 'Εργαλεία' }}
      />
      <AppPageTitle
        title='Εργαλεία'
        subtitle='Εργαλεία διαχείρισης στοιχείων συστήματος'
      />
      <StatsContainer links='tools' />
    </div>
  );
};

export default ToolsPage;
