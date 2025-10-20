// actions/tools/organization.actions.ts
'use server';

import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/db';
import {
  revalidateLookups,
  revalidateSidebarCounts,
} from '@/actions/common.actions';
import {
  OrganizationInput,
  organizationSchema,
} from '@/validations/tools/organization.validation';
import type { OrganizationDTO } from '@/types/tools/organization';

// ----------------------------- Types / helpers -----------------------------

/** normalize: αφαιρεί duplicates / κενά */
const uniqNonEmpty = (arr: string[] | undefined) =>
  Array.from(new Set((arr ?? []).filter(Boolean)));

/**
 * Replace all country links for an organization with the provided list.
 * Runs in a single interactive transaction.
 */
export async function syncCountriesForOrgTx(
  tx: Prisma.TransactionClient,
  orgId: string,
  countryIds: string[]
) {
  const ids = Array.from(new Set(countryIds.filter(Boolean)));

  await tx.countryOrganization.deleteMany({
    where: { organizationId: orgId },
  });

  if (ids.length > 0) {
    await tx.countryOrganization.createMany({
      data: ids.map((countryId) => ({ countryId, organizationId: orgId })),
      // skipDuplicates: true, // Αν το θες και το υποστηρίζει ο στόχος σου, ξεκλείδωσέ το.
    });
  }
}

// ------------------------------- READ --------------------------------------
export async function getOrganizations(): Promise<OrganizationDTO[]> {
  const rows = await prisma.organization.findMany({
    orderBy: [{ name: 'asc' }],
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      description: true,
      organizationImage: true,

      // single FK (αν το κρατάς ακόμη)
      countryId: true,
      country: { select: { id: true, name: true, iso2: true, flag: true } },

      // hierarchy
      parentId: true,
      parent: { select: { id: true, name: true, code: true } },

      // M2M countries μέσω join table
      countryLinks: {
        select: {
          country: { select: { id: true, name: true, iso2: true, flag: true } },
        },
      },
    },
  });

  // Αν στο DTO σου θέλεις flat `countries: CountryDTO[]`
  const data = rows.map((r) => ({
    ...r,
    countries: r.countryLinks?.map((cl) => cl.country) ?? [],
  })) as unknown as OrganizationDTO[];

  return data;
}

// ------------------------------ CREATE -------------------------------------
type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string };

// actions/tools/organization.actions.ts
type CreateOrgOpts = { revalidate?: boolean };

export async function createOrganization(
  input: OrganizationInput,
  opts?: CreateOrgOpts
): Promise<Ok<{ id: string; name: string }> | Err> {
  try {
    const data = organizationSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.organization.create({
        data: {
          name: data.name.trim(),
          code: data.code ?? null,
          type: data.type,
          description: data.description ?? null,
          organizationImage: data.organizationImage ?? null,
        },
        select: { id: true, name: true },
      });

      if (data.parentId) {
        const parent = await tx.organization.findUnique({
          where: { id: data.parentId },
          select: { id: true },
        });
        if (!parent || parent.id === created.id) {
          throw new Error('Μη έγκυρος parent οργανισμός.');
        }
        await tx.organization.update({
          where: { id: created.id },
          data: { parentId: data.parentId },
        });
      }

      if (data.countriesIds?.length) {
        await syncCountriesForOrgTx(tx, created.id, data.countriesIds);
      }

      return created;
    });

    // ⬇️ Κάνε revalidate μόνο αν ΔΕΝ είμαστε σε quick flow
    if (opts?.revalidate !== false) {
      await revalidateLookups('organizations');
      await revalidateSidebarCounts().catch(() => {});
    }

    return { ok: true, data: result };
  } catch (err: any) {
    if (err?.code === 'P2002') {
      const target = String(err?.meta?.target ?? '');
      const msg = target.includes('name')
        ? 'Υπάρχει ήδη οργανισμός με αυτό το όνομα.'
        : target.includes('code')
        ? 'Υπάρχει ήδη οργανισμός με αυτό το code.'
        : 'Διπλότυπο πεδίο.';
      return { ok: false, error: msg };
    }
    return { ok: false, error: err?.message ?? 'Σφάλμα δημιουργίας' };
  }
}

// ------------------------------ UPDATE -------------------------------------
export async function updateOrganization(
  id: string,
  input: OrganizationInput,
  path?: string
) {
  const parsed = organizationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues?.[0]?.message ?? 'Μη έγκυρα δεδομένα',
    };
  }
  const data = parsed.data;
  const countriesIds = uniqNonEmpty(data.countriesIds);

  try {
    await prisma.$transaction(async (tx) => {
      // 1) Πρώτα ενημέρωσε τα βασικά πεδία ΧΩΡΙΣ parentId (ώστε να αποφύγεις FK issues)
      await tx.organization.update({
        where: { id },
        data: {
          name: data.name.trim(),
          code: data.code ?? null,
          type: data.type,
          description: data.description ?? null,
          organizationImage: data.organizationImage ?? null,
          // countryId: data.countryId ?? null, // αν διατηρείς single country
          // parentId: θα το ορίσουμε παρακάτω αφού γίνει validation
        },
      });

      // 2) Έλεγχος & ενημέρωση parent (προαιρετικό)
      if (data.parentId && data.parentId.trim().length > 0) {
        if (data.parentId === id) {
          throw new Error(
            'Ένας οργανισμός δεν μπορεί να είναι parent του εαυτού του.'
          );
        }
        const parent = await tx.organization.findUnique({
          where: { id: data.parentId },
          select: { id: true },
        });
        if (!parent) {
          throw new Error('Ο επιλεγμένος parent οργανισμός δεν υπάρχει.');
        }
        await tx.organization.update({
          where: { id },
          data: { parentId: data.parentId },
        });
      } else {
        // clear parent
        await tx.organization.update({
          where: { id },
          data: { parentId: null },
        });
      }

      // 3) Συγχρονισμός M2M χωρών
      await syncCountriesForOrgTx(tx, id, countriesIds);
    });

    if (path) revalidatePath(path, 'page');
    await revalidateSidebarCounts().catch(() => {});
    return { ok: true as const };
  } catch (err: any) {
    if (err?.code === 'P2002') {
      const target = String(err?.meta?.target ?? '');
      const msg = target.includes('name')
        ? 'Υπάρχει ήδη οργανισμός με αυτό το όνομα.'
        : target.includes('code')
        ? 'Υπάρχει ήδη οργανισμός με αυτό το code.'
        : 'Διπλότυπο πεδίο.';
      return { ok: false as const, error: msg };
    }
    return { ok: false as const, error: err?.message ?? 'Σφάλμα ενημέρωσης' };
  }
}

// ------------------------------ DELETE -------------------------------------
export async function deleteOrganization(id: string, path?: string) {
  try {
    // αν δεν έχεις ON DELETE CASCADE, καθάρισε join-links για σιγουριά
    await prisma.$transaction([
      prisma.countryOrganization.deleteMany({ where: { organizationId: id } }),
      prisma.companyOrganization.deleteMany({ where: { organizationId: id } }),
      prisma.meetingOrganization.deleteMany({ where: { organizationId: id } }),
      prisma.personOrganization.deleteMany({ where: { organizationId: id } }),
      prisma.organization.updateMany({
        where: { parentId: id },
        data: { parentId: null },
      }),
      prisma.organization.delete({ where: { id } }),
    ]);

    if (path) revalidatePath(path, 'page');
    await revalidateSidebarCounts().catch(() => {});
    return { ok: true as const };
  } catch (err: any) {
    const message =
      err?.code === 'P2003'
        ? 'Δεν μπορεί να διαγραφεί: υπάρχουν συνδεδεμένες εγγραφές.'
        : err?.message ?? 'Σφάλμα διαγραφής';
    return { ok: false as const, error: message };
  }
}
