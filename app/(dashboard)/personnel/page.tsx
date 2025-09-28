import { getPersonnelData } from '@/actions/person.actions';
import { AppPageBreadcrumbs, AppPageTitle } from '@/components/app-ui';

const PersonnelPage = async () => {
  const personnel = await getPersonnelData();
  console.log('personnel', personnel);
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
      <div className='mt-4'>personnelPage</div>
    </div>
  );
};

export default PersonnelPage;
