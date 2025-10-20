// components/tools/organizations/OrganizationFormDialog.tsx
'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { AppDialog } from '@/components/app-ui';
import { createOrganization } from '@/actions/tools/organization.actions';

const QuickOrganizationFormDialog = ({
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
  const nameRef = React.useRef<HTMLInputElement>(null);

  const save: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const res = await createOrganization({
        name: name.trim(),
        type,
        countriesIds: [],
      });

      if (!res.ok) {
        throw new Error(res.error ?? 'Αποτυχία δημιουργίας');
      }

      const { id, name: createdName } = res.data;
      onCreated({ id, name: createdName });

      // ✅ ΜΗΝ κλείνεις το dialog
      // καθάρισε για επόμενη γρήγορη καταχώρηση
      setName('');
      // setType('OTHER'); // αν θέλεις reset και στο type
      // queueMicrotask(() => nameRef.current?.focus());
    } catch (err: any) {
      // toast.error(err?.message ?? 'Κάτι πήγε στραβά');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog
      open={open}
      className='z-[60]' // <-- πάνω από τον parent
      onOpenChange={(v) => {
        if (saving) return; // προαιρετικό: μην κλείνει όσο κάνει save
        onOpenChange(v);
      }}
      modal={true}
      // Δώσε z-index > του parent (πχ ο shadcn DialogContent είναι z-50)
      contentProps={{
        onOpenAutoFocus: (e) => e.preventDefault(), // μην κλέβει focus στο open
        onCloseAutoFocus: (e) => e.preventDefault(), // ΜΗΝ επιστρέφει focus στον parent στο close/submit
        onPointerDownOutside: (e) => e.preventDefault(),
        onInteractOutside: (e) => e.preventDefault(),
        onEscapeKeyDown: (e) => e.preventDefault(),
      }}
      title='Νέος οργανισμός'
      footer={
        <div className='flex gap-2 justify-end'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Άκυρο
          </Button>
          <Button
            type='submit'
            form='quick-org-form'
            disabled={saving || !name.trim()}
          >
            {saving ? 'Αποθήκευση…' : 'Αποθήκευση'}
          </Button>
        </div>
      }
    >
      <form id='quick-org-form' onSubmit={save} className='space-y-3'>
        <div>
          <label className='block text-sm font-medium mb-1'>Όνομα</label>
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='w-full rounded-md border px-3 py-2'
            placeholder='π.χ. 1η Στρατιά'
          />
        </div>
        <div>
          <label className='block text-sm font-medium mb-1'>Τύπος</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className='w-full rounded-md border px-3 py-2'
          >
            <option value='OTHER'>OTHER</option>
            <option value='MILITARY'>MILITARY</option>
            <option value='GOVERNMENT'>GOVERNMENT</option>
          </select>
        </div>
      </form>
    </AppDialog>
  );
};
export default QuickOrganizationFormDialog;
