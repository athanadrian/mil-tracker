'use client';
import { EmptyState } from '../common';
import { appIcons } from '@/constants/app-icons';

const PersonnelContainer = () => {
  return (
    <div className='flex items-center justify-center h-64'>
      <EmptyState icon={appIcons.personnel} label='Προσωπικό' />
    </div>
  );
};

export default PersonnelContainer;
