import { EmptyState } from '@/components/common';
import { appIcons } from '@/constants/app-icons';

const DocumentsPage = () => {
  return (
    <div className='space-y-4'>
      <EmptyState icon='documents' label='Έγγραφα' />
    </div>
  );
};
export default DocumentsPage;
