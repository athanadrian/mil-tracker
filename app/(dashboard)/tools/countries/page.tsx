import { AppPageBreadcrumbs } from '@/components/app-ui';
import { CountriesContainer } from '@/components/tools/countries';
const CountriesPage = () => {
  return (
    <div className='p-4 space-y-6'>
      <AppPageBreadcrumbs
        base={{ href: '/', label: 'Πίνακας Ελέγχου' }}
        segmentLabels={{ tools: 'Εργαλεία', countries: 'Χώρες' }}
      />

      <div className='mt-4'>
        <CountriesContainer />
      </div>
    </div>
  );
};

export default CountriesPage;
