'use client';

import React from 'react';
import { OrganizationDTO } from '@/types/tools/organization';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { ORG_TYPE_LABEL_MAP } from '@/constants/categories';

export const OrganizationsTable = ({
  rows,
  onEdit,
  onDelete,
}: {
  rows: OrganizationDTO[];
  onEdit: (row: OrganizationDTO) => void;
  onDelete: (row: OrganizationDTO) => void;
}) => {
  return (
    <div className='overflow-x-auto rounded-md border'>
      <table className='w-full'>
        <thead>
          <tr className='text-left'>
            <th className='p-2'>Ονομα</th>
            <th className='p-2'>Κωδικός</th>
            <th className='p-2'>Τύπος</th>
            <th className='p-2'>Περιγραφή</th>
            <th className='p-2'>Ενέργειες</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className='p-4 text-center text-muted-foreground'>
                Δεν βρέθηκαν εγγραφές
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className='border-t'>
              <td className='p-2'>{r.name}</td>
              <td className='p-2'>{r.code ?? '-'}</td>
              <td className='p-2'>{ORG_TYPE_LABEL_MAP[r.type]}</td>
              <td className='p-2'>{r.description ?? '-'}</td>
              <td className='p-2'>
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => onEdit(r)}
                    title='Επεξεργασία'
                  >
                    <AppIcon icon={appIcons.edit} />
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => onDelete(r)}
                    title='Διαγραφή'
                  >
                    <AppIcon icon={appIcons.delete} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrganizationsTable;
