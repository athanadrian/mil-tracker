'use client';
import { AppCrudMenu, AppIcon, AppPageTitle } from '@/components/app-ui';
import { Button } from '@/components/ui/button';
import { appIcons } from '@/constants/app-icons';

const trigger = (
  <Button className='flex items-center gap-4 hover:cursor-pointer'>
    <AppIcon icon='menu' size={16} />
    <span className=''>Ενέργειες</span>
    <span className='sr-only'>open menu</span>
  </Button>
);

const CountriesContainer = () => {
  return (
    <div>
      <AppPageTitle
        title='Χώρες'
        subtitle='Διαχείριση στοιχείων χωρών'
        // actionLabel='Νέα Χώρα'
        // actionHref='/tools/countries/new'
        // actionIconKey='add'
      >
        <AppCrudMenu
          trigger={trigger}
          items={[
            {
              key: 'add-country',
              label: 'Προσθήκη Χώρας',
              icon: <AppIcon icon={appIcons.add} />,
              onAction: () => {},
            },
          ]}
        />
      </AppPageTitle>
    </div>
  );
};

export default CountriesContainer;
