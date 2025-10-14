import { AppPageBreadcrumbs } from '@/components/app-ui';
import RegionsContainer from '@/components/tools/regions/RegionsContainer';
import { getRegions } from '@/actions/tools/region.actions';

export const revalidate = 0;

const RegionsPage = async () => {
  const regions = await getRegions(); // <-- async fetch on the server

  return (
    <div className='p-4 space-y-6'>
      <AppPageBreadcrumbs
        base={{ href: '/', label: 'Πίνακας Ελέγχου' }}
        segmentLabels={{ tools: 'Εργαλεία', regions: 'Περιοχές' }}
      />

      <div className='mt-4'>
        <RegionsContainer regions={regions} />
      </div>
    </div>
  );
};

export default RegionsPage;
