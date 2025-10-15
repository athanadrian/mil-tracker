// components/tools/regions/RegionFormDialog.tsx
'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { toast } from 'sonner';

import {
  createRegion,
  getRegions,
  updateRegion,
} from '@/actions/tools/region.actions';

import AppDialog from '@/components/app-ui/AppDialog';
import { Button } from '@/components/ui/button';
import { AppTextInputField, AppTextarea } from '@/components/app-ui'; // <-- τα custom inputs σου
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { regionSchema } from '@/validations/tools/region.validation';
import { RegionDTO } from '@/types/tools/region';
import { usePathname, useRouter } from 'next/navigation';

type FormValues = z.infer<typeof regionSchema>;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isEdit: boolean;
  current?: RegionDTO;
  path?: string;
  //onSubmit: (data: FormValues) => Promise<void>;
};

type RegionPayload = {
  name: string;
  code?: string;
  description?: string;
};

const RegionFormDialog = ({
  open,
  onOpenChange,
  isEdit,
  current,
  path,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(regionSchema),
    defaultValues: {
      name: current?.name ?? '',
      code: current?.code ?? '',
      description: current?.description ?? '',
    },
    values: {
      name: current?.name ?? '',
      code: current?.code ?? '',
      description: current?.description ?? '',
    },
  });

  const finalPath = path ? path : pathname;

  const onSubmit = async (values: FormValues): Promise<void> => {
    const payload: RegionPayload = {
      name: values.name.trim(),
      code: values.code?.trim() ? values.code.trim() : undefined,
      description: values.description?.trim()
        ? values.description.trim()
        : undefined,
    };

    if (isEdit && current) {
      const res = await updateRegion(current.id, payload, finalPath);
      if (!res.ok) {
        toast.error(res.error ?? 'Σφάλμα ενημέρωσης');
        return;
      }
      toast.success('Η περιοχή ενημερώθηκε');
    } else {
      const res = await createRegion(payload, finalPath);
      if (!res.ok) {
        toast.error(res.error ?? 'Σφάλμα δημιουργίας');
        return;
      }
      toast.success('Η περιοχή δημιουργήθηκε');
    }
    await getRegions();
    onOpenChange(false);
    router.refresh();
  };

  useEffect(() => {
    if (open) {
      reset({
        name: current?.name ?? '',
        code: current?.code ?? '',
        description: current?.description ?? '',
      });
    }
  }, [open, current, reset]);

  const title = isEdit ? 'Επεξεργασία περιοχής' : 'Νέα περιοχή';

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description='Συμπλήρωσε τα στοιχεία της περιοχής.'
      footer={
        <div className='flex gap-2 justify-end'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Άκυρο
          </Button>
          <Button
            onClick={handleSubmit(async (values) => {
              await onSubmit(values);
            })}
            disabled={isSubmitting || (!isEdit && !isDirty)}
          >
            <AppIcon icon={appIcons.save} size={16} className='mr-2' />
            Αποθήκευση
          </Button>
        </div>
      }
    >
      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
        <div>
          <AppTextInputField
            name='name'
            label='Όνομα *'
            placeholder='π.χ. Ευρώπη'
            error={errors.name?.message}
            register={register}
          />
        </div>
        <div>
          <AppTextInputField
            name='code'
            label='Code'
            placeholder='π.χ. EU'
            error={errors.code?.message}
            register={register}
          />
        </div>
        <div className='md:col-span-2'>
          <AppTextarea
            name='description'
            label='Περιγραφή'
            placeholder='Σύντομη περιγραφή…'
            error={errors.description?.message}
            register={register}
            rows={4}
          />
        </div>
      </div>
    </AppDialog>
  );
};

export default RegionFormDialog;
