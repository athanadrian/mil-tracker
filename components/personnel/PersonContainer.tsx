'use client';
import React, { useMemo, useState } from 'react';
import { PersonDetailDTO } from '@/actions/person.actions';

/* shadcn UI imports (adjust paths if your project differs) */
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toStringArray } from '@/lib/utils';

/* small inline icons to avoid extra deps */
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

/* helper: country code (ISO alpha-2) -> emoji flag */
function countryCodeToEmoji(code?: string) {
  if (!code) return '';
  const cc = code.trim().toUpperCase();
  if (cc.length !== 2) return code;
  const offset = 0x1f1e6 - 65;
  return String.fromCodePoint(
    cc.charCodeAt(0) + offset,
    cc.charCodeAt(1) + offset
  );
}

type Installation = {
  id?: string | number;
  name: string;
  location?: string;
  from?: string;
  to?: string;
};

type Promotion = {
  id?: string | number;
  rank: string;
  date?: string;
  countryCode?: string;
  note?: string;
};

const PersonContainer = ({ person }: { person: PersonDetailDTO }) => {
  const images: string[] = toStringArray(person?.personImagePaths);
  const [index, setIndex] = useState(0);

  const installations: Installation[] = (person as any)?.installations ?? [];
  const promotions: Promotion[] = (person as any)?.promotions ?? [];

  const fullName =
    `${person?.firstName ?? ''} ${person?.lastName ?? ''}`.trim() || '—';

  const imageSrc = images[index] ?? null;

  const goPrev = () =>
    setIndex((i) =>
      images.length ? (i - 1 + images.length) % images.length : 0
    );
  const goNext = () =>
    setIndex((i) => (images.length ? (i + 1) % images.length : 0));

  const formattedPromotions = useMemo(
    () =>
      promotions.map((p) => ({
        ...p,
        niceDate: p.date ? new Date(p.date).toLocaleDateString() : undefined,
      })),
    [promotions]
  );

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader className='flex items-center gap-4'>
          <Avatar className='h-12 w-12'>
            {/* Avatar fallback: first letters */}
            <div className='flex items-center justify-center h-full w-full bg-muted text-xs font-medium'>
              {(person?.firstName?.[0] ?? '') + (person?.lastName?.[0] ?? '')}
            </div>
          </Avatar>
          <div className='flex-1'>
            <CardTitle className='text-lg'>{fullName}</CardTitle>
            <div className='text-sm text-muted-foreground'>
              {person?.rank ? (
                <span className='font-medium'>{person.rank.name}</span>
              ) : null}
              {person?.country?.iso2 ? (
                <span className='ml-2'>
                  {countryCodeToEmoji(person.country.iso2)}{' '}
                  {person?.country.name ?? person.country.iso2}
                </span>
              ) : null}
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {person?.status ? (
              <Badge variant='secondary'>#{person.status}</Badge>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* LEFT: Carousel / image */}
          <div className='col-span-1 md:col-span-1'>
            <div className='relative bg-muted rounded-md overflow-hidden'>
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={`${fullName} ${index + 1}`}
                  className='w-full h-64 object-contain bg-black/5'
                />
              ) : (
                <div className='w-full h-64 flex items-center justify-center text-muted-foreground'>
                  Δεν υπάρχουν εικόνες
                </div>
              )}

              {/* controls */}
              {images.length > 1 && (
                <>
                  <button
                    aria-label='previous'
                    onClick={goPrev}
                    className='absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-1 shadow'
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    aria-label='next'
                    onClick={goNext}
                    className='absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-1 shadow'
                  >
                    <ChevronRight />
                  </button>

                  {/* thumbnails */}
                  <div className='flex gap-2 p-2 overflow-x-auto'>
                    {images.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`w-16 h-12 rounded overflow-hidden border ${
                          i === index
                            ? 'ring-2 ring-primary'
                            : 'border-transparent'
                        }`}
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
          </div>

          {/* RIGHT: details */}
          <div className='col-span-1 md:col-span-2 space-y-4'>
            {/* basic info */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <div className='text-xs text-muted-foreground'>Όνομα</div>
                <div className='font-medium'>{fullName}</div>
              </div>
              <div>
                <div className='text-xs text-muted-foreground'>
                  Ημερομηνία γέννησης
                </div>
                <div className='font-medium'>{person?.retiredYear ?? '—'}</div>
              </div>
            </div>

            <Separator />

            {/* installations */}
            <div>
              <div className='flex items-center justify-between'>
                <div className='text-sm font-medium'>Installations</div>
                <div className='text-sm text-muted-foreground'>
                  {installations?.length ?? 0}
                </div>
              </div>
              <div className='mt-2 space-y-2'>
                {installations.length ? (
                  installations.map((it, idx) => (
                    <div
                      key={it.id ?? idx}
                      className='flex items-start justify-between gap-4'
                    >
                      <div>
                        <div className='font-medium'>{it.name}</div>
                        <div className='text-sm text-muted-foreground'>
                          {it.location ?? '—'}
                          {it.from || it.to
                            ? ` • ${it.from ?? '…'} - ${it.to ?? '…'}`
                            : ''}
                        </div>
                      </div>
                      <div>
                        <Badge variant='outline'>
                          {it.location
                            ? it.location.split(',').slice(-1)[0]
                            : '—'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='text-sm text-muted-foreground'>
                    Χωρίς εγκαταστάσεις
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* promotions */}
            <div>
              <div className='text-sm font-medium'>Promotions</div>
              <div className='mt-2 space-y-2'>
                {formattedPromotions.length ? (
                  formattedPromotions.map((p, idx) => (
                    <div
                      key={(p as any).id ?? idx}
                      className='flex items-center justify-between gap-4'
                    >
                      <div>
                        <div className='font-medium flex items-center gap-2'>
                          {p.rank}
                          {p.countryCode ? (
                            <span className='text-sm ml-1'>
                              {countryCodeToEmoji(p.countryCode)}
                            </span>
                          ) : null}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {p.niceDate ?? p.note ?? '—'}
                        </div>
                      </div>
                      <div>
                        <Badge variant='secondary'>
                          {p.countryCode ?? '—'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='text-sm text-muted-foreground'>
                    Χωρίς προαγωγές
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* optional description */}
            {person?.description ? (
              <div>
                <div className='text-sm text-muted-foreground'>Σημειώσεις</div>
                <div className='prose mt-2 max-w-none'>
                  {person.description}
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonContainer;
