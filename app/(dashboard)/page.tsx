import { AppPageBreadcrumbs, AppPageTitle } from '@/components/app-ui';
import { StatsContainer } from '@/components/common';

const Dashboard = async () => {
  return (
    <div className='p-4 space-y-6'>
      <AppPageBreadcrumbs base={{ href: '/', label: 'Πίνακας Ελέγχου' }} />
      <AppPageTitle
        title='Πίνακας Ελέγχου'
        subtitle='Διαχείριση στοιχείων συστήματος'
      />
      <StatsContainer links='admin' />
    </div>
  );
};
export default Dashboard;
