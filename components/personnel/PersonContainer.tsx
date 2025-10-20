'use client';
import { PersonDetailDTO } from '@/actions/person.actions';
import { Button } from '@/components/ui/button';
import { AppCrudMenu, AppIcon, AppPageTitle } from '../app-ui';
import PersonDetails from './PersonDetails';
import { appIcons } from '@/constants/app-icons';
import { useRouter } from 'next/navigation';

const trigger = (
  <Button className='flex items-center gap-4'>
    <AppIcon icon='menu' size={16} />
    <span className=''>Ενέργειες</span>
    <span className='sr-only'>open menu</span>
  </Button>
);

const PersonContainer = ({
  person,
  name,
}: {
  person: PersonDetailDTO;
  name: string;
}) => {
  const router = useRouter();
  return (
    <div className='space-y-6'>
      <AppPageTitle title={name} subtitle={`Προβολή στοιχείων ${name}`}>
        <AppCrudMenu
          trigger={trigger}
          showView
          showEdit
          showDelete
          onView={() => router.push(`/personnel/${person.id}`)}
          //onView?.(p)}
          onEdit={() => router.push(`/personnel/create?edit=${person.id}`)}
          onDelete={() => {
            /* άνοιξε dialog διαγραφής αν έχεις */
          }}
          items={[
            {
              key: 'add-intallation',
              label: 'Προσθήκη Τοποθέτησης',
              icon: <AppIcon icon={appIcons.add} />,
              onAction: () => {},
            },
            {
              key: 'add-work',
              label: 'Προσθήκη Προαγωγής',
              icon: <AppIcon icon={appIcons.add} />,
              onAction: () => {},
            },
            {
              key: `add-${
                person.status === 'ACTIVE' ? 'retirement' : 'active'
              }`,
              label: `${
                person.status === 'ACTIVE' ? 'Αποστράτευση' : 'Εν Ενεργεία'
              }`,
              icon: (
                <AppIcon
                  icon={
                    person.status === 'ACTIVE'
                      ? appIcons.retired
                      : appIcons.active
                  }
                  className={`${
                    person.status === 'ACTIVE'
                      ? 'text-rose-500'
                      : 'text-teal-500'
                  }`}
                />
              ),
              onAction: () => {},
            },
          ]}
        />
      </AppPageTitle>
      <PersonDetails person={person} />
    </div>
  );
};

export default PersonContainer;
