// components/tools/regions/RegionFormDialog.tsx
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AppDialog from '@/components/app-ui/AppDialog';
import { Button } from '@/components/ui/button';
import { AppTextInputField, AppTextarea } from '@/components/app-ui'; // <-- τα custom inputs σου
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { regionSchema } from '@/validations/tools/region.validation';
import { RegionDTO } from '@/types/tools/region';

type FormValues = z.infer<typeof regionSchema>;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isEdit: boolean;
  initial?: RegionDTO;
  onSubmit: (data: FormValues) => Promise<void>;
};

const RegionFormDialog = ({
  open,
  onOpenChange,
  isEdit,
  initial,
  onSubmit,
}: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(regionSchema),
    defaultValues: {
      name: initial?.name ?? '',
      code: initial?.code ?? '',
      description: initial?.description ?? '',
    },
    values: {
      name: initial?.name ?? '',
      code: initial?.code ?? '',
      description: initial?.description ?? '',
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        code: initial?.code ?? '',
        description: initial?.description ?? '',
      });
    }
  }, [open, initial, reset]);

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
