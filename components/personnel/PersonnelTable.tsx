// import { countEntityImages } from '@/lib/utils';
// import { AppIcon } from '../app-ui';
// import { appIcons } from '@/constants/app-icons';
// import { Button } from '@/components/ui/button';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import type { PersonDTO } from '@/actions/person.actions';
// import { SortableTh } from '@/components/common';

// const PersonnelTable = ({
//   rows,
//   sortBy,
//   sortDir,
//   onSort,
// }: {
//   rows: PersonDTO[];
//   sortBy?: string;
//   sortDir?: 'asc' | 'desc';
//   onSort: (field: string, dir: 'asc' | 'desc') => void;
// }) => {
//   return (
//     <div className='rounded-md border overflow-x-auto'>
//       <Table>
//         <TableHeader>
//           <TableRow>
//             <SortableTh
//               label='Ονοματεπώνυμο'
//               field='lastName'
//               sortBy={sortBy}
//               sortDir={sortDir}
//               onSort={onSort}
//             />
//             <SortableTh
//               label='Βαθμός'
//               field='rank'
//               sortBy={sortBy}
//               sortDir={sortDir}
//               onSort={onSort}
//             />
//             <SortableTh
//               label='Κλάδος'
//               field='branch'
//               sortBy={sortBy}
//               sortDir={sortDir}
//               onSort={onSort}
//             />
//             <SortableTh
//               label='Χώρα'
//               field='country'
//               sortBy={sortBy}
//               sortDir={sortDir}
//               onSort={onSort}
//             />
//             <SortableTh
//               label='Κατάσταση'
//               field='status'
//               sortBy={sortBy}
//               sortDir={sortDir}
//               onSort={onSort}
//             />
//             <SortableTh
//               label='Τύπος'
//               field='type'
//               sortBy={sortBy}
//               sortDir={sortDir}
//               onSort={onSort}
//             />
//             <th className='text-left font-medium text-sm text-muted-foreground'>
//               Φωτογραφίες
//             </th>
//             <th className='text-left font-medium text-sm text-muted-foreground'>
//               Συναντήσεις
//             </th>
//             <th className='text-right font-medium text-sm text-muted-foreground'>
//               Ενέργειες
//             </th>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {rows.map((p) => {
//             const fullName = `${p.lastName} ${p.firstName}`.trim();
//             const sub = p.nickname ? `«${p.nickname}»` : '';
//             const imagesCount = countEntityImages(p.personImagePaths);
//             return (
//               <TableRow key={p.id} className='hover:bg-muted/40'>
//                 <TableCell>
//                   <div className='flex flex-col'>
//                     <span className='font-medium'>{fullName}</span>
//                     <span className='text-xs text-muted-foreground'>{sub}</span>
//                   </div>
//                 </TableCell>
//                 <TableCell>{p.rank?.name ?? '—'}</TableCell>
//                 <TableCell>{p.branch?.name ?? '—'}</TableCell>
//                 <TableCell>{p.country?.name ?? '—'}</TableCell>
//                 <TableCell>{p.status}</TableCell>
//                 <TableCell>{p.type}</TableCell>
//                 <TableCell>{imagesCount}</TableCell>
//                 <TableCell>{p.meetingsCount}</TableCell>
//                 <TableCell className='text-right'>
//                   <div className='inline-flex items-center gap-1'>
//                     <Button variant='ghost' size='icon' title='Προβολή'>
//                       <AppIcon icon={appIcons.view} size={16} />
//                     </Button>
//                     <Button variant='ghost' size='icon' title='Επεξεργασία'>
//                       <AppIcon icon={appIcons.edit} size={16} />
//                     </Button>
//                   </div>
//                 </TableCell>
//               </TableRow>
//             );
//           })}
//         </TableBody>
//       </Table>
//     </div>
//   );
// };
// export default PersonnelTable;
// components/personnel/PersonnelTable.tsx
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import type { PersonDTO } from '@/actions/person.actions';
import { countEntityImages, getAvatarFromPaths } from '@/lib/utils';
import { SortableTh } from '@/components/common';

function yearFromIso(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? undefined : String(d.getFullYear());
}

function formatInstallationRow(
  inst: PersonDTO['installations'][number]
): string {
  const y1 =
    yearFromIso(inst.startDate) ??
    (inst.installationYear ? String(inst.installationYear) : undefined);
  const y2 = yearFromIso(inst.endDate);
  const when = y1 ? `${y1}${y2 ? '–' + y2 : ''}` : y2 ? y2 : '';
  const where =
    inst.unit?.name ??
    inst.organization?.name ??
    inst.position?.name ??
    inst.country?.name ??
    '';
  const role = inst.position?.name;
  const rank = inst.rankAtTime?.name;
  const meta = [role, rank].filter(Boolean).join(' • ');
  return [when, where, meta].filter(Boolean).join(' · ');
}

function formatPromotionRow(pr: PersonDTO['promotions'][number]): string {
  return `${pr.year}${pr.rank?.name ? ' · ' + pr.rank.name : ''}`;
}
// ---------------------------------------------------------------------

export const PERSONNEL_TABLE_CELLS = 12; // idx, photo, name, rank, branch, country, status, type, installations, promotions, meetings, actions

export default function PersonnelTable({
  rows,
  sortBy,
  sortDir,
  onSort,
  /** για σωστή αρίθμηση όταν έχεις pagination (π.χ. (page-1)*pageSize) */
  baseIndex = 0,
}: {
  rows: PersonDTO[];
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort: (field: string, dir: 'asc' | 'desc') => void;
  baseIndex?: number;
}) {
  return (
    <div className='rounded-md border overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-12 text-center font-medium text-sm text-muted-foreground'>
              #
            </TableHead>
            <TableHead className='w-16 font-medium text-sm text-muted-foreground'>
              Φωτο
            </TableHead>
            <SortableTh
              label='Ονοματεπώνυμο'
              field='lastName'
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={onSort}
            />
            <SortableTh
              label='Βαθμός'
              field='rank'
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={onSort}
            />
            <SortableTh
              label='Κλάδος'
              field='branch'
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={onSort}
            />
            <SortableTh
              label='Χώρα'
              field='country'
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={onSort}
            />
            <SortableTh
              label='Κατάσταση'
              field='status'
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={onSort}
            />
            <SortableTh
              label='Τύπος'
              field='type'
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={onSort}
            />
            <TableHead className='font-medium text-sm text-muted-foreground'>
              Τοποθετήσεις
            </TableHead>
            <TableHead className='font-medium text-sm text-muted-foreground'>
              Προαγωγές
            </TableHead>
            <TableHead className='font-medium text-sm text-muted-foreground'>
              Συναντήσεις
            </TableHead>
            <TableHead className='text-right font-medium text-sm text-muted-foreground'>
              Ενέργειες
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p, i) => {
            const idx = baseIndex + i + 1;
            const fullName = `${p.lastName} ${p.firstName}`.trim();
            const sub = p.nickname ? `«${p.nickname}»` : '';
            const imagesCount = countEntityImages(p.personImagePaths);
            const avatar = getAvatarFromPaths(p.personImagePaths);

            // latest first
            const installations = [...(p.installations ?? [])].sort((a, b) =>
              (b.startDate || '').localeCompare(a.startDate || '')
            );
            const promotions = [...(p.promotions ?? [])].sort(
              (a, b) => b.year - a.year
            );

            return (
              <TableRow key={p.id} className='hover:bg-muted/40 align-top'>
                {/* index */}
                <TableCell className='text-center text-xs text-muted-foreground w-12'>
                  {idx}
                </TableCell>

                {/* avatar + badge */}
                <TableCell className='w-16'>
                  <div className='relative h-10 w-10 rounded-full overflow-hidden bg-muted flex items-center justify-center'>
                    {avatar ? (
                      <Image
                        src={avatar}
                        alt={fullName}
                        fill
                        className='object-cover'
                        sizes='40px'
                      />
                    ) : (
                      <AppIcon
                        icon={appIcons.user_head}
                        size={18}
                        className='text-muted-foreground'
                      />
                    )}
                    {imagesCount > 0 && (
                      <span className='absolute -bottom-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-5 text-center'>
                        {imagesCount}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* name */}
                <TableCell>
                  <div className='flex flex-col'>
                    <span className='font-medium'>{fullName}</span>
                    {sub ? (
                      <span className='text-xs text-muted-foreground'>
                        {sub}
                      </span>
                    ) : null}
                  </div>
                </TableCell>

                <TableCell>{p.rank?.name ?? '—'}</TableCell>
                <TableCell>{p.branch?.name ?? '—'}</TableCell>
                <TableCell>{p.country?.name ?? '—'}</TableCell>
                <TableCell>{p.status}</TableCell>
                <TableCell>{p.type}</TableCell>

                {/* installations list */}
                <TableCell>
                  <div className='flex flex-col gap-1 text-xs text-muted-foreground'>
                    {installations.length ? (
                      installations.map((inst) => (
                        <div key={inst.id} className='truncate'>
                          {formatInstallationRow(inst)}
                        </div>
                      ))
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </TableCell>

                {/* promotions list */}
                <TableCell>
                  <div className='flex flex-col gap-1 text-xs text-muted-foreground'>
                    {promotions.length ? (
                      promotions.map((pr, idx) => (
                        <div key={`${p.id}-pr-${idx}`} className='truncate'>
                          {formatPromotionRow(pr)}
                        </div>
                      ))
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </TableCell>

                {/* meetings */}
                <TableCell>{p.meetingsCount}</TableCell>

                {/* actions */}
                <TableCell className='text-right'>
                  <div className='inline-flex items-center gap-1'>
                    <Button variant='ghost' size='icon' title='Προβολή'>
                      <AppIcon icon={appIcons.view} size={16} />
                    </Button>
                    <Button variant='ghost' size='icon' title='Επεξεργασία'>
                      <AppIcon icon={appIcons.edit} size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

//// components/personnel/PersonnelTable.tsx
// 'use client';

// import { Button } from '@/components/ui/button';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import { AppIcon } from '@/components/app-ui';
// import { appIcons } from '@/constants/app-icons';
// import { cn } from '@/lib/utils';
// import type { PersonDTO } from '@/actions/person.actions';
// import {
//   countEntityImages,
//   getAvatarFromImages,
//   yearFromISO,
// } from '@/lib/utils';

// // Αν έχεις ήδη SortableTh, χρησιμοποίησέ το. Αλλιώς mini inline:
// type Dir = 'asc' | 'desc';
// const nextDir = (d?: Dir): Dir => (d === 'asc' ? 'desc' : 'asc');
// export function SortableTh({
//   label,
//   field,
//   sortBy,
//   sortDir,
//   onSort,
//   className,
// }: {
//   label: string;
//   field: string;
//   sortBy?: string;
//   sortDir?: Dir;
//   onSort: (field: string, dir: Dir) => void;
//   className?: string;
// }) {
//   const active = sortBy === field;
//   const dir: Dir = active ? sortDir || 'asc' : 'asc';
//   return (
//     <th
//       className={cn(
//         'text-left font-medium text-sm text-muted-foreground',
//         className
//       )}
//     >
//       <button
//         className='inline-flex items-center gap-1 hover:underline'
//         onClick={() => onSort(field, active ? nextDir(sortDir) : 'asc')}
//         title={`Sort by ${label}`}
//       >
//         <span>{label}</span>
//         {active ? (
//           dir === 'asc' ? (
//             <AppIcon icon={appIcons.chevronUp} size={14} />
//           ) : (
//             <AppIcon icon={appIcons.chevronDown} size={14} />
//           )
//         ) : (
//           <AppIcon
//             icon={appIcons.sort}
//             size={12}
//             className='text-muted-foreground'
//           />
//         )}
//       </button>
//     </th>
//   );
// }

// export const PERSONNEL_TABLE_CELLS = 12; // #, photo, name, rank, branch, country, status, type, installations, promotions, meetings, actions

// export function PersonnelTable({
//   rows,
//   sortBy,
//   sortDir,
//   onSort,
//   baseIndex = 0,
// }: {
//   rows: PersonDTO[];
//   sortBy?: string;
//   sortDir?: Dir;
//   onSort: (field: string, dir: Dir) => void;
//   /** από container για σωστή αρίθμηση με pagination */
//   baseIndex?: number;
// }) {
//   return (
//     <div className='rounded-md border overflow-x-auto'>
//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead className='w-[40px]'>#</TableHead>
//             <TableHead className='w-[68px]'>Φωτο</TableHead>
//             <SortableTh
//               label='Ονοματεπώνυμο'
//               field='lastName'
//               sortBy={sortBy}
//               sortDir={sortDir}
//               onSort={onSort}
//             />
//             <SortableTh
//               label='Βαθμός'
//               field='rank'
//               sortBy={sortBy}
//               sortDir={sortDir}
//               onSort={onSort}
//             />
//             <SortableTh
//               label='Κλάδος'
//               field='branch'
//               sortBy={sortBy}
//               sortDir={sortDir}
//               onSort={onSort}
//             />
//             <SortableTh
//               label='Χώρα'
//               field='country'
//               sortBy={sortBy}
//               sortDir={sortDir}
//               onSort={onSort}
//             />
//             <SortableTh
//               label='Κατάσταση'
//               field='status'
//               sortBy={sortBy}
//               sortDir={sortDir}
//               onSort={onSort}
//             />
//             <SortableTh
//               label='Τύπος'
//               field='type'
//               sortBy={sortBy}
//               sortDir={sortDir}
//               onSort={onSort}
//             />
//             <TableHead className='min-w-[240px]'>Τοποθετήσεις</TableHead>
//             <TableHead className='min-w-[200px]'>Προαγωγές</TableHead>
//             <TableHead>Συναντήσεις</TableHead>
//             <TableHead className='text-right'>Ενέργειες</TableHead>
//           </TableRow>
//         </TableHeader>

//         <TableBody>
//           {rows.map((p, i) => {
//             const rowNo = baseIndex + i + 1;
//             const fullName = `${p.lastName} ${p.firstName}`.trim();
//             const nickname = p.nickname ? `«${p.nickname}»` : '';
//             const imagesCount = countEntityImages(p.personImagePaths);
//             const avatar = getAvatarFromImages(p.personImagePaths);

//             const installations = [...(p.installations || [])]
//               .sort((a, b) =>
//                 (b.startDate || '').localeCompare(a.startDate || '')
//               )
//               .slice(0, 3);

//             const promotions = [...(p.promotions || [])]
//               .sort((a, b) => b.year - a.year)
//               .slice(0, 3);

//             return (
//               <TableRow key={p.id} className='hover:bg-muted/40'>
//                 {/* index */}
//                 <TableCell className='py-2 text-xs text-muted-foreground'>
//                   {rowNo}
//                 </TableCell>

//                 {/* photo + badge */}
//                 <TableCell className='py-2'>
//                   <div className='relative inline-block'>
//                     <div className='h-10 w-10 rounded-full bg-muted overflow-hidden ring-1 ring-border flex items-center justify-center'>
//                       {avatar ? (
//                         // eslint-disable-next-line @next/next/no-img-element
//                         <img
//                           src={avatar}
//                           alt={fullName}
//                           className='h-full w-full object-cover'
//                         />
//                       ) : (
//                         <span className='text-[11px] font-medium text-muted-foreground'>
//                           {p.firstName?.[0]}
//                           {p.lastName?.[0]}
//                         </span>
//                       )}
//                     </div>
//                     {imagesCount > 0 && (
//                       <span className='absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground'>
//                         {imagesCount}
//                       </span>
//                     )}
//                   </div>
//                 </TableCell>

//                 {/* name */}
//                 <TableCell>
//                   <div className='flex flex-col'>
//                     <span className='font-medium'>{fullName}</span>
//                     <span className='text-xs text-muted-foreground'>
//                       {nickname}
//                     </span>
//                   </div>
//                 </TableCell>

//                 <TableCell>{p.rank?.name ?? '—'}</TableCell>
//                 <TableCell>{p.branch?.name ?? '—'}</TableCell>
//                 <TableCell>{p.country?.name ?? '—'}</TableCell>
//                 <TableCell>{p.status}</TableCell>
//                 <TableCell>{p.type}</TableCell>

//                 {/* installations (latest first) */}
//                 <TableCell>
//                   <div className='flex flex-col gap-1 text-xs text-muted-foreground'>
//                     {installations.length ? (
//                       installations.map((it) => {
//                         const startY = yearFromISO(it.startDate);
//                         const endY = yearFromISO(it.endDate);
//                         const place =
//                           it.unit?.name ||
//                           it.organization?.name ||
//                           it.country?.name ||
//                           '—';
//                         const role = it.position?.name || it.type;
//                         return (
//                           <div key={it.id} className='flex items-center gap-2'>
//                             <span className='text-foreground font-medium'>
//                               {startY}
//                               {endY !== '—' ? `–${endY}` : ''}
//                             </span>
//                             <span className='truncate'>{place}</span>
//                             <span className='text-[11px] italic'>{role}</span>
//                           </div>
//                         );
//                       })
//                     ) : (
//                       <span>—</span>
//                     )}
//                   </div>
//                 </TableCell>

//                 {/* promotions (latest first) */}
//                 <TableCell>
//                   <div className='flex flex-col gap-1 text-xs text-muted-foreground'>
//                     {promotions.length ? (
//                       promotions.map((pr, idx2) => (
//                         <div
//                           key={`${p.id}-pr-${idx2}`}
//                           className='flex items-center gap-2'
//                         >
//                           <span className='text-foreground font-medium'>
//                             {pr.year}
//                           </span>
//                           <span className='truncate'>{pr.rank?.name}</span>
//                           {pr.rank?.code && (
//                             <span className='text-[11px]'>
//                               ({pr.rank.code})
//                             </span>
//                           )}
//                         </div>
//                       ))
//                     ) : (
//                       <span>—</span>
//                     )}
//                   </div>
//                 </TableCell>

//                 <TableCell>{p.meetingsCount}</TableCell>

//                 {/* actions */}
//                 <TableCell className='text-right'>
//                   <div className='inline-flex items-center gap-1'>
//                     <Button variant='ghost' size='icon' title='Προβολή'>
//                       <AppIcon icon={appIcons.view} size={16} />
//                     </Button>
//                     <Button variant='ghost' size='icon' title='Επεξεργασία'>
//                       <AppIcon icon={appIcons.edit} size={16} />
//                     </Button>
//                   </div>
//                 </TableCell>
//               </TableRow>
//             );
//           })}
//         </TableBody>
//       </Table>
//     </div>
//   );
// }
