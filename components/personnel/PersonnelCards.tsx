import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import type { PersonDTO } from '@/actions/person.actions';
import {
  countEntityImages,
  getAvatarFromImages,
  yearFromISO,
} from '@/lib/utils';

const PersonnelCards = ({ rows }: { rows: PersonDTO[] }) => {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'>
      {rows.map((p) => (
        <PersonCard key={p.id} p={p} />
      ))}
    </div>
  );
};

export const PersonCard = ({ p }: { p: PersonDTO }) => {
  const fullName = `${p.lastName} ${p.firstName}`.trim();
  const imagesCount = countEntityImages(p.personImagePaths);
  const avatar = getAvatarFromImages(p.personImagePaths);

  const installations = [...(p.installations || [])]
    .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
    .slice(0, 3);

  const promotions = [...(p.promotions || [])]
    .sort((a, b) => b.year - a.year)
    .slice(0, 3);

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base font-semibold flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='relative inline-block'>
              <div className='h-10 w-10 rounded-full bg-muted overflow-hidden ring-1 ring-border flex items-center justify-center'>
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt={fullName}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <span className='text-xs font-medium text-muted-foreground'>
                    {p.firstName?.[0]}
                    {p.lastName?.[0]}
                  </span>
                )}
              </div>
              {imagesCount > 0 && (
                <span className='absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground'>
                  {imagesCount}
                </span>
              )}
            </div>
            <span>{fullName}</span>
          </div>
          <span className='text-xs text-muted-foreground'>{p.type}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className='text-sm text-muted-foreground space-y-2'>
        <div className='grid grid-cols-2 gap-2'>
          <div>
            <div>
              <span className='font-medium text-foreground'>Βαθμός:</span>{' '}
              {p.rank?.name ?? '—'}
            </div>
            <div>
              <span className='font-medium text-foreground'>Κλάδος:</span>{' '}
              {p.branch?.name ?? '—'}
            </div>
            <div>
              <span className='font-medium text-foreground'>Χώρα:</span>{' '}
              {p.country?.name ?? '—'}
            </div>
            <div>
              <span className='font-medium text-foreground'>Συναντήσεις:</span>{' '}
              {p.meetingsCount}
            </div>
          </div>

          <div className='text-xs'>
            <div className='mb-1 font-medium text-foreground'>Τοποθετήσεις</div>
            <div className='flex flex-col gap-1'>
              {installations.length ? (
                installations.map((it) => {
                  const startY = yearFromISO(it.startDate);
                  const endY = yearFromISO(it.endDate);
                  const place =
                    it.unit?.name ||
                    it.organization?.name ||
                    it.country?.name ||
                    '—';
                  const role = it.position?.name || it.type;
                  return (
                    <div key={it.id} className='flex items-center gap-2'>
                      <span className='text-foreground font-medium'>
                        {startY}
                        {endY !== '—' ? `–${endY}` : ''}
                      </span>
                      <span className='truncate'>{place}</span>
                      <span className='text-[11px] italic'>{role}</span>
                    </div>
                  );
                })
              ) : (
                <span>—</span>
              )}
            </div>

            <div className='mt-2 mb-1 font-medium text-foreground'>
              Προαγωγές
            </div>
            <div className='flex flex-col gap-1'>
              {promotions.length ? (
                promotions.map((pr, idx) => (
                  <div
                    key={`${p.id}-pr-${idx}`}
                    className='flex items-center gap-2'
                  >
                    <span className='text-foreground font-medium'>
                      {pr.year}
                    </span>
                    <span className='truncate'>{pr.rank?.name}</span>
                    {pr.rank?.code && (
                      <span className='text-[11px]'>({pr.rank.code})</span>
                    )}
                  </div>
                ))
              ) : (
                <span>—</span>
              )}
            </div>
          </div>
        </div>

        <div className='pt-2 flex justify-end gap-1'>
          <Button variant='outline' size='icon' title='Προβολή'>
            <AppIcon icon={appIcons.view} size={16} />
          </Button>
          <Button variant='outline' size='icon' title='Επεξεργασία'>
            <AppIcon icon={appIcons.edit} size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonnelCards;
