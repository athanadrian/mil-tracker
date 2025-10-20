'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import {
  deleteOrganization,
  getOrganizations,
} from '@/actions/tools/organization.actions';
import { OrganizationDTO } from '@/types/tools/organization';
import {
  AppAlertDialog,
  AppCrudMenu,
  AppIcon,
  AppPageTitle,
} from '@/components/app-ui';
import { Button } from '@/components/ui/button';
import { appIcons } from '@/constants/app-icons';
import {
  OrganizationsTable,
  OrganizationFormDialog,
} from '@/components/tools/organizations';
import { usePathname, useRouter } from 'next/navigation';
import { Option } from '@/types/common';

const trigger = (
  <Button className='flex items-center gap-4 hover:cursor-pointer'>
    <AppIcon icon='menu' size={16} />
    <span className=''>Ενέργειες</span>
    <span className='sr-only'>open menu</span>
  </Button>
);

const OrganizationsContainer = ({
  organizations,
  path,
  selectOptions,
}: {
  organizations: OrganizationDTO[];
  path?: string;
  selectOptions: Record<string, unknown>;
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const [openForm, setOpenForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [current, setCurrent] = useState<OrganizationDTO | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { countries, organizations: optionOrganizations } = selectOptions;
  console.log('selectOptions', selectOptions);
  const handleAdd = () => {
    setIsEdit(false);
    setCurrent(null);
    setOpenForm(true);
  };

  const handleEdit = (row: OrganizationDTO) => {
    setIsEdit(true);
    setCurrent(row);
    setOpenForm(true);
  };

  const handleDelete = (row: OrganizationDTO) => {
    setDeleteId(row.id);
  };

  const finalPath = path ? path : pathname;

  const onConfirmDelete = async () => {
    if (!deleteId) return;
    const res = await deleteOrganization(deleteId, finalPath);
    if (!res.ok) {
      toast.error(res.error ?? 'Σφάλμα διαγραφής');
    } else {
      toast.success('Ο οργανισμός διαγράφηκε');
      await getOrganizations();
      router.refresh();
    }
    setDeleteId(null);
  };

  return (
    <div>
      <AppPageTitle
        title='Οργανισμοί'
        subtitle='Διαχείριση στοιχείων οργανισμών'
      >
        <AppCrudMenu
          trigger={trigger}
          items={[
            {
              key: 'add-organization',
              label: 'Προσθήκη οργανισμού',
              icon: <AppIcon icon={appIcons.add} />,
              onAction: handleAdd,
            },
          ]}
        />
      </AppPageTitle>

      <OrganizationsTable
        rows={organizations}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <OrganizationFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        isEdit={isEdit}
        current={current ?? undefined}
        path={finalPath}
        countries={countries as Option[]}
        organizations={optionOrganizations as Option[]}
      />

      <AppAlertDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title='Διαγραφή οργανισμού;'
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

export default OrganizationsContainer;
