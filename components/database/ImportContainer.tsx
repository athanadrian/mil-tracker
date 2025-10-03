// 'use client';

// import React, { useState } from 'react';
// import { importLookupsFromXlsx } from '@/actions/import.actions';
// import { Card, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Label } from '@/components/ui/label';
// import { Switch } from '@/components/ui/switch';

// const ImportContainer = () => {
//   const [file, setFile] = useState<File | null>(null);
//   const [dryRun, setDryRun] = useState(true);
//   const [pending, setPending] = useState(false);
//   const [log, setLog] = useState<any | null>(null);

//   const onSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!file) return;

//     setPending(true);
//     try {
//       const fd = new FormData();
//       fd.append('file', file);
//       fd.append('dryRun', String(dryRun));
//       const res = await importLookupsFromXlsx(fd);
//       setLog(res);
//     } finally {
//       setPending(false);
//     }
//   };

//   return (
//     <Card>
//       <CardHeader className='pb-2'>
//         <CardTitle>Εισαγωγή δεδομένων από Excel</CardTitle>
//       </CardHeader>
//       <form onSubmit={onSubmit} className='p-4 space-y-4'>
//         <div className='flex items-center gap-3'>
//           <input
//             type='file'
//             accept='.xlsx'
//             onChange={(e) => setFile(e.target.files?.[0] ?? null)}
//           />
//           <div className='flex items-center gap-2'>
//             <Switch checked={dryRun} onCheckedChange={setDryRun} id='dryrun' />
//             <Label htmlFor='dryrun'>Dry run (χωρίς αποθήκευση)</Label>
//           </div>
//           <Button type='submit' disabled={!file || pending}>
//             {pending
//               ? 'Γίνεται εισαγωγή…'
//               : dryRun
//               ? 'Προσομοίωση'
//               : 'Εισαγωγή'}
//           </Button>
//         </div>

//         {log && (
//           <div className='rounded-md border bg-muted/30 p-3 text-sm'>
//             <div className='font-semibold mb-1'>Αποτέλεσμα:</div>
//             <div className='grid grid-cols-2 gap-2'>
//               <div>
//                 <div className='font-medium'>Created</div>
//                 <pre className='text-xs'>
//                   {JSON.stringify(log.created, null, 2)}
//                 </pre>
//               </div>
//               <div>
//                 <div className='font-medium'>Updated</div>
//                 <pre className='text-xs'>
//                   {JSON.stringify(log.updated, null, 2)}
//                 </pre>
//               </div>
//             </div>
//             {log.errors?.length ? (
//               <>
//                 <div className='font-medium mt-2 text-red-600'>Errors</div>
//                 <ul className='list-disc pl-5'>
//                   {log.errors.map((e: string, i: number) => (
//                     <li key={i} className='text-xs'>
//                       {e}
//                     </li>
//                   ))}
//                 </ul>
//               </>
//             ) : null}
//             <div className='mt-2 opacity-70'>Dry run: {String(log.dryRun)}</div>
//           </div>
//         )}
//       </form>
//     </Card>
//   );
// };
// export default ImportContainer;

/* ------------------------------ CLIENT UI ------------------------------ */

'use client';

import React, { useState } from 'react';
import { importLookupsFromXlsx } from '@/actions/import.actions';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

const ENTITY_LIST = [
  { key: 'loadRegions', label: 'Regions' },
  { key: 'loadCountries', label: 'Countries' },
  { key: 'loadBranches', label: 'Branches' },
  { key: 'loadRanks', label: 'Ranks' },
  { key: 'loadOrganizations', label: 'Organizations' },
  { key: 'loadUnits', label: 'Units' },
  { key: 'loadPersonnel', label: 'Personnel' },
  { key: 'loadEquipment', label: 'Equipment' },
] as const;

type EntityKey = (typeof ENTITY_LIST)[number]['key'];

const ImportContainer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [pending, setPending] = useState(false);
  const [log, setLog] = useState<any | null>(null);
  const [selected, setSelected] = useState<Record<EntityKey, boolean>>({
    loadRegions: true,
    loadCountries: true,
    loadBranches: true,
    loadRanks: true,
    loadOrganizations: true,
    loadUnits: true,
    loadPersonnel: false,
    loadEquipment: false,
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setPending(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('dryRun', String(dryRun));
      for (const { key } of ENTITY_LIST) {
        fd.append(key, String(!!selected[key as EntityKey]));
      }
      const res = await importLookupsFromXlsx(fd);
      setLog(res);
    } finally {
      setPending(false);
    }
  };

  const toggleAll = (value: boolean) => {
    setSelected((prev) => {
      const next: any = { ...prev };
      for (const { key } of ENTITY_LIST) next[key] = value;
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle>Εισαγωγή δεδομένων από Excel</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit} className='p-4 space-y-4'>
        <div className='flex items-center gap-3'>
          <input
            type='file'
            accept='.xlsx'
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className='flex items-center gap-2'>
            <Switch checked={dryRun} onCheckedChange={setDryRun} id='dryrun' />
            <Label htmlFor='dryrun'>Dry run (χωρίς αποθήκευση)</Label>
          </div>
          <Button type='submit' disabled={!file || pending}>
            {pending
              ? 'Γίνεται εισαγωγή…'
              : dryRun
              ? 'Προσομοίωση'
              : 'Εισαγωγή'}
          </Button>
        </div>

        <div className='rounded-md border p-3'>
          <div className='flex items-center justify-between mb-2'>
            <div className='font-medium'>Ποιές οντότητες να φορτώσω;</div>
            <div className='flex gap-2 text-xs'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => toggleAll(true)}
              >
                Όλα
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => toggleAll(false)}
              >
                Κανένα
              </Button>
            </div>
          </div>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2'>
            {ENTITY_LIST.map(({ key, label }) => (
              <label key={key} className='flex items-center gap-2 text-sm'>
                <Checkbox
                  checked={!!selected[key as EntityKey]}
                  onCheckedChange={(v) =>
                    setSelected((s) => ({ ...s, [key]: !!v }))
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {log && (
          <div className='rounded-md border bg-muted/30 p-3 text-sm'>
            <div className='font-semibold mb-1'>Αποτέλεσμα:</div>
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <div className='font-medium'>Created</div>
                <pre className='text-xs'>
                  {JSON.stringify(log.created, null, 2)}
                </pre>
              </div>
              <div>
                <div className='font-medium'>Updated</div>
                <pre className='text-xs'>
                  {JSON.stringify(log.updated, null, 2)}
                </pre>
              </div>
            </div>
            {log.errors?.length ? (
              <>
                <div className='font-medium mt-2 text-red-600'>Errors</div>
                <ul className='list-disc pl-5'>
                  {log.errors.map((e: string, i: number) => (
                    <li key={i} className='text-xs'>
                      {e}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <div className='mt-2 opacity-70'>Dry run: {String(log.dryRun)}</div>
          </div>
        )}
      </form>
    </Card>
  );
};
export default ImportContainer;
