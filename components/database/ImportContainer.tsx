// 'use client';

// import React, { useState, useRef } from 'react';
// import { useRouter } from 'next/navigation';

// import {
//   importLookupsFromXlsx,
//   type ImportResult,
// } from '@/actions/import.actions';
// import { wipeDatabase } from '@/actions/import.actions';
// import { Card, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Label } from '@/components/ui/label';
// import { Switch } from '@/components/ui/switch';
// import { Checkbox } from '@/components/ui/checkbox';
// import { AppIcon } from '@/components/app-ui';
// import { appIcons } from '@/constants/app-icons';
// import { cn } from '@/lib/utils';

// // shadcn/ui AlertDialog
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogDescription,
//   AlertDialogTrigger,
// } from '@/components/ui/alert-dialog';

// const ENTITY_LIST = [
//   { key: 'loadRegions', label: 'Regions' },
//   { key: 'loadCountries', label: 'Countries' },
//   { key: 'loadBranches', label: 'Branches' },
//   { key: 'loadRanks', label: 'Ranks' },
//   { key: 'loadOrganizations', label: 'Organizations' },
//   { key: 'loadUnits', label: 'Units' },
//   { key: 'loadSpecialties', label: 'Specialties' },
//   { key: 'loadPositions', label: 'Positions' },
//   { key: 'loadPersonnel', label: 'Personnel' },
//   { key: 'loadEquipment', label: 'Equipment' },
//   { key: 'loadCompanies', label: 'Companies' },
//   { key: 'loadCompanyOffices', label: 'CompanyOffices' },
//   { key: 'loadCompanyOrganizations', label: 'CompanyOrganizations' },
//   { key: 'loadCountryOrganizations', label: 'CountryOrganizations' },
//   { key: 'loadPromotions', label: 'Promotions' },
//   { key: 'loadMeetings', label: 'Meetings' },
//   { key: 'loadMeetingTopics', label: 'MeetingTopics' },
//   { key: 'loadMeetingParticipants', label: 'MeetingParticipants' },
//   { key: 'loadPersonPostings', label: 'PersonPostings' },
//   { key: 'loadEquipmentAssignments', label: 'EquipmentAssignments' },
// ] as const;

// type EntityKey = (typeof ENTITY_LIST)[number]['key'];

// const ImportContainer = () => {
//   const router = useRouter();
//   const [file, setFile] = useState<File | null>(null);
//   const [dryRun, setDryRun] = useState(true);
//   const [pending, setPending] = useState(false);
//   const [log, setLog] = useState<ImportResult | null>(null);
//   const [wipeBefore, setWipeBefore] = useState(false);
//   const [confirmOpen, setConfirmOpen] = useState(false);
//   const [wipeStatus, setWipeStatus] = useState<string | null>(null);

//   const fileRef = useRef<HTMLInputElement | null>(null);

//   const [selected, setSelected] = useState<Record<EntityKey, boolean>>({
//     loadRegions: true,
//     loadCountries: true,
//     loadBranches: true,
//     loadRanks: true,
//     loadOrganizations: true,
//     loadUnits: true,
//     loadSpecialties: true,
//     loadPositions: true,

//     loadPersonnel: false,
//     loadEquipment: false,
//     loadCompanies: false,
//     loadCompanyOffices: false,
//     loadCompanyOrganizations: false,
//     loadCountryOrganizations: false,
//     loadPromotions: false,
//     loadMeetings: false,
//     loadMeetingTopics: false,
//     loadMeetingParticipants: false,
//     loadPersonPostings: false,
//     loadEquipmentAssignments: false,
//   });

//   const doImport = async () => {
//     if (!file) return;

//     setPending(true);
//     setWipeStatus(null);
//     try {
//       // αν dryRun, αγνοούμε το wipe
//       if (wipeBefore && !dryRun) {
//         setWipeStatus('Γίνεται καθαρισμός βάσης…');
//         const wipe = await wipeDatabase();
//         if (!wipe.ok) {
//           setWipeStatus(`Σφάλμα στον καθαρισμό: ${wipe.error || 'unknown'}`);
//           setPending(false);
//           return;
//         }
//         setWipeStatus('Ο καθαρισμός ολοκληρώθηκε.');
//       }

//       const fd = new FormData();
//       fd.append('file', file);
//       fd.append('dryRun', String(dryRun));
//       for (const { key } of ENTITY_LIST) {
//         fd.append(key, String(!!selected[key as EntityKey]));
//       }
//       const res = await importLookupsFromXlsx(fd);
//       setLog(res);

//       if (!res.dryRun) {
//         router.refresh();
//       }
//     } finally {
//       setPending(false);
//     }
//   };

//   const onSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!file) return;

//     if (wipeBefore && !dryRun) {
//       setConfirmOpen(true); // άνοιγμα dialog επιβεβαίωσης
//       return;
//     }
//     // αλλιώς, κάνε άμεσα import
//     doImport();
//   };

//   const toggleAll = (value: boolean) => {
//     setSelected((prev) => {
//       const next: any = { ...prev };
//       for (const { key } of ENTITY_LIST) next[key] = value;
//       return next;
//     });
//   };

//   const onPickFile = (e: any) => {
//     console.log('file', e.target.files);
//     fileRef.current?.click();
//   };
//   const onClearFile = () => {
//     setFile(null);
//     if (fileRef.current) fileRef.current.value = '';
//   };

//   const summarize = (r: ImportResult) => ({
//     created: Object.entries(r.created).filter(([, v]) => v > 0),
//     updated: Object.entries(r.updated).filter(([, v]) => v > 0),
//     errorsCount: r.errors?.length ?? 0,
//   });

//   return (
//     <Card>
//       <CardHeader className='pb-2'>
//         <CardTitle>Εισαγωγή δεδομένων από Excel</CardTitle>
//       </CardHeader>

//       <form onSubmit={onSubmit} className='p-4 space-y-6'>
//         {/* File picker */}
//         <div className='space-y-2'>
//           <Label className='text-sm font-medium'>Αρχείο (.xlsx)</Label>
//           <div
//             className={cn(
//               'flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4',
//               'rounded-lg border bg-muted/30 p-3'
//             )}
//           >
//             <input
//               ref={fileRef}
//               type='file'
//               accept='.xlsx'
//               className='hidden'
//               onChange={(e) => setFile(e.target.files?.[0] ?? null)}
//             />

//             <div className='flex-1 min-w-0'>
//               {file ? (
//                 <div className='truncate text-sm font-medium'>
//                   <AppIcon
//                     icon={appIcons.file}
//                     className='mr-1 inline'
//                     size={14}
//                   />
//                   {file.name}
//                 </div>
//               ) : (
//                 <div className='text-sm text-muted-foreground'>
//                   Επίλεξε αρχείο Excel (.xlsx) με τα υποστηριζόμενα sheets.
//                 </div>
//               )}
//               <div className='text-xs text-muted-foreground'>
//                 Χρησιμοποίησε το template για σωστά headers.
//               </div>
//             </div>

//             <div className='flex items-center gap-2 shrink-0'>
//               {file && (
//                 <Button
//                   type='button'
//                   variant='ghost'
//                   size='sm'
//                   onClick={onClearFile}
//                 >
//                   <AppIcon icon={appIcons.delete} size={14} className='mr-1' />
//                   Καθαρισμός
//                 </Button>
//               )}
//               <Button type='button' variant='secondary' onClick={onPickFile}>
//                 <AppIcon icon={appIcons.upload} size={14} className='mr-1' />
//                 Επιλογή αρχείου
//               </Button>
//             </div>
//           </div>
//         </div>

//         {/* Options row */}
//         <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
//           <div className='flex flex-col gap-4'>
//             <div className='flex items-center gap-2'>
//               <Switch
//                 checked={dryRun}
//                 onCheckedChange={setDryRun}
//                 id='dryrun'
//               />
//               <Label htmlFor='dryrun'>Dry run (χωρίς αποθήκευση)</Label>
//             </div>

//             <div className='flex items-center gap-2'>
//               <Checkbox
//                 id='wipeBefore'
//                 checked={wipeBefore}
//                 onCheckedChange={(v) => setWipeBefore(!!v)}
//                 disabled={dryRun} // σε dryRun δεν έχει νόημα
//               />
//               <Label
//                 htmlFor='wipeBefore'
//                 className={cn(dryRun && 'opacity-50')}
//               >
//                 Καθαρισμός βάσης πριν την εισαγωγή
//               </Label>
//             </div>

//             {dryRun && (
//               <div className='text-xs text-muted-foreground'>
//                 Το Dry run είναι ενεργό — ο καθαρισμός βάσης θα αγνοηθεί.
//               </div>
//             )}
//             {wipeStatus && <div className='text-xs'>{wipeStatus}</div>}
//           </div>

//           {/* Submit */}
//           <Button
//             type='submit'
//             disabled={!file || pending}
//             className='sm:self-end'
//           >
//             {pending
//               ? 'Γίνεται εισαγωγή…'
//               : dryRun
//               ? 'Προσομοίωση'
//               : 'Εισαγωγή'}
//           </Button>
//         </div>

//         {/* Entities */}
//         <div className='rounded-lg border'>
//           <div className='flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/40 sticky top-0'>
//             <div className='font-medium'>Ποιές οντότητες να φορτώσω;</div>
//             <div className='flex gap-2 text-xs'>
//               <Button
//                 type='button'
//                 variant='outline'
//                 size='sm'
//                 onClick={() => toggleAll(true)}
//               >
//                 Όλα
//               </Button>
//               <Button
//                 type='button'
//                 variant='outline'
//                 size='sm'
//                 onClick={() => toggleAll(false)}
//               >
//                 Κανένα
//               </Button>
//             </div>
//           </div>

//           <div className='p-3 max-h-[340px] overflow-auto'>
//             <div className='grid gap-2 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
//               {ENTITY_LIST.map(({ key, label }) => (
//                 <label
//                   key={key}
//                   className='flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm hover:bg-muted/50'
//                 >
//                   <Checkbox
//                     checked={!!selected[key as EntityKey]}
//                     onCheckedChange={(v) =>
//                       setSelected((s) => ({ ...s, [key]: !!v }))
//                     }
//                   />
//                   <span className='truncate'>{label}</span>
//                 </label>
//               ))}
//             </div>
//           </div>
//         </div>
//         {/* {log && <pre className="text-xs">{JSON.stringify(summarize(log), null, 2)}</pre>} */}
//         {/* Results */}
//         {log && (
//           <div className='rounded-md border bg-muted/30 p-3 text-sm'>
//             <div className='font-semibold mb-2'>Αποτέλεσμα:</div>
//             <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
//               <div className='rounded-md border p-2 bg-background/60'>
//                 <div className='font-medium mb-1'>Created</div>
//                 <pre className='text-xs overflow-auto max-h-64'>
//                   {JSON.stringify(log.created, null, 2)}
//                 </pre>
//                 {/* <pre className='text-xs'>
//                   {JSON.stringify(summarize(log), null, 2)}
//                 </pre> */}
//               </div>
//               <div className='rounded-md border p-2 bg-background/60'>
//                 <div className='font-medium mb-1'>Updated</div>
//                 <pre className='text-xs overflow-auto max-h-64'>
//                   {JSON.stringify(log.updated, null, 2)}
//                 </pre>
//               </div>
//             </div>

//             {log.errors?.length ? (
//               <div className='mt-3 rounded-md border bg-background/60 p-2'>
//                 <div className='font-medium text-red-600 mb-1'>Errors</div>
//                 <ul className='list-disc pl-5 space-y-0.5 max-h-60 overflow-auto'>
//                   {log.errors.map((e: string, i: number) => (
//                     <li key={i} className='text-xs'>
//                       {e}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             ) : null}

//             <div className='mt-2 opacity-70 text-xs'>
//               Dry run: {String(log.dryRun)}
//             </div>
//           </div>
//         )}
//       </form>

//       {/* Confirm wipe dialog */}
//       <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Επιβεβαίωση καθαρισμού</AlertDialogTitle>
//             <AlertDialogDescription>
//               Θα καθαριστούν <strong>όλοι</strong> οι πίνακες της βάσης
//               (περιλαμβάνονται άτομα, οργανισμοί, μονάδες, εξοπλισμοί, κ.λπ.). Η
//               ενέργεια δεν είναι αναστρέψιμη. Θέλεις να συνεχίσεις;
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Άκυρο</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={() => {
//                 setConfirmOpen(false);
//                 // Προχώρα στο import (θα καλέσει wipe πρώτα)
//                 doImport();
//               }}
//             >
//               Ναι, καθάρισε & εισήγαγε
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </Card>
//   );
// };

// export default ImportContainer;

'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  importLookupsFromXlsx,
  wipeDatabase,
  type ImportResult,
} from '@/actions/import.actions';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { cn } from '@/lib/utils';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';

/* -------------------------------- Config --------------------------------- */
const ENTITY_LIST = [
  { key: 'loadRegions', label: 'Regions' },
  { key: 'loadBranches', label: 'Branches' },
  { key: 'loadRanks', label: 'Ranks' },
  { key: 'loadOrganizations', label: 'Organizations' },
  { key: 'loadUnits', label: 'Units' },
  { key: 'loadSpecialties', label: 'Specialties' },
  { key: 'loadPositions', label: 'Positions' },
  { key: 'loadCountries', label: 'Countries' },
  { key: 'loadCountryOrganizations', label: 'CountryOrganizations' },
  { key: 'loadPersonnel', label: 'Personnel' },
  { key: 'loadPersonOrganizations', label: 'PersonOrganizations' },
  { key: 'loadPersonPostings', label: 'PersonPostings' },
  { key: 'loadPromotions', label: 'Promotions' },
  { key: 'loadCompanies', label: 'Companies' },
  { key: 'loadCompanyOffices', label: 'CompanyOffices' },
  { key: 'loadCompanyOrganizations', label: 'CompanyOrganizations' },
  { key: 'loadEquipment', label: 'Equipment' },
  { key: 'loadEquipmentAssignments', label: 'EquipmentAssignments' },
  { key: 'loadMeetings', label: 'Meetings' },
  { key: 'loadMeetingTopics', label: 'MeetingTopics' },
  { key: 'loadMeetingParticipants', label: 'MeetingParticipants' },
  { key: 'loadMeetingOrganizations', label: 'MeetingOrganizations' },
] as const;

type EntityKey = (typeof ENTITY_LIST)[number]['key'];

/** Βοηθός για να δημιουργούμε πλήρες αρχικό state με ρητούς τύπους */
const makeInitialSelected = (): Record<EntityKey, boolean> => ({
  loadRegions: true,
  loadCountries: true,
  loadBranches: true,
  loadRanks: true,
  loadOrganizations: true,
  loadUnits: true,
  loadSpecialties: true,
  loadPositions: true,

  loadPersonOrganizations: false,
  loadPersonnel: false,
  loadEquipment: false,
  loadCompanies: false,
  loadCompanyOffices: false,
  loadCompanyOrganizations: false,
  loadCountryOrganizations: false,
  loadPromotions: false,
  loadMeetings: false,
  loadMeetingTopics: false,
  loadMeetingOrganizations: false,
  loadMeetingParticipants: false,
  loadPersonPostings: false,
  loadEquipmentAssignments: false,
});

/* ------------------------------- Component -------------------------------- */
const ImportContainer = () => {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [pending, setPending] = useState(false);
  const [log, setLog] = useState<ImportResult | null>(null);
  const [wipeBefore, setWipeBefore] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [wipeStatus, setWipeStatus] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [selected, setSelected] = useState<Record<EntityKey, boolean>>(
    makeInitialSelected()
  );

  const hasAnySelected = useMemo(
    () => Object.values(selected).some(Boolean),
    [selected]
  );

  const doImport = async () => {
    if (!file) return;
    setPending(true);
    setWipeStatus(null);
    setLog(null);

    try {
      if (wipeBefore && !dryRun) {
        setWipeStatus('Γίνεται καθαρισμός βάσης…');
        const wipe = await wipeDatabase();
        if (!wipe.ok) {
          setWipeStatus(`Σφάλμα στον καθαρισμό: ${wipe.error || 'unknown'}`);
          return;
        }
        setWipeStatus('Ο καθαρισμός ολοκληρώθηκε.');
      }

      const fd = new FormData();
      fd.append('file', file);
      fd.append('dryRun', String(dryRun));
      for (const { key } of ENTITY_LIST) {
        // key είναι EntityKey λόγω as const ⇒ type-safe indexing
        fd.append(key, String(!!selected[key]));
      }

      const res = await importLookupsFromXlsx(fd);
      setLog(res);

      if (!res.dryRun) router.refresh();
    } catch (e: any) {
      setLog({
        created: {} as any,
        updated: {} as any,
        dryRun,
        errors: [e?.message || String(e)],
      });
    } finally {
      setPending(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (wipeBefore && !dryRun) {
      setConfirmOpen(true);
      return;
    }
    doImport();
  };

  const toggleAll = (value: boolean) => {
    setSelected((_) => {
      const next = {} as Record<EntityKey, boolean>;
      for (const { key } of ENTITY_LIST) next[key] = value;
      return next;
    });
  };

  const onPickFile = () => {
    fileRef.current?.click();
  };

  const onClearFile = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle>Εισαγωγή δεδομένων από Excel</CardTitle>
      </CardHeader>

      <form onSubmit={onSubmit} className='p-4 space-y-6'>
        {/* File picker */}
        <div className='space-y-2'>
          <Label className='text-sm font-medium'>Αρχείο (.xlsx)</Label>
          <div
            className={cn(
              'flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4',
              'rounded-lg border bg-muted/30 p-3'
            )}
          >
            <input
              ref={fileRef}
              type='file'
              accept='.xlsx'
              className='hidden'
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            <div className='flex-1 min-w-0'>
              {file ? (
                <div className='truncate text-sm font-medium'>
                  <AppIcon
                    icon={appIcons.file}
                    className='mr-1 inline'
                    size={14}
                  />
                  {file.name}
                </div>
              ) : (
                <div className='text-sm text-muted-foreground'>
                  Επίλεξε αρχείο Excel (.xlsx) με τα υποστηριζόμενα sheets.
                </div>
              )}
              <div className='text-xs text-muted-foreground'>
                Χρησιμοποίησε το template για σωστά headers.
              </div>
            </div>

            <div className='flex items-center gap-2 shrink-0'>
              {file && (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={onClearFile}
                  disabled={pending}
                >
                  <AppIcon icon={appIcons.delete} size={14} className='mr-1' />
                  Καθαρισμός
                </Button>
              )}
              <Button
                type='button'
                variant='secondary'
                onClick={onPickFile}
                disabled={pending}
              >
                <AppIcon icon={appIcons.upload} size={14} className='mr-1' />
                Επιλογή αρχείου
              </Button>
            </div>
          </div>
        </div>

        {/* Options row */}
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-2'>
              <Switch
                checked={dryRun}
                onCheckedChange={setDryRun}
                id='dryrun'
                disabled={pending}
              />
              <Label htmlFor='dryrun'>Dry run (χωρίς αποθήκευση)</Label>
            </div>

            <div className='flex items-center gap-2'>
              <Checkbox
                id='wipeBefore'
                checked={wipeBefore}
                onCheckedChange={(v) => setWipeBefore(!!v)}
                disabled={dryRun || pending}
              />
              <Label
                htmlFor='wipeBefore'
                className={cn((dryRun || pending) && 'opacity-50')}
              >
                Καθαρισμός βάσης πριν την εισαγωγή
              </Label>
            </div>

            {dryRun && (
              <div className='text-xs text-muted-foreground'>
                Το Dry run είναι ενεργό — ο καθαρισμός βάσης θα αγνοηθεί.
              </div>
            )}
            {wipeStatus && <div className='text-xs'>{wipeStatus}</div>}
          </div>

          <Button
            type='submit'
            disabled={!file || pending || !hasAnySelected}
            className='sm:self-end'
          >
            {pending
              ? 'Γίνεται εισαγωγή…'
              : dryRun
              ? 'Προσομοίωση'
              : 'Εισαγωγή'}
          </Button>
        </div>

        {/* Entities */}
        <div className='rounded-lg border'>
          <div className='flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/40 sticky top-0'>
            <div className='font-medium'>Ποιες οντότητες να φορτώσω;</div>
            <div className='flex gap-2 text-xs'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => toggleAll(true)}
                disabled={pending}
              >
                Όλα
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => toggleAll(false)}
                disabled={pending}
              >
                Κανένα
              </Button>
            </div>
          </div>

          <div className='p-3 max-h-[340px] overflow-auto'>
            <div className='grid gap-2 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
              {ENTITY_LIST.map(({ key, label }) => (
                <label
                  key={key}
                  className='flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm hover:bg-muted/50'
                >
                  <Checkbox
                    checked={selected[key]}
                    onCheckedChange={(v) =>
                      setSelected((s) => ({ ...s, [key]: !!v }))
                    }
                    disabled={pending}
                  />
                  <span className='truncate'>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {log && (
          <div className='rounded-md border bg-muted/30 p-3 text-sm'>
            <div className='font-semibold mb-2'>Αποτέλεσμα:</div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <div className='rounded-md border p-2 bg-background/60'>
                <div className='font-medium mb-1'>Created</div>
                <pre className='text-xs overflow-auto max-h-64'>
                  {JSON.stringify(log.created, null, 2)}
                </pre>
              </div>
              <div className='rounded-md border p-2 bg-background/60'>
                <div className='font-medium mb-1'>Updated</div>
                <pre className='text-xs overflow-auto max-h-64'>
                  {JSON.stringify(log.updated, null, 2)}
                </pre>
              </div>
            </div>

            {log.errors?.length ? (
              <div className='mt-3 rounded-md border bg-background/60 p-2'>
                <div className='font-medium text-red-600 mb-1'>Errors</div>
                <ul className='list-disc pl-5 space-y-0.5 max-h-60 overflow-auto'>
                  {log.errors.map((e: string, i: number) => (
                    <li key={i} className='text-xs'>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className='mt-2 opacity-70 text-xs'>
              Dry run: {String(log.dryRun)}
            </div>
          </div>
        )}
      </form>

      {/* Confirm wipe dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Επιβεβαίωση καθαρισμού</AlertDialogTitle>
            <AlertDialogDescription>
              Θα καθαριστούν <strong>όλοι</strong> οι πίνακες της βάσης (άτομα,
              οργανισμοί, μονάδες, εξοπλισμοί, κ.λπ.). Η ενέργεια δεν είναι
              αναστρέψιμη. Θέλεις να συνεχίσεις;
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Άκυρο</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                void doImport();
              }}
              disabled={pending}
            >
              Ναι, καθάρισε & εισήγαγε
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ImportContainer;
