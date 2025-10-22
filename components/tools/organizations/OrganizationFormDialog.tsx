// components/tools/organizations/OrganizationFormDialog.tsx
'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePathname, useRouter } from 'next/navigation';
import { OrganizationType } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { appIcons } from '@/constants/app-icons';
import {
  AppIcon,
  AppDialog,
  AppSelect,
  AppTextInputField,
  AppTextarea,
} from '@/components/app-ui';
import AppMultiSelectMini from '@/components/app-ui/AppMultiSelectMini';
import { organizationSchema } from '@/validations/tools/organization.validation';
import { OrganizationDTO } from '@/types/tools/organization';
import {
  createOrganization,
  updateOrganization,
  getOrganizations,
} from '@/actions/tools/organization.actions';
import { ORGANIZATION_TYPE_OPTIONS } from '@/constants/categories';
import { Option } from '@/types/common';
import QuickCreateOrganizationDialog from './QuickOrganizationFormDialog';

type FormValues = z.input<typeof organizationSchema>;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isEdit: boolean;
  current?: OrganizationDTO & {
    // optional helpers if your DTO sometimes carries relations
    country?: { id: string } | null;
    parent?: { id: string; name: string } | null;
    countries?: Array<{ id: string; name: string }>;
    type?: OrganizationType;
  };
  path?: string;
  // dropdown data
  countries: Option[]; // [{id, label}] — label = country name
  organizations: Option[]; // [{id, label}] — label = organization name
};

const toMultiOptions = (rows: Option[]) =>
  rows.map((r) => ({ value: String(r.id), label: String(r.label || r.name) }));

const OrganizationFormDialog = ({
  open,
  onOpenChange,
  isEdit,
  current,
  path,
  countries,
  organizations,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const finalPath = path || pathname;
  const [openQuick, setOpenQuick] = React.useState(false);
  const [orgOptions, setOrgOptions] = React.useState(organizations);
  console.log('organizations', organizations);
  // ---- RHF for core fields (schema-validated) ----
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver<FormValues, any, FormValues>(organizationSchema),
    defaultValues: {
      name: current?.name ?? '',
      code: current?.code ?? '',
      type: (current?.type as FormValues['type']) ?? 'OTHER',
      organizationImage: current?.organizationImage ?? '',
      description: current?.description ?? '',
      parentId:
        (current as any)?.parentId ?? (current as any)?.parent?.id ?? '',
    },
    values: {
      name: current?.name ?? '',
      code: current?.code ?? '',
      type: (current?.type as FormValues['type']) ?? 'OTHER',
      organizationImage: current?.organizationImage ?? '',
      description: current?.description ?? '',
      parentId:
        (current as any)?.parentId ?? (current as any)?.parent?.id ?? '',
    },
  });

  const handleParentOpenChange = React.useCallback(
    (v: boolean) => {
      // Αν είναι ανοιχτό το Quick, ΜΗΝ κλείνεις το parent
      if (openQuick && v === false) return;
      onOpenChange(v);
    },
    [openQuick, onOpenChange]
  );

  // όταν ολοκληρώνεται η δημιουργία, ανανέωσε options & preselect
  const handleQuickCreated = (newOrg: { id: string; name: string }) => {
    setOrgOptions((prev) => [{ id: newOrg.id, label: newOrg.name }, ...prev]);
    setValue('parentId', newOrg.id, { shouldValidate: true });
    //setOpenQuick(false);
  };

  // ---- Multi-country (UI-only state) ----
  const initialCountries = useMemo(() => {
    const many = (current as any)?.countries?.map?.((c: any) => c.id) ?? [];
    if (many.length > 0) return many as string[];
    const single = (current as any)?.countryId ?? current?.country?.id ?? '';
    return single ? [String(single)] : [];
  }, [current]);

  const [countriesIds, setCountriesIds] = useState<string[]>(initialCountries);

  useEffect(() => {
    if (open) {
      reset({
        name: current?.name ?? '',
        code: current?.code ?? '',
        type: (current?.type as any) ?? 'OTHER',
        organizationImage: current?.organizationImage ?? '',
        description: current?.description ?? '',
        parentId:
          (current as any)?.parentId ?? (current as any)?.parent?.id ?? '',
      });
      // refresh multi
      setCountriesIds(initialCountries);
    }
  }, [open, current, reset, initialCountries]);

  const parentValue = watch('parentId') || '';
  const countryOptions = useMemo(() => toMultiOptions(countries), [countries]);
  //   const orgOptions = organizations;
  console.log('orgOptions', orgOptions);
  // ---- Submit ----
  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      // Send the RHF values + the multi-country array to the server
      const payload = {
        ...values,
        countriesIds,
      } as any;

      if (isEdit && current?.id) {
        const res = await updateOrganization(current.id, payload, finalPath);
        if (!res.ok) {
          toast.error(res.error ?? 'Σφάλμα ενημέρωσης');
          return;
        }
        toast.success('Ο οργανισμός ενημερώθηκε');
      } else {
        const res = await createOrganization(payload);
        if (!res.ok) {
          toast.error(res.error ?? 'Σφάλμα δημιουργίας');
          return;
        }
        toast.success('Ο οργανισμός δημιουργήθηκε');
      }

      await getOrganizations();
      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Σφάλμα αποθήκευσης');
    }
  };

  const title = isEdit ? 'Επεξεργασία οργανισμού' : 'Νέος οργανισμός';

  return (
    <>
      <AppDialog
        open={open}
        onOpenChange={handleParentOpenChange}
        title={title}
        modal={!openQuick}
        description='Συμπλήρωσε τα στοιχεία του οργανισμού.'
        // contentProps={
        //   openQuick
        //     ? {
        //         onInteractOutside: (e) => e.preventDefault(),
        //         onPointerDownOutside: (e) => e.preventDefault(),
        //         onEscapeKeyDown: (e) => e.preventDefault(),
        //         onCloseAutoFocus: (e) => e.preventDefault(), // <-- προαιρετικά
        //       }
        //     : undefined
        // }
        footer={
          <div className='flex gap-2 justify-end'>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Άκυρο
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
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
              placeholder='π.χ. NATO'
              register={register}
              error={errors.name?.message}
            />
          </div>

          <div>
            <AppTextInputField
              name='code'
              label='Code'
              placeholder='π.χ. NATO'
              register={register}
              error={errors.code?.message as any}
            />
          </div>

          {/* Type (RHF-aware AppSelect) */}
          <div>
            <AppSelect
              label='Τύπος *'
              name='type'
              options={ORGANIZATION_TYPE_OPTIONS}
              getValues={getValues}
              // the small `as any` avoids RHF's literal-name union clash
              setValue={setValue as any}
              errors={errors as any}
              getLabel={(t: any) => t.label}
            />
          </div>

          <div>
            <AppTextInputField
              name='organizationImage'
              label='Εικόνα (URL ή path)'
              placeholder='π.χ. /images/orgs/nato.png'
              register={register}
              error={errors.organizationImage?.message as any}
            />
          </div>

          {/* MULTI: Countries */}
          <div className='md:col-span-2'>
            <label className='block text-sm font-medium mb-1'>
              Χώρες (πολλαπλή επιλογή)
            </label>
            <AppMultiSelectMini
              value={countriesIds}
              onChange={(ids) => setCountriesIds(ids)}
              options={countryOptions}
              placeholder='—'
            />
            {/* Προαιρετικό helper */}
            {countriesIds.length === 0 && (
              <div className='text-xs text-muted-foreground mt-1'>
                * Προαιρετικό — μπορείς να αφήσεις κενό.
              </div>
            )}
          </div>

          {/* Parent (single) */}
          <div className='md:col-span-2'>
            <AppSelect
              label='Ανήκει σε οργανισμό'
              name='parentId'
              options={orgOptions}
              getValues={getValues}
              setValue={setValue as any}
              errors={errors as any}
              getLabel={(t: any) => t.label || t.name}
              onAdd={() => {
                // ή setTimeout 0, ή requestAnimationFrame
                setTimeout(() => setOpenQuick(true), 0);
              }}
              addLabel='Νέος οργανισμός'
              addIcon={appIcons.add}
            />
          </div>

          <div className='md:col-span-2'>
            <AppTextarea
              name='description'
              label='Περιγραφή'
              placeholder='Σύντομη περιγραφή…'
              rows={4}
              register={register}
              error={errors.description?.message as any}
            />
          </div>
        </div>
      </AppDialog>
      <QuickCreateOrganizationDialog
        open={openQuick}
        onOpenChange={setOpenQuick}
        onCreated={handleQuickCreated}
        finalPath={finalPath}
      />
    </>
  );
};

export default OrganizationFormDialog;
