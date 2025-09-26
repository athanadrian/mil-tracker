import { getDashboardCounts } from '@/actions/dashboard.actions';
import { Stat } from '@/components/common';
import { appIcons } from '@/constants/app-icons';

const Dashboard = async () => {
  const [counts] = await Promise.all([getDashboardCounts()]);

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
      <Stat
        //key={item.href}
        icon={appIcons.countries /* μπορεί να είναι function ή string */}
        label='Χώρες'
        value={counts?.countries}
        //href={item.href}
      />
      <div className='rounded-2xl border p-4'>
        <div className='text-sm opacity-60'>Χώρες</div>
        <div className='text-3xl font-semibold'>{counts.countries}</div>
      </div>
      <div className='rounded-2xl border p-4'>
        <div className='text-sm opacity-60'>Οργανισμοί</div>
        <div className='text-3xl font-semibold'>{counts.organizations}</div>
      </div>
      <div className='rounded-2xl border p-4'>
        <div className='text-sm opacity-60'>Προσωπικό</div>
        <div className='text-3xl font-semibold'>{counts.people}</div>
      </div>
      <div className='rounded-2xl border p-4'>
        <div className='text-sm opacity-60'>Εξοπλισμός</div>
        <div className='text-3xl font-semibold'>{counts.equipment}</div>
      </div>
    </div>
  );
};
export default Dashboard;
