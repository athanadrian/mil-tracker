'use client';
import { EmptyState } from '@/components/common';
import { appIcons } from '@/constants/app-icons';

const DocumentsContainer = () => {
  return (
    <div className='flex items-center justify-center h-64'>
      <EmptyState icon={appIcons.documents} label='Έγγραφα' />
    </div>
  );
};

export default DocumentsContainer;
