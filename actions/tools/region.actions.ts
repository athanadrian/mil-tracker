// actions/region.actions.ts
'use server';

import 'server-only';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { RegionDTO, RegionInput } from '@/types/tools/region';
import { regionSchema } from '@/validations/tools/region.validation';

const PAGE_TO_REVALIDATE = '/tools/regions';

export async function getRegions(): Promise<RegionDTO[]> {
  const rows = await prisma.region.findMany({
    orderBy: [{ name: 'asc' }],
    select: { id: true, name: true, code: true, description: true },
  });
  return rows;
}

export async function createRegion(input: RegionInput) {
  const data = regionSchema.parse(input);
  try {
    await prisma.region.create({
      data: {
        name: data.name.trim(),
        code: data.code?.trim() || null,
        description: data.description?.trim() || null,
      },
    });
    revalidatePath(PAGE_TO_REVALIDATE);
    return { ok: true as const };
  } catch (err: any) {
    // Prisma unique (P2002)
    if (err?.code === 'P2002') {
      const target = String(err?.meta?.target ?? '');
      const msg = target.includes('name')
        ? 'Υπάρχει ήδη περιοχή με αυτό το όνομα.'
        : target.includes('code')
        ? 'Υπάρχει ήδη περιοχή με αυτό το code.'
        : 'Διπλότυπο πεδίο.';
      return { ok: false as const, error: msg };
    }
    return { ok: false as const, error: err?.message ?? 'Σφάλμα δημιουργίας' };
  }
}

export async function updateRegion(id: string, input: RegionInput) {
  const data = regionSchema.parse(input);
  try {
    await prisma.region.update({
      where: { id },
      data: {
        name: data.name.trim(),
        code: data.code?.trim() || null,
        description: data.description?.trim() || null,
      },
    });
    revalidatePath(PAGE_TO_REVALIDATE);
    return { ok: true as const };
  } catch (err: any) {
    if (err?.code === 'P2002') {
      const target = String(err?.meta?.target ?? '');
      const msg = target.includes('name')
        ? 'Υπάρχει ήδη περιοχή με αυτό το όνομα.'
        : target.includes('code')
        ? 'Υπάρχει ήδη περιοχή με αυτό το code.'
        : 'Διπλότυπο πεδίο.';
      return { ok: false as const, error: msg };
    }
    return { ok: false as const, error: err?.message ?? 'Σφάλμα ενημέρωσης' };
  }
}

export async function deleteRegion(id: string) {
  try {
    await prisma.region.delete({ where: { id } });
    revalidatePath(PAGE_TO_REVALIDATE);
    return { ok: true as const };
  } catch (err: any) {
    // Αν έχει foreign key (χώρες), θα σκάσει εδώ
    return {
      ok: false as const,
      error:
        err?.code === 'P2003'
          ? 'Δεν είναι δυνατή η διαγραφή: υπάρχουν συνδεδεμένες χώρες.'
          : err?.message ?? 'Σφάλμα διαγραφής',
    };
  }
}
