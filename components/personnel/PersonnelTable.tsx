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
