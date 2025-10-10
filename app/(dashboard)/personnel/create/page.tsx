import Link from 'next/link';

import { getPersonDetailById } from '@/actions/person.actions';
import { AppIcon, AppPageBreadcrumbs, AppPageTitle } from '@/components/app-ui';

type Props = {
  searchParams: { edit?: string };
};

const AddEditPersonPage = async ({ searchParams }: Props) => {
  const sp = await searchParams;
  const editId = sp?.edit;
  const person = editId ? await getPersonDetailById(editId) : null;
  const personName = person
    ? `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim() || 'Άγνωστος'
    : null;

  const segmentLabels = editId
    ? {
        personnel: 'Προσωπικό',
        create: (
          <div className='inline-flex items-center gap-1.5 text-sm sm:gap-2.5'>
            <Link
              href={`/personnel/${editId}`}
              className=' transition-colors text-muted-foreground hover:text-foreground'
            >
              {personName}
            </Link>{' '}
            <AppIcon icon='chevronRight' size={14} /> Επεξεργασία
          </div>
        ),
      }
    : {
        personnel: 'Προσωπικό',
        create: 'Δημιουργία',
      };

  const title = editId ? `Επεξεργασία (${personName})` : 'Δημιουργία';
  const subtitle = editId ? 'Επεξεργασία στοιχείων' : 'Δημιουργία νέου';

  return (
    <div className='p-4 space-y-6'>
      <AppPageBreadcrumbs
        base={{ href: '/', label: 'Πίνακας Ελέγχου' }}
        segmentLabels={segmentLabels}
      />

      <AppPageTitle
        title={title}
        subtitle={subtitle}
        actionLabel='Αποθήκευση'
        actionIconKey='save'
        // Το κουμπί κάνει submit στη φόρμα μέσω form="person-form"
        //actionButtonProps={{ form: 'person-form', type: 'submit' }}
      />

      {/* ...your form/component for create/edit... */}
    </div>
  );
};

export default AddEditPersonPage;
