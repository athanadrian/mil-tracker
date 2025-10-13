'use client';
import type { z } from 'zod';

import {
  createRegion,
  deleteRegion,
  updateRegion,
} from '@/actions/tools/region.actions';
import { regionSchema } from '@/validations/tools/region.validation';
import { RegionDTO } from '@/types/tools/region';
import { AppCrudMenu, AppIcon, AppPageTitle } from '@/components/app-ui';
import { Button } from '@/components/ui/button';
import { appIcons } from '@/constants/app-icons';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import RegionsTable from './RegionsTable';
import RegionFormDialog from './RegionFormDialog';
type FormValues = z.infer<typeof regionSchema>;

const trigger = (
  <Button className='flex items-center gap-4 hover:cursor-pointer'>
    <AppIcon icon='menu' size={16} />
    <span className=''>Ενέργειες</span>
    <span className='sr-only'>open menu</span>
  </Button>
);

const RegionsContainer = ({ regions }: { regions: RegionDTO[] }) => {
  const [rows, setRows] = useState<RegionDTO[]>(regions);
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

  const onSubmit = async (values: FormValues) => {
    // normalize: άδειο string -> undefined
    const payload = {
      name: values.name.trim(),
      code: values.code?.trim() ? values.code.trim() : undefined,
      description: values.description?.trim()
        ? values.description.trim()
        : undefined,
    };

    if (isEdit && current) {
      const res = await updateRegion(current.id, payload);
      if (!res.ok) return toast.error(res.error ?? 'Σφάλμα ενημέρωσης');
      toast.success('Η περιοχή ενημερώθηκε');
    } else {
      const res = await createRegion(payload);
      if (!res.ok) return toast.error(res.error ?? 'Σφάλμα δημιουργίας');
      toast.success('Η περιοχή δημιουργήθηκε');
    }
    setOpenForm(false);
  };

  const onConfirmDelete = async () => {
    if (!deleteId) return;
    const res = await deleteRegion(deleteId);
    if (!res.ok) {
      toast.error(res.error ?? 'Σφάλμα διαγραφής');
    } else {
      toast.success('Η περιοχή διαγράφηκε');
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
        <Button onClick={handleAdd}>
          <AppIcon icon={appIcons.add} size={16} className='mr-2' /> Νέα Περιοχή
        </Button>
      </AppPageTitle>

      <RegionsTable rows={rows} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Add/Edit Dialog */}
      {/* <RegionFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        isEdit={isEdit}
        initial={current ?? undefined}
        onSubmit={onSubmit} 
      />*/}

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Διαγραφή περιοχής;</AlertDialogTitle>
            <AlertDialogDescription>
              Η ενέργεια δεν είναι αναστρέψιμη.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Άκυρο</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={onConfirmDelete}
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RegionsContainer;
