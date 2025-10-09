import { AppPageBreadcrumbs } from '@/components/app-ui';
import React from 'react';

type PageProps = {
  params: {
    /* αν έχεις dynamic segments */
  };
  searchParams: { edit?: string | string[] };
};

const AddEditPersonPage = ({ searchParams }: PageProps) => {
  console.log('searchParams', searchParams);
  const edit = Array.isArray(searchParams?.edit)
    ? searchParams.edit[0]
    : searchParams?.edit ?? null;

  console.log('edit =', edit); // π.χ. "cmggdnxkf0023b0tcqsbqj6ac"
  return (
    <div className='p-4 space-y-6'>
      <AppPageBreadcrumbs
        base={{ href: '/', label: 'Πίνακας Ελέγχου' }}
        segmentLabels={{ personnel: 'Προσωπικό', person: 'some person' }}
      />
    </div>
  );
};

export default AddEditPersonPage;
