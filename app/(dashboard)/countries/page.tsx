import { AppPageBreadcrumbs, AppPageTitle } from '@/components/app-ui';

const CountriesPage = () => {
  return (
    <div className='p-4 space-y-6'>
      <AppPageBreadcrumbs
        base={{ href: '/', label: 'Πίνακας Ελέγχου' }}
        segmentLabels={{ countries: 'Χώρες Ενδιαφέροντος' }}
      />
      <AppPageTitle
        title='Xώρες Ενδιαφέροντος'
        subtitle='Αναλυτικά στοιχεία χωρών'
      />
      <div>CountriesPage</div>
    </div>
  );
};

export default CountriesPage;
