// components/tools/organizations/OrganizationFormDialog.tsx
'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { AppDialog, AppSelect, AppTextInputField } from '@/components/app-ui';
import { createOrganization } from '@/actions/tools/organization.actions';
import { ORGANIZATION_TYPE_OPTIONS } from '@/constants/categories';

const QuickCreateOrganizationDialog = ({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (org: { id: string; name: string }) => void;
}) => {
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<'MILITARY' | 'GOVERNMENT' | 'OTHER'>(
    'OTHER'
  );
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await createOrganization({ name, type, countriesIds: [] });

      if (!res.ok) {
        throw new Error(res.error ?? 'Failed');
      }

      // res is Ok here
      const { id, name: createdName } = res.data;
      onCreated({ id, name: createdName });
    } catch (e: any) {
      // toast error
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Νέος οργανισμός'
      footer={
        <div className='flex gap-2 justify-end'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Άκυρο
          </Button>
          <Button onClick={save} disabled={saving || !name.trim()}>
            Αποθήκευση
          </Button>
        </div>
      }
    >
      <div className='grid gap-3'>
        <AppTextInputField
          label='Όνομα *'
          name='name'
          value={name}
          onChange={(e: any) => setName(e.target.value)}
        />
        <AppSelect
          label='Τύπος *'
          value={type}
          onChange={(v) => setType(v as any)}
          options={ORGANIZATION_TYPE_OPTIONS}
          getLabel={(o: any) => o.label}
          getOptionValue={(o: any) => o.id}
        />
      </div>
    </AppDialog>
  );
};

export default QuickCreateOrganizationDialog;
