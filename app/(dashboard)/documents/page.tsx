import { AppPageBreadcrumbs, AppPageTitle } from '@/components/app-ui';
import { DocumentsContainer } from '@/components/documents';

const DocumentsPage = () => {
  return (
    <div className='p-4 space-y-6'>
      <AppPageBreadcrumbs
        base={{ href: '/', label: 'Πίνακας Ελέγχου' }}
        segmentLabels={{ documents: 'Έγγραφα' }}
      />
      <AppPageTitle title='Έγγραφα' subtitle='Αναλυτικά στοιχεία εγγράφων' />
      <DocumentsContainer />
    </div>
  );
};
export default DocumentsPage;
