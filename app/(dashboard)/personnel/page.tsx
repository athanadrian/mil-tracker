import { Suspense } from 'react';

import { getPersonnelData } from '@/actions/person.actions';
import { AppPageBreadcrumbs, AppPageTitle } from '@/components/app-ui';
import { LoadingBar } from '@/components/common';
import { PersonnelContainer } from '@/components/personnel';
import { parseFilters, toPersonFilters } from '@/lib/utils';
import { PersonFilters } from '@/types/person';
import { getSelectOptionsCached } from '@/actions/common.actions';

type PersonnelPageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};

const PersonnelPage = async ({ searchParams }: PersonnelPageProps) => {
  const sp = await searchParams;
  const pf = parseFilters(sp);
  const filters: PersonFilters = toPersonFilters(pf);

  const [initial, selectOptions] = await Promise.all([
    getPersonnelData({
      take: 30,
      sortBy: 'lastName',
      sortDir: 'asc',
      filters,
    }),
    getSelectOptionsCached({
      include: { countries: true, branches: true, ranks: true },
    }),
  ]);

  return (
    <div className='p-4 space-y-6'>
      <AppPageBreadcrumbs
        base={{ href: '/', label: 'Πίνακας Ελέγχου' }}
        segmentLabels={{ personnel: 'Προσωπικό' }}
      />
      <AppPageTitle
        title='Προσωπικό'
        subtitle='Διαχείριση στοιχείων προσωπικού'
        actionLabel='Νέο Στέλεχος'
        actionHref='/personnel/new'
        actionIconKey='add'
      />
      <div className='mt-4'>
        <div className='space-y-8 mx-auto px-4 py-6'>
          <Suspense fallback={<LoadingBar />}>
            {/* Lazy boundary mainly keeps parity with other admin pages */}
            <PersonnelContainer
              initial={initial}
              initialFilters={filters}
              selectOptions={selectOptions}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default PersonnelPage;
