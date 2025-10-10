// 'use client';
// import React, { useMemo, useState } from 'react';
// import { PersonDetailDTO } from '@/actions/person.actions';

// /* shadcn UI imports (adjust paths if your project differs) */
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Avatar } from '@/components/ui/avatar';
// import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator';
// import { toStringArray } from '@/lib/utils';

// /* small inline icons to avoid extra deps */
// const ChevronLeft = (props: React.SVGProps<SVGSVGElement>) => (
//   <svg
//     viewBox='0 0 24 24'
//     width='16'
//     height='16'
//     fill='none'
//     stroke='currentColor'
//     strokeWidth='2'
//     {...props}
//   >
//     <path d='M15 18l-6-6 6-6' strokeLinecap='round' strokeLinejoin='round' />
//   </svg>
// );
// const ChevronRight = (props: React.SVGProps<SVGSVGElement>) => (
//   <svg
//     viewBox='0 0 24 24'
//     width='16'
//     height='16'
//     fill='none'
//     stroke='currentColor'
//     strokeWidth='2'
//     {...props}
//   >
//     <path d='M9 6l6 6-6 6' strokeLinecap='round' strokeLinejoin='round' />
//   </svg>
// );

// /* helper: country code (ISO alpha-2) -> emoji flag */
// function countryCodeToEmoji(code?: string) {
//   if (!code) return '';
//   const cc = code.trim().toUpperCase();
//   if (cc.length !== 2) return code;
//   const offset = 0x1f1e6 - 65;
//   return String.fromCodePoint(
//     cc.charCodeAt(0) + offset,
//     cc.charCodeAt(1) + offset
//   );
// }

// type Installation = {
//   id?: string | number;
//   name: string;
//   location?: string;
//   from?: string;
//   to?: string;
// };

// type Promotion = {
//   id?: string | number;
//   rank: string;
//   date?: string;
//   countryCode?: string;
//   note?: string;
// };
// const PersonDetails = ({ person }: { person: PersonDetailDTO }) => {
//   const images: string[] = toStringArray(person?.personImagePaths);
//   const [index, setIndex] = useState(0);

//   const installations: Installation[] = (person as any)?.installations ?? [];
//   const promotions: Promotion[] = (person as any)?.promotions ?? [];

//   const fullName =
//     `${person?.firstName ?? ''} ${person?.lastName ?? ''}`.trim() || '—';

//   const imageSrc = images[index] ?? null;

//   const goPrev = () =>
//     setIndex((i) =>
//       images.length ? (i - 1 + images.length) % images.length : 0
//     );
//   const goNext = () =>
//     setIndex((i) => (images.length ? (i + 1) % images.length : 0));

//   const formattedPromotions = useMemo(
//     () =>
//       promotions.map((p) => ({
//         ...p,
//         niceDate: p.date ? new Date(p.date).toLocaleDateString() : undefined,
//       })),
//     [promotions]
//   );
//   return (
//     <Card>
//       <CardHeader className='flex items-center gap-4'>
//         <Avatar className='h-12 w-12'>
//           {/* Avatar fallback: first letters */}
//           <div className='flex items-center justify-center h-full w-full bg-muted text-xs font-medium'>
//             {(person?.firstName?.[0] ?? '') + (person?.lastName?.[0] ?? '')}
//           </div>
//         </Avatar>
//         <div className='flex-1'>
//           <CardTitle className='text-lg'>{fullName}</CardTitle>
//           <div className='text-sm text-muted-foreground'>
//             {person?.rank ? (
//               <span className='font-medium'>{person?.rank?.name}</span>
//             ) : null}
//             {person?.country?.iso2 ? (
//               <span className='ml-2'>
//                 {countryCodeToEmoji(person?.country?.iso2)}{' '}
//                 {person?.country?.name ?? person?.country?.iso2}
//               </span>
//             ) : null}
//           </div>
//         </div>
//         <div className='flex items-center gap-2'>
//           {person?.status ? (
//             <Badge variant='secondary'>#{person?.status}</Badge>
//           ) : null}
//         </div>
//       </CardHeader>

//       <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-6'>
//         {/* LEFT: Carousel / image */}
//         <div className='col-span-1 md:col-span-1'>
//           <div className='relative bg-muted rounded-md overflow-hidden'>
//             {imageSrc ? (
//               <img
//                 src={imageSrc}
//                 alt={`${fullName} ${index + 1}`}
//                 className='w-full h-64 object-contain bg-black/5'
//               />
//             ) : (
//               <div className='w-full h-64 flex items-center justify-center text-muted-foreground'>
//                 Δεν υπάρχουν εικόνες
//               </div>
//             )}

//             {/* controls */}
//             {images.length > 1 && (
//               <>
//                 <button
//                   aria-label='previous'
//                   onClick={goPrev}
//                   className='absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-1 shadow'
//                 >
//                   <ChevronLeft />
//                 </button>
//                 <button
//                   aria-label='next'
//                   onClick={goNext}
//                   className='absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-1 shadow'
//                 >
//                   <ChevronRight />
//                 </button>

//                 {/* thumbnails */}
//                 <div className='flex gap-2 p-2 overflow-x-auto'>
//                   {images.map((src, i) => (
//                     <button
//                       key={i}
//                       onClick={() => setIndex(i)}
//                       className={`w-16 h-12 rounded overflow-hidden border ${
//                         i === index
//                           ? 'ring-2 ring-primary'
//                           : 'border-transparent'
//                       }`}
//                     >
//                       <img
//                         src={src}
//                         alt={`thumb-${i}`}
//                         className='w-full h-full object-cover'
//                       />
//                     </button>
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>
//         </div>

//         {/* RIGHT: details */}
//         <div className='col-span-1 md:col-span-2 space-y-4'>
//           {/* basic info */}
//           <div className='grid grid-cols-2 gap-4'>
//             <div>
//               <div className='text-xs text-muted-foreground'>Όνομα</div>
//               <div className='font-medium'>{fullName}</div>
//             </div>
//             <div>
//               <div className='text-xs text-muted-foreground'>
//                 Ημερομηνία γέννησης
//               </div>
//               <div className='font-medium'>{person?.retiredYear ?? '—'}</div>
//             </div>
//           </div>

//           <Separator />

//           {/* installations */}
//           <div>
//             <div className='flex items-center justify-between'>
//               <div className='text-sm font-medium'>Installations</div>
//               <div className='text-sm text-muted-foreground'>
//                 {installations?.length ?? 0}
//               </div>
//             </div>
//             <div className='mt-2 space-y-2'>
//               {installations.length ? (
//                 installations.map((it, idx) => (
//                   <div
//                     key={it.id ?? idx}
//                     className='flex items-start justify-between gap-4'
//                   >
//                     <div>
//                       <div className='font-medium'>{it.name}</div>
//                       <div className='text-sm text-muted-foreground'>
//                         {it.location ?? '—'}
//                         {it.from || it.to
//                           ? ` • ${it.from ?? '…'} - ${it.to ?? '…'}`
//                           : ''}
//                       </div>
//                     </div>
//                     <div>
//                       <Badge variant='outline'>
//                         {it.location
//                           ? it.location.split(',').slice(-1)[0]
//                           : '—'}
//                       </Badge>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className='text-sm text-muted-foreground'>
//                   Χωρίς εγκαταστάσεις
//                 </div>
//               )}
//             </div>
//           </div>

//           <Separator />

//           {/* promotions */}
//           <div>
//             <div className='text-sm font-medium'>Promotions</div>
//             <div className='mt-2 space-y-2'>
//               {formattedPromotions.length ? (
//                 formattedPromotions.map((p, idx) => (
//                   <div
//                     key={(p as any).id ?? idx}
//                     className='flex items-center justify-between gap-4'
//                   >
//                     <div>
//                       <div className='font-medium flex items-center gap-2'>
//                         {p.rank}
//                         {p.countryCode ? (
//                           <span className='text-sm ml-1'>
//                             {countryCodeToEmoji(p.countryCode)}
//                           </span>
//                         ) : null}
//                       </div>
//                       <div className='text-sm text-muted-foreground'>
//                         {p.niceDate ?? p.note ?? '—'}
//                       </div>
//                     </div>
//                     <div>
//                       <Badge variant='secondary'>{p.countryCode ?? '—'}</Badge>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className='text-sm text-muted-foreground'>
//                   Χωρίς προαγωγές
//                 </div>
//               )}
//             </div>
//           </div>

//           <Separator />

//           {/* optional description */}
//           {person?.description ? (
//             <div>
//               <div className='text-sm text-muted-foreground'>Σημειώσεις</div>
//               <div className='prose mt-2 max-w-none'>{person.description}</div>
//             </div>
//           ) : null}
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// export default PersonDetails;

'use client';

import * as React from 'react';
import type { Prisma, PersonType, ServiceStatus } from '@prisma/client';
import { PersonDetailDTO } from '@/actions/person.actions';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Flag } from '../common';

/* ------------------------------ Mini icons ------------------------------ */
const ChevronLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox='0 0 24 24'
    width='16'
    height='16'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    {...props}
  >
    <path d='M15 18l-6-6 6-6' strokeLinecap='round' strokeLinejoin='round' />
  </svg>
);
const ChevronRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox='0 0 24 24'
    width='16'
    height='16'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    {...props}
  >
    <path d='M9 6l6 6-6 6' strokeLinecap='round' strokeLinejoin='round' />
  </svg>
);

/* ------------------------------ Helpers ------------------------------ */
function toStringArrayFromJson(
  v: Prisma.JsonValue | null | undefined
): string[] {
  if (!v) return [];
  try {
    if (Array.isArray(v)) {
      return v.map((x) => (typeof x === 'string' ? x : '')).filter(Boolean);
    }
    // αν έρχεται stringified json
    if (typeof v === 'string') {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) {
        return parsed
          .map((x) => (typeof x === 'string' ? x : ''))
          .filter(Boolean);
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function fmtDate(d?: string | number | Date | null): string {
  if (!d) return '—';
  const dd = new Date(d);
  return isNaN(dd.getTime()) ? '—' : dd.toLocaleDateString();
}

/* ------------------------------ Component ------------------------------ */
type Props = { person: PersonDetailDTO };

const PersonDetails: React.FC<Props> = ({ person }) => {
  const images = React.useMemo(
    () => toStringArrayFromJson(person?.personImagePaths),
    [person?.personImagePaths]
  );
  const [idx, setIdx] = React.useState(0);
  const imageSrc = images[idx] ?? null;

  const fullName = React.useMemo(() => {
    const s = `${person?.firstName ?? ''} ${person?.lastName ?? ''}`.trim();
    return s || '—';
  }, [person?.firstName, person?.lastName]);

  const goPrev = () =>
    setIdx((i) =>
      images.length ? (i - 1 + images.length) % images.length : 0
    );
  const goNext = () =>
    setIdx((i) => (images.length ? (i + 1) % images.length : 0));

  const countryName = person?.country?.name ?? person?.country?.iso2 ?? '';
  const flagSrc = person?.country?.flag ?? null; // file/URL/path που δίνεις από DB (με το electron handler σου)

  return (
    <Card>
      <CardHeader className='flex items-start gap-4'>
        <div className='flex-1 min-w-0 w-full'>
          <div className='flex  justify-between items-center gap-2'>
            <div className=''>
              <CardTitle className='truncate text-xl'>{fullName}</CardTitle>
              {/* Status */}
              {person?.status ? (
                <Badge variant='secondary'>{person.status}</Badge>
              ) : null}
            </div>
            <span className='inline-flex items-center gap-2'>
              <Flag
                flag={flagSrc}
                alt={countryName}
                size={50}
                className='rounded-md overflow-hidden'
              />
              <span>{countryName}</span>
            </span>
          </div>

          <div className='mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
            {/* Rank */}
            {person?.rank?.name ? (
              <span>
                <span className='font-medium'>{person.rank.name}</span>
                {person?.branch?.name ? (
                  <span className='ml-1'>• {person.branch.name}</span>
                ) : null}
              </span>
            ) : person?.branch?.name ? (
              <span className='font-medium'>{person.branch.name}</span>
            ) : null}
          </div>

          {/* Meta row */}
          <div className='mt-2 grid grid-cols-2 md:grid-cols-6 gap-2 text-xs text-muted-foreground'>
            <div>
              <span className='uppercase tracking-wide'>Τύπος</span>
              <div className='text-foreground'>{person.type}</div>
            </div>
            <div>
              <span className='uppercase tracking-wide'>Κατάσταση</span>
              <div className='text-foreground'>
                {person.status}
                {person.retiredYear ? ` (${person.retiredYear})` : ''}
              </div>
            </div>
            <div>
              <span className='uppercase tracking-wide'>Ειδικότητα</span>
              <div className='text-foreground'>
                {person?.specialty?.name ?? '—'}
              </div>
            </div>
            <div>
              <span className='uppercase tracking-wide'>Βαθμός</span>
              <div className='text-foreground'>{person?.rank?.name ?? '—'}</div>
            </div>
            <div>
              <span className='uppercase tracking-wide'>Κλάση</span>
              <div className='text-foreground'>{person?.classYear ?? '—'}</div>
            </div>
            <div>
              <span className='uppercase tracking-wide'>
                Οργανισμός/Εταιρεία
              </span>
              <div className='text-foreground'>
                {person?.organization?.name ?? person?.company?.name ?? '—'}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* LEFT: Carousel */}
        <div className='lg:col-span-1'>
          <div className='relative rounded-md border bg-muted/30 overflow-hidden'>
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={`${fullName} photo ${idx + 1}`}
                className='w-full h-64 object-contain bg-black/5'
              />
            ) : (
              <div className='w-full h-64 flex items-center justify-center text-muted-foreground'>
                Δεν υπάρχουν εικόνες
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  aria-label='previous'
                  onClick={goPrev}
                  className='absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background p-1 shadow'
                >
                  <ChevronLeft />
                </button>
                <button
                  aria-label='next'
                  onClick={goNext}
                  className='absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background p-1 shadow'
                >
                  <ChevronRight />
                </button>

                <div className='flex gap-2 p-2 overflow-x-auto bg-background/60'>
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setIdx(i)}
                      className={cn(
                        'w-16 h-12 rounded overflow-hidden border',
                        i === idx ? 'ring-2 ring-primary' : 'border-transparent'
                      )}
                    >
                      <img
                        src={src}
                        alt={`thumb-${i}`}
                        className='w-full h-full object-cover'
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Contact / Notes */}
          <div className='mt-4 space-y-2 text-sm'>
            <div className='flex items-center justify-between'>
              <div className='text-muted-foreground'>Email</div>
              <div className='text-right'>{person.email ?? '—'}</div>
            </div>
            <div className='flex items-center justify-between'>
              <div className='text-muted-foreground'>Τηλέφωνο</div>
              <div className='text-right'>{person.phone ?? '—'}</div>
            </div>
            {/* <div className='flex items-center justify-between'>
              <div className='text-muted-foreground'>Class Year</div>
              <div className='text-right'>{person.classYear ?? '—'}</div>
            </div> */}
          </div>
        </div>

        {/* RIGHT: Details / Tables */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Installations */}
          <section>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold'>Τοποθετήσεις</h3>
              <span className='text-sm text-muted-foreground'>
                {(person.installations?.length ?? 0).toString()}
              </span>
            </div>
            <div className='mt-2 border rounded-md overflow-hidden'>
              {person.installations?.length ? (
                <table className='w-full text-sm'>
                  <thead className='bg-muted/50'>
                    <tr className='text-left'>
                      <th className='p-2'>Θέση / Μονάδα / Οργανισμός</th>
                      <th className='p-2'>Ρόλος</th>
                      <th className='p-2'>Από</th>
                      <th className='p-2'>Έως</th>
                    </tr>
                  </thead>
                  <tbody>
                    {person.installations.map((ins, i) => (
                      <tr key={i} className='border-t'>
                        <td className='p-2'>
                          {ins.unit?.name ?? ins.organization?.name ?? '—'}
                        </td>
                        <td className='p-2'>{ins.role ?? '—'}</td>
                        <td className='p-2'>{fmtDate(ins.startDate as any)}</td>
                        <td className='p-2'>{fmtDate(ins.endDate as any)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className='p-3 text-sm text-muted-foreground'>
                  Χωρίς τοποθετήσεις
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Promotions */}
          <section>
            <h3 className='font-semibold'>Προαγωγές</h3>
            <div className='mt-2 border rounded-md overflow-hidden'>
              {person.promotions?.length ? (
                <table className='w-full text-sm'>
                  <thead className='bg-muted/50'>
                    <tr className='text-left'>
                      <th className='p-2'>Έτος</th>
                      <th className='p-2'>Βαθμός</th>
                      <th className='p-2'>Σημειώσεις</th>
                    </tr>
                  </thead>
                  <tbody>
                    {person.promotions.map((p, i) => (
                      <tr key={i} className='border-t'>
                        <td className='p-2'>{p.promotionYear ?? '—'}</td>
                        <td className='p-2'>{p.rank?.name ?? '—'}</td>
                        <td className='p-2'>{p.description ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className='p-3 text-sm text-muted-foreground'>
                  Χωρίς προαγωγές
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Meetings (summary) */}
          <section>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold'>Συναντήσεις</h3>
              <Badge variant='outline'>
                {person.meetingsCount ?? 0}{' '}
                {person.meetingsCount === 1 ? 'συνάντηση' : 'συναντήσεις'}
              </Badge>
            </div>
            {!person.hasMeetings ? (
              <div className='mt-2 text-sm text-muted-foreground'>
                Δεν υπάρχουν καταγεγραμμένες συναντήσεις
              </div>
            ) : (
              <div className='mt-2 text-sm text-muted-foreground'>
                Υπάρχουν καταγεγραμμένες συναντήσεις για αυτό το πρόσωπο.
              </div>
            )}
          </section>

          {/* Notes */}
          {person.description ? (
            <>
              <Separator />
              <section>
                <h3 className='font-semibold'>Σημειώσεις</h3>
                <div className='prose mt-2 max-w-none text-sm'>
                  {person.description}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonDetails;
