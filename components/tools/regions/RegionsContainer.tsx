'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { deleteRegion, getRegions } from '@/actions/tools/region.actions';
import { RegionDTO } from '@/types/tools/region';
import {
  AppAlertDialog,
  AppCrudMenu,
  AppIcon,
  AppPageTitle,
} from '@/components/app-ui';
import { Button } from '@/components/ui/button';
import { appIcons } from '@/constants/app-icons';
import { RegionsTable, RegionFormDialog } from '@/components/tools/regions';
import { usePathname, useRouter } from 'next/navigation';

const trigger = (
  <Button className='flex items-center gap-4 hover:cursor-pointer'>
    <AppIcon icon='menu' size={16} />
    <span className=''>Ενέργειες</span>
    <span className='sr-only'>open menu</span>
  </Button>
);

const RegionsContainer = ({
  regions,
  path,
}: {
  regions: RegionDTO[];
  path?: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const [openForm, setOpenForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [current, setCurrent] = useState<RegionDTO | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    setIsEdit(false);
    setCurrent(null);
    setOpenForm(true);
  };

  const handleEdit = (row: RegionDTO) => {
    setIsEdit(true);
    setCurrent(row);
    setOpenForm(true);
  };

  const handleDelete = (row: RegionDTO) => {
    setDeleteId(row.id);
  };

  const finalPath = path ? path : pathname;

  const onConfirmDelete = async () => {
    if (!deleteId) return;
    const res = await deleteRegion(deleteId, finalPath);
    if (!res.ok) {
      toast.error(res.error ?? 'Σφάλμα διαγραφής');
    } else {
      toast.success('Η περιοχή διαγράφηκε');
      await getRegions();
      router.refresh();
    }
    setDeleteId(null);
  };

  return (
    <div>
      <AppPageTitle title='Περιοχές' subtitle='Διαχείριση στοιχείων περιοχών'>
        <AppCrudMenu
          trigger={trigger}
          items={[
            {
              key: 'add-region',
              label: 'Προσθήκη περιοχής',
              icon: <AppIcon icon={appIcons.add} />,
              onAction: handleAdd,
            },
          ]}
        />
      </AppPageTitle>

      <RegionsTable
        rows={regions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Add/Edit Dialog */}
      <RegionFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        isEdit={isEdit}
        current={current ?? undefined}
        path={finalPath}
      />

      {/* Delete confirm */}
      <AppAlertDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title='Διαγραφή περιοχής;'
        description='Η ενέργεια δεν είναι αναστρέψιμη.'
        confirmLabel='Διαγραφή'
        cancelLabel='Άκυρο'
        confirmVariant='destructive'
        confirmClassName='bg-destructive text-destructive-foreground hover:bg-destructive/90'
        onConfirm={onConfirmDelete}
      />
    </div>
  );
};

export default RegionsContainer;
