'use client';

import * as React from 'react';
import { PersonDetailDTO } from '@/actions/person.actions';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  cn,
  formatDateISOToDDMMYYYY,
  toStringArrayFromJson,
} from '@/lib/utils';
import { Flag } from '@/components/common';
import { AppCrudMenu, AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';

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
  const flagSrc = person?.country?.flag ?? null;

  // helpers
  const orgBadges =
    person?.organizations && person.organizations.length > 0
      ? person.organizations.map((o) => (
          <Badge key={o.id} variant='outline' className='mr-1 mb-1'>
            {o.name}
          </Badge>
        ))
      : '—';

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
            {/* Rank / Branch */}
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
          <div className='mt-2 grid grid-cols-3 md:grid-cols-6 gap-2 text-xs text-muted-foreground'>
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
            <div className='col-span-3 md:col-span-2'>
              <span className='uppercase tracking-wide'>Οργανισμοί</span>
              <div className='mt-1 text-foreground flex flex-wrap'>
                {orgBadges}
              </div>
            </div>
            <div className='col-span-3 md:col-span-2'>
              <span className='uppercase tracking-wide'>Εταιρεία</span>
              <div className='text-foreground'>
                {person?.company?.name ?? '—'}
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
                  <AppIcon icon={appIcons.chevronLeft} size={16} />
                </button>
                <button
                  aria-label='next'
                  onClick={goNext}
                  className='absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background p-1 shadow'
                >
                  <AppIcon icon={appIcons.chevronRight} size={16} />
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
          </div>
        </div>

        {/* RIGHT: Details / Tables */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Installations */}
          <section>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold'>Τοποθετήσεις</h3>
              <Badge variant='outline'>
                {person.installations?.length ?? 0}{' '}
                {person.installations?.length === 1
                  ? 'Τοποθέτηση'
                  : 'Τοποθετήσεις'}
              </Badge>
            </div>
            <div className='mt-2 border rounded-md overflow-hidden'>
              <table className='w-full text-sm'>
                <thead className='bg-muted/50'>
                  <tr className='text-left'>
                    <th className='p-2'>Θέση / Μονάδα / Οργανισμός</th>
                    <th className='p-2'>Ρόλος</th>
                    <th className='p-2'>Από</th>
                    <th className='p-2'>Έως</th>
                    <th className='p-2 text-right'>
                      <AppCrudMenu
                        items={[
                          {
                            key: 'add-installation',
                            label: 'Προσθήκη Τοποθέτησης',
                            icon: <AppIcon icon={appIcons.add} />,
                            onAction: () => {},
                          },
                        ]}
                      />
                    </th>
                  </tr>
                </thead>
                {person.installations?.length ? (
                  <tbody>
                    {person.installations.map((ins, i) => (
                      <tr key={i} className='border-t'>
                        <td className='p-2'>
                          {ins.unit?.name ?? ins.organization?.name ?? '—'}
                        </td>
                        <td className='p-2'>{ins.role ?? '—'}</td>
                        <td className='p-2'>
                          {formatDateISOToDDMMYYYY(ins.startDate as any)}
                        </td>
                        <td className='p-2'>
                          {formatDateISOToDDMMYYYY(ins.endDate as any)}
                        </td>
                        <td className='p-2 text-right'>
                          <AppCrudMenu
                            menuIcon={appIcons.menu}
                            showEdit
                            showDelete
                            onEdit={() => {}}
                            onDelete={() => {
                              /* dialog διαγραφής */
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ) : (
                  <tr className='p-3 text-sm text-muted-foreground'>
                    <td className='p-2 text-center' colSpan={8}>
                      Δεν υπάρχουν καταγεγραμμένες τοποθετήσεις
                    </td>
                  </tr>
                )}
              </table>
            </div>
          </section>

          <Separator />

          {/* Promotions */}
          <section>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold'>Προαγωγές</h3>
              <Badge variant='outline'>
                {person.promotions?.length ?? 0}{' '}
                {person.promotions?.length === 1 ? 'Προαγωγή' : 'Προαγωγές'}
              </Badge>
            </div>
            <div className='mt-2 border rounded-md overflow-hidden'>
              <table className='w-full text-sm'>
                <thead className='bg-muted/50'>
                  <tr className='text-left'>
                    <th className='p-2'>Έτος</th>
                    <th className='p-2'>Βαθμός</th>
                    <th className='p-2'>Σημειώσεις</th>
                    <th className='p-2 text-right'>
                      <AppCrudMenu
                        items={[
                          {
                            key: 'add-promotion',
                            label: 'Προσθήκη Προαγωγής',
                            icon: <AppIcon icon={appIcons.add} />,
                            onAction: () => {},
                          },
                        ]}
                      />
                    </th>
                  </tr>
                </thead>
                {person.promotions?.length ? (
                  <tbody>
                    {person.promotions.map((p, i) => (
                      <tr key={i} className='border-t'>
                        <td className='p-2'>{p.promotionYear ?? '—'}</td>
                        <td className='p-2'>{p.rank?.name ?? '—'}</td>
                        <td className='p-2'>{p.description ?? '—'}</td>
                        <td className='p-2 text-right'>
                          <AppCrudMenu
                            menuIcon={appIcons.menu}
                            showEdit
                            showDelete
                            onEdit={() => {}}
                            onDelete={() => {
                              /* dialog διαγραφής */
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ) : (
                  <tr className='p-3 text-sm text-muted-foreground'>
                    <td className='p-2 text-center' colSpan={8}>
                      Δεν υπάρχουν καταγεγραμμένες προαγωγές
                    </td>
                  </tr>
                )}
              </table>
            </div>
          </section>

          <Separator />

          {/* Meetings */}
          <section>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold'>Συναντήσεις</h3>
              <Badge variant='outline'>
                {person.meetingsCount ?? 0}{' '}
                {person.meetingsCount === 1 ? 'Συνάντηση' : 'Συναντήσεις'}
              </Badge>
            </div>

            <div className='mt-2 border rounded-md overflow-hidden'>
              <table className='w-full text-sm'>
                <thead className='bg-muted/50'>
                  <tr className='text-left'>
                    <th className='p-2 w-0'></th>
                    <th className='p-2'>Κωδικός</th>
                    <th className='p-2'>Ημερομηνία</th>
                    <th className='p-2'>Περίληψη</th>
                    <th className='p-2'>Τοποθεσία</th>
                    <th className='p-2'>Χώρα</th>
                    <th className='p-2'>Οργανισμοί</th>
                    <th className='p-2'>Ρόλος (ως participant)</th>
                    <th className='p-2'>
                      <AppCrudMenu
                        items={[
                          {
                            key: 'add-meeting',
                            label: 'Προσθήκη Συνάντησης',
                            icon: <AppIcon icon={appIcons.add} />,
                            onAction: () => {},
                          },
                        ]}
                      />
                    </th>
                  </tr>
                </thead>
                {person.meetings?.length ? (
                  <tbody>
                    {person.meetings.map((m, i) => (
                      <MeetingRow key={m.id} idx={i} meeting={m} />
                    ))}
                  </tbody>
                ) : (
                  <tr className='p-3 text-sm text-muted-foreground'>
                    <td className='p-2 text-center' colSpan={8}>
                      Δεν υπάρχουν καταγεγραμμένες συναντήσεις
                    </td>
                  </tr>
                )}
              </table>
            </div>
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

const MeetingRow: React.FC<{
  idx: number;
  meeting: PersonDetailDTO['meetings'][number];
}> = ({ idx, meeting }) => {
  const [open, setOpen] = React.useState(false);
  const hasTopics = (meeting.topics?.length ?? 0) > 0;

  const orgNames =
    meeting.organizations && meeting.organizations.length > 0
      ? meeting.organizations.map((o) => o.name).join(', ')
      : '—';

  return (
    <>
      <tr className='border-t'>
        <td className='p-2 w-0'>
          {hasTopics ? (
            <button
              aria-label='expand'
              onClick={() => setOpen((v) => !v)}
              className='inline-flex items-center justify-center rounded border px-1.5 py-0.5 hover:bg-muted'
              title={open ? 'Απόκρυψη θεμάτων' : 'Εμφάνιση θεμάτων'}
            >
              <AppIcon
                icon={appIcons.chevronDown}
                className={
                  open
                    ? 'rotate-180 transition-transform'
                    : 'transition-transform'
                }
                size={14}
              />
            </button>
          ) : (
            <span className='opacity-30'>—</span>
          )}
        </td>
        <td className='p-2'>{meeting.code ?? '—'}</td>
        <td className='p-2'>{formatDateISOToDDMMYYYY(meeting.date as any)}</td>
        <td className='p-2'>{meeting.summary ?? '—'}</td>
        <td className='p-2'>{meeting.location ?? '—'}</td>
        <td className='p-2'>{meeting.country?.name ?? '—'}</td>
        <td className='p-2'>{orgNames}</td>
        <td className='p-2'>{meeting.participantRole ?? '—'}</td>
        <td className='p-2'>
          <AppCrudMenu
            menuIcon={appIcons.menu}
            showEdit
            showDelete
            onEdit={() => {}}
            onDelete={() => {
              /* dialog διαγραφής */
            }}
          />
        </td>
      </tr>

      {hasTopics && open && (
        <tr className='bg-muted/30'>
          <td className='p-2' />
          <td className='p-2' colSpan={8}>
            <div className='text-xs'>
              <div className='font-medium mb-1'>Θέματα:</div>
              <ul className='list-disc pl-5 space-y-0.5'>
                {meeting.topics.map((t) => (
                  <li key={t.id}>
                    <span className='font-medium'>{t.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
