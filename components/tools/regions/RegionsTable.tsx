// components/tools/regions/RegionsTable.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { RegionDTO } from '@/types/tools/region';

type Props = {
  rows: RegionDTO[];
  onEdit: (row: RegionDTO) => void;
  onDelete: (row: RegionDTO) => void;
};

const RegionsTable = ({ rows, onEdit, onDelete }: Props) => {
  return (
    <div className='rounded-md border overflow-x-auto'>
      <table className='w-full caption-bottom text-sm'>
        <thead className='bg-muted/50'>
          <tr className='text-left'>
            <th className='p-2 w-[36%]'>Όνομα</th>
            <th className='p-2 w-[24%]'>Code</th>
            <th className='p-2'>Περιγραφή</th>
            <th className='p-2 w-[160px] text-right'>Ενέργειες</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className='p-3 text-muted-foreground' colSpan={4}>
                Δεν υπάρχουν περιοχές.
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className='border-b last:border-b-0'>
                <td className='p-2 font-medium'>{r.name}</td>
                <td className='p-2'>{r.code ?? '—'}</td>
                <td className='p-2'>{r.description ?? '—'}</td>
                <td className='p-2'>
                  <div className='flex justify-end gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => onEdit(r)}
                    >
                      <AppIcon
                        icon={appIcons.edit}
                        size={14}
                        className='mr-1'
                      />
                      Επεξεργασία
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => onDelete(r)}
                    >
                      <AppIcon
                        icon={appIcons.delete}
                        size={14}
                        className='mr-1'
                      />
                      Διαγραφή
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RegionsTable;
