// 'use server';

// import 'server-only';
// import * as XLSX from 'xlsx';
// import { prisma } from '@/lib/db';
// import { revalidateLookups } from '@/actions/common.actions';
// import { Prisma, OrganizationType, RankTier, UnitType } from '@prisma/client';

// /* ----------------------------- Helper types ----------------------------- */
// type ImportResult = {
//   created: Record<string, number>;
//   updated: Record<string, number>;
//   errors: string[];
//   dryRun: boolean;
// };

// /* ------------------------------- Utilities ------------------------------ */
// const SHEETS = {
//   Regions: 'Regions',
//   Countries: 'Countries',
//   Branches: 'Branches',
//   Ranks: 'Ranks',
//   Organizations: 'Organizations',
//   Units: 'Units',
// } as const;

// const norm = (v?: any) => String(v ?? '').trim();
// const toUpper = (v?: any) => {
//   const s = norm(v);
//   return s ? s.toUpperCase() : '';
// };
// const asFloat = (v?: any) => {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : undefined;
// };
// const enumFrom = <T extends object>(E: T, v?: any) =>
//   ((v = toUpper(v)) && (E as any)[v]) || undefined;

// function readBool(fd: FormData, key: string, fallback = false) {
//   const v = fd.get(key);
//   if (typeof v !== 'string') return fallback;
//   const s = v.trim().toLowerCase();
//   return s === 'true' || s === '1' || s === 'on' || s === 'yes';

// }

// /* ---- XLSX helpers: case-insensitive sheet names & lowercase headers ---- */
// function getSheet(wb: XLSX.WorkBook, wanted: string) {
//   const lower = wanted.toLowerCase();
//   const name = wb.SheetNames.find((n) => n.toLowerCase() === lower);
//   return name ? wb.Sheets[name] : undefined;
// }
// function readRows(wb: XLSX.WorkBook, sheetName: string): any[] {
//   const ws = getSheet(wb, sheetName);
//   if (!ws) return [];
//   const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];
//   // Κατεβάζουμε τα headers σε lower για σταθερότητα
//   return rows.map((r) => {
//     const out: Record<string, any> = {};
//     for (const k of Object.keys(r)) out[k.toLowerCase()] = r[k];
//     return out;
//   });
// }

// /* --------------------------- Prisma helpers ---------------------------- */
// // "Region" -> "region"
// const toClientKey = (m: Prisma.ModelName) =>
//   (m.charAt(0).toLowerCase() + m.slice(1)) as keyof typeof prisma;

// async function upsertByUnique({
//   db,
//   model,
//   where,
//   create,
//   update,
//   dryRun,
// }: {
//   db: typeof prisma;
//   model: Prisma.ModelName;
//   where: any;
//   create: any;
//   update: any;
//   dryRun: boolean;
// }) {
//   const key = toClientKey(model);
//   const m = (db as any)[key] as {
//     findUnique: (args: any) => Promise<any>;
//     findFirst?: (args: any) => Promise<any>;
//     update: (args: any) => Promise<any>;
//     create: (args: any) => Promise<any>;
//   };

//   const found = await m.findUnique({ where });
//   if (found) {
//     if (dryRun) return { action: 'updated' as const, row: found };
//     const row = await m.update({ where, data: update });
//     return { action: 'updated' as const, row };
//   } else {
//     if (dryRun) return { action: 'created' as const, row: create };
//     const row = await m.create({ data: create });
//     return { action: 'created' as const, row };
//   }
// }

// /* --------------------------- Lookup helpers ---------------------------- */
// async function getRegionIdByName(db: typeof prisma, name?: string) {
//   const v = norm(name);
//   if (!v) return undefined;
//   const r = await db.region.findUnique({ where: { name: v } });
//   return r?.id;
// }

// async function getCountryIdByRef(db: typeof prisma, ref?: string) {
//   const raw = norm(ref);
//   if (!raw) return undefined;
//   // Προσπάθησε ISO2 uppercase πρώτα
//   const iso2 = toUpper(raw);
//   let c = await db.country.findUnique({ where: { iso2 } });
//   if (!c) c = await db.country.findUnique({ where: { name: raw } });
//   return c?.id;
// }

// async function getBranchIdByRef(
//   db: typeof prisma,
//   ref?: string,
//   countryId?: string
// ) {
//   const raw = (ref ?? '').trim();
//   if (!raw) return undefined;

//   // Προτίμηση σε code (uppercase)
//   const code = raw.toUpperCase();
//   const byCode = await db.serviceBranch.findUnique({
//     where: { code },
//     select: { id: true },
//   });
//   if (byCode?.id) return byCode.id;

//   // Fallback σε name (+ optionally χώρα)
//   const byName = await db.serviceBranch.findFirst({
//     where: { name: raw, ...(countryId ? { countryId } : {}) },
//     select: { id: true },
//   });
//   return byName?.id;
// }

// /* -------------------- Main Server Action (no big tx) -------------------- */
// export async function importLookupsFromXlsx(
//   formData: FormData
// ): Promise<ImportResult> {
//   const file = formData.get('file') as File | null;
//   const dryRun = readBool(formData, 'dryRun', false);
//   console.log('[import] dryRun =', dryRun);

//   const result: ImportResult = {
//     created: {
//       Regions: 0,
//       Countries: 0,
//       Branches: 0,
//       Ranks: 0,
//       Organizations: 0,
//       Units: 0,
//     },
//     updated: {
//       Regions: 0,
//       Countries: 0,
//       Branches: 0,
//       Ranks: 0,
//       Organizations: 0,
//       Units: 0,
//     },
//     errors: [],
//     dryRun,
//   };

//   if (!file) {
//     result.errors.push('No file uploaded');
//     return result;
//   }

//   const ab = await file.arrayBuffer();
//   const wb = XLSX.read(ab, { type: 'array' });

//   const regionsRows = readRows(wb, SHEETS.Regions);
//   const countriesRows = readRows(wb, SHEETS.Countries);
//   const branchesRows = readRows(wb, SHEETS.Branches);
//   const ranksRows = readRows(wb, SHEETS.Ranks);
//   const orgRows = readRows(wb, SHEETS.Organizations);
//   const unitRows = readRows(wb, SHEETS.Units);

//   const db = prisma;

//   /* -------------------------------- Regions ------------------------------- */
//   for (let i = 0; i < regionsRows.length; i++) {
//     const r = regionsRows[i];
//     const name = norm(r['name']);
//     if (!name) {
//       result.errors.push(`[Regions row ${i + 2}] missing name`);
//       continue;
//     }
//     const code = norm(r['code']) || null;
//     const description = norm(r['description']) || null;

//     const out = await upsertByUnique({
//       db,
//       dryRun,
//       model: 'Region',
//       where: { name },
//       create: { name, code, description },
//       update: { code, description },
//     });
//     result[out.action].Regions++;
//   }

//   /* ------------------------------- Countries ------------------------------ */
//   for (let i = 0; i < countriesRows.length; i++) {
//     const r = countriesRows[i];
//     const name = norm(r['name']);
//     if (!name) {
//       result.errors.push(`[Countries row ${i + 2}] missing name`);
//       continue;
//     }
//     const iso2 = toUpper(r['iso2']) || null;

//     const regionName = norm(r['region']);
//     const regionId = await getRegionIdByName(db, regionName);
//     if (regionName && !regionId) {
//       result.errors.push(
//         `[Countries row ${i + 2}] region not found (${regionName})`
//       );
//     }

//     const out = await upsertByUnique({
//       db,
//       dryRun,
//       model: 'Country',
//       where: { name },
//       create: { name, iso2, regionId: regionId ?? null },
//       update: { iso2, regionId: regionId ?? null },
//     });
//     result[out.action].Countries++;
//   }

//   /* -------------------------------- Branches ------------------------------ */
//   for (let i = 0; i < branchesRows.length; i++) {
//     const r = branchesRows[i];
//     const name = norm(r['name']);
//     if (!name) {
//       result.errors.push(`[Branches row ${i + 2}] missing name`);
//       continue;
//     }
//     const code = toUpper(r['code']) || null;

//     const countryRef = norm(r['country']);
//     const countryId = await getCountryIdByRef(db, countryRef);
//     if (!countryId) {
//       result.errors.push(
//         `[Branches row ${i + 2}] country not found (${countryRef})`
//       );
//       continue;
//     }

//     const where = code ? { code } : { name };
//     const out = await upsertByUnique({
//       db,
//       dryRun,
//       model: 'ServiceBranch',
//       where,
//       create: { name, code, countryId },
//       update: { name, code, countryId },
//     });
//     result[out.action].Branches++;
//   }

//   /* ---------------------------------- Ranks ------------------------------- */
//   for (let i = 0; i < ranksRows.length; i++) {
//     const r = ranksRows[i];
//     const name = norm(r['name']);
//     if (!name) {
//       result.errors.push(`[Ranks row ${i + 2}] missing name`);
//       continue;
//     }
//     const code = norm(r['code']) || null;
//     const tier = enumFrom(RankTier, r['tier']);
//     if (!tier) {
//       result.errors.push(`[Ranks row ${i + 2}] invalid tier (${r['tier']})`);
//       continue;
//     }
//     const level =
//       r['level'] !== undefined && r['level'] !== '' ? Number(r['level']) : null;

//     const branchRef = norm(r['branch']);
//     const branchId = await getBranchIdByRef(db, branchRef);
//     if (branchRef && !branchId) {
//       result.errors.push(
//         `[Ranks row ${i + 2}] branch not found (${branchRef})`
//       );
//     }

//     const where = code ? { code } : { name };
//     const out = await upsertByUnique({
//       db,
//       dryRun,
//       model: 'Rank',
//       where,
//       create: { name, code, tier, level, branchId: branchId ?? null },
//       update: { name, code, tier, level, branchId: branchId ?? null },
//     });
//     result[out.action].Ranks++;
//   }

//   /* ----------------------------- Organizations ---------------------------- */
//   for (let i = 0; i < orgRows.length; i++) {
//     const r = orgRows[i];
//     const name = norm(r['name']);
//     if (!name) {
//       result.errors.push(`[Organizations row ${i + 2}] missing name`);
//       continue;
//     }
//     const code = norm(r['code']) || null;
//     const type = enumFrom(OrganizationType, r['type']);
//     if (!type) {
//       result.errors.push(
//         `[Organizations row ${i + 2}] invalid type (${r['type']})`
//       );
//       continue;
//     }

//     const countryRef = norm(r['country']);
//     const countryId = await getCountryIdByRef(db, countryRef);
//     if (countryRef && !countryId) {
//       result.errors.push(
//         `[Organizations row ${i + 2}] country not found (${countryRef})`
//       );
//     }

//     const where = code ? { code } : { name };
//     const out = await upsertByUnique({
//       db,
//       dryRun,
//       model: 'Organization',
//       where,
//       create: { name, code, type, countryId: countryId ?? null },
//       update: { name, code, type, countryId: countryId ?? null },
//     });
//     result[out.action].Organizations++;
//   }

//   /* ----------------------------------- Units ------------------------------ */
//   type UnitBufferRow = {
//     id: string;
//     code: string | null;
//     name: string;
//     parentCode: string;
//     countryId?: string;
//   };

//   const unitBuffer: UnitBufferRow[] = [];

//   // 1ο pass (χωρίς parent)
//   for (let i = 0; i < unitRows.length; i++) {
//     const r = unitRows[i];
//     const name = norm(r['name']);
//     if (!name) {
//       result.errors.push(`[Units row ${i + 2}] missing name`);
//       continue;
//     }

//     const code = norm(r['code']) || null;
//     const type = enumFrom(UnitType, r['type']);
//     if (!type) {
//       result.errors.push(`[Units row ${i + 2}] invalid type (${r['type']})`);
//       continue;
//     }

//     const countryId = await getCountryIdByRef(db, r['country']);
//     if (!countryId) {
//       result.errors.push(
//         `[Units row ${i + 2}] country not found (${r['country']})`
//       );
//       continue;
//     }

//     const branchId = await getBranchIdByRef(db, r['branch'], countryId);
//     if (r['branch'] && !branchId) {
//       result.errors.push(
//         `[Units row ${i + 2}] branch not found (${r['branch']})`
//       );
//     }

//     const latitude = asFloat(r['latitude']) ?? null;
//     const longitude = asFloat(r['longitude']) ?? null;

//     const where = code ? { code } : { name };
//     const out = await upsertByUnique({
//       db,
//       dryRun,
//       model: 'Unit',
//       where,
//       create: {
//         name,
//         code,
//         type,
//         countryId,
//         branchId: branchId ?? null,
//         latitude,
//         longitude,
//       },
//       update: {
//         name,
//         code,
//         type,
//         countryId,
//         branchId: branchId ?? null,
//         latitude,
//         longitude,
//       },
//     });

//     const rowId = dryRun ? `DRY-${name}-${code ?? ''}` : out.row.id;
//     unitBuffer.push({
//       id: rowId,
//       code,
//       name,
//       parentCode: norm(r['parentcode']) || '',
//       countryId,
//     });
//     result[out.action].Units++;
//   }

//   // 2ο pass: parent linking
//   if (dryRun) {
//     // Έλεγχος μόνο αν υπάρχει parent ΣΤΟ ΙΔΙΟ ΑΡΧΕΙΟ (όχι DB)
//     const byCode = new Set(
//       unitBuffer.filter((u) => u.code).map((u) => u.code as string)
//     );
//     const byName = new Set(unitBuffer.map((u) => u.name));
//     for (const u of unitBuffer) {
//       if (!u.parentCode) continue;
//       const has = byCode.has(u.parentCode) || byName.has(u.parentCode);
//       if (!has) {
//         result.errors.push(
//           `Units: parent not found (${u.parentCode}) for unit ${
//             u.code || u.name
//           }`
//         );
//       }
//     }
//   } else {
//     // 2ο pass: parent linking (non-dryRun)
//     for (const u of unitBuffer) {
//       if (!u.parentCode) continue;

//       // Δούλεψε αποκλειστικά με ids για να είναι ίδιο το shape παντού
//       let parentId: string | undefined;

//       // 1) code (unique)
//       const pByCode = await db.unit.findUnique({
//         where: { code: u.parentCode },
//         select: { id: true },
//       });
//       if (pByCode?.id) parentId = pByCode.id;

//       // 2) fallback: name (+ optional χώρα για σταθερότητα)
//       if (!parentId) {
//         const pByName = await db.unit.findFirst({
//           where: {
//             name: u.parentCode,
//             ...(u.countryId ? { countryId: u.countryId } : {}),
//           },
//           select: { id: true },
//         });
//         if (pByName?.id) parentId = pByName.id;
//       }

//       if (!parentId) {
//         result.errors.push(
//           `Units: parent not found (${u.parentCode}) for unit ${
//             u.code || u.name
//           }`
//         );
//         continue;
//       }

//       await db.unit.update({
//         where: { id: u.id },
//         data: { parentId },
//       });
//     }
//   }

//   // Revalidate μόνο αν γράψαμε
//   if (!dryRun) {
//     await revalidateLookups(
//       'regions',
//       'countries',
//       'branches',
//       'ranks',
//       'organizations',
//       'units'
//     );
//   }

//   return result;
// }

// actions/import.actions.ts
'use server';

import 'server-only';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/db';
import { revalidateLookups } from '@/actions/common.actions';
import { Prisma, OrganizationType, RankTier, UnitType } from '@prisma/client';

/* ----------------------------- Types & constants ----------------------------- */
type ImportResult = {
  created: Record<string, number>;
  updated: Record<string, number>;
  errors: string[];
  dryRun: boolean;
  afterCounts?: { countries: number; branches: number; units: number };
};

const SHEETS = {
  Regions: 'Regions',
  Countries: 'Countries',
  Branches: 'Branches',
  Ranks: 'Ranks',
  Organizations: 'Organizations',
  Units: 'Units',
} as const;

/* --------------------------------- Utils ---------------------------------- */
const norm = (v?: any) => String(v ?? '').trim();
const toUpper = (v?: any) => {
  const s = norm(v);
  return s ? s.toUpperCase() : '';
};
const asFloat = (v?: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const enumFrom = <T extends object>(E: T, v?: any) =>
  ((v = toUpper(v)) && (E as any)[v]) || undefined;

function readBool(fd: FormData, key: string, fallback = false) {
  const v = fd.get(key);
  if (typeof v !== 'string') return fallback;
  const s = v.trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'on' || s === 'yes';
}

/* ------------- XLSX helpers: case-insensitive sheets, lower headers -------- */
function getSheet(wb: XLSX.WorkBook, wanted: string) {
  const lower = wanted.toLowerCase();
  const name = wb.SheetNames.find((n) => n.toLowerCase() === lower);
  return name ? wb.Sheets[name] : undefined;
}
function readRows(wb: XLSX.WorkBook, sheetName: string): any[] {
  const ws = getSheet(wb, sheetName);
  if (!ws) return [];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];
  // Κατεβάζουμε τα headers σε lower για σταθερότητα
  return rows.map((r) => {
    const out: Record<string, any> = {};
    for (const k of Object.keys(r)) out[k.toLowerCase()] = r[k];
    return out;
  });
}

/* ------------------------------ Lookups (db) ------------------------------ */
async function getRegionIdByName(name?: string) {
  const v = norm(name);
  if (!v) return undefined;
  const r = await prisma.region.findUnique({ where: { name: v } });
  return r?.id;
}
async function getCountryIdByRef(ref?: string) {
  const raw = norm(ref);
  if (!raw) return undefined;
  const iso2 = toUpper(raw);
  let c = await prisma.country.findUnique({ where: { iso2 } });
  if (!c) c = await prisma.country.findUnique({ where: { name: raw } });
  return c?.id;
}
async function getBranchIdByRef(ref?: string, countryId?: string) {
  const raw = norm(ref);
  if (!raw) return undefined;
  const code = toUpper(raw);
  const byCode = await prisma.serviceBranch.findUnique({
    where: { code },
    select: { id: true },
  });
  if (byCode?.id) return byCode.id;

  const byName = await prisma.serviceBranch.findFirst({
    where: { name: raw, ...(countryId ? { countryId } : {}) },
    select: { id: true },
  });
  return byName?.id;
}

/* --------------------------- Main Server Action --------------------------- */
export async function importLookupsFromXlsx(
  formData: FormData
): Promise<ImportResult> {
  const file = formData.get('file') as File | null;
  const dryRun = readBool(formData, 'dryRun', false);

  const result: ImportResult = {
    created: {
      Regions: 0,
      Countries: 0,
      Branches: 0,
      Ranks: 0,
      Organizations: 0,
      Units: 0,
    },
    updated: {
      Regions: 0,
      Countries: 0,
      Branches: 0,
      Ranks: 0,
      Organizations: 0,
      Units: 0,
    },
    errors: [],
    dryRun,
  };

  console.log('[import] dryRun =', dryRun);
  console.log('[import] DB URL =', process.env.DATABASE_URL);

  if (!file) {
    result.errors.push('No file uploaded');
    return result;
  }

  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: 'array' });

  const regionsRows = readRows(wb, SHEETS.Regions);
  const countriesRows = readRows(wb, SHEETS.Countries);
  const branchesRows = readRows(wb, SHEETS.Branches);
  const ranksRows = readRows(wb, SHEETS.Ranks);
  const orgRows = readRows(wb, SHEETS.Organizations);
  const unitRows = readRows(wb, SHEETS.Units);

  /* -------------------------------- Regions ------------------------------- */
  for (let i = 0; i < regionsRows.length; i++) {
    const r = regionsRows[i];
    const name = norm(r['name']);
    if (!name) {
      result.errors.push(`[Regions row ${i + 2}] missing name`);
      continue;
    }
    const code = norm(r['code']) || null;
    const description = norm(r['description']) || null;

    const existing = await prisma.region.findUnique({ where: { name } });
    if (existing) {
      if (!dryRun) {
        await prisma.region.update({
          where: { id: existing.id },
          data: { code, description },
        });
      }
      result.updated.Regions++;
    } else {
      if (!dryRun) {
        await prisma.region.create({ data: { name, code, description } });
      }
      result.created.Regions++;
    }
  }

  /* ------------------------------- Countries ------------------------------ */
  for (let i = 0; i < countriesRows.length; i++) {
    const r = countriesRows[i];
    const name = norm(r['name']);
    if (!name) {
      result.errors.push(`[Countries row ${i + 2}] missing name`);
      continue;
    }
    const iso2 = toUpper(r['iso2']) || null;

    const regionName = norm(r['region']);
    const regionId = await getRegionIdByName(regionName);
    if (regionName && !regionId) {
      result.errors.push(
        `[Countries row ${i + 2}] region not found (${regionName})`
      );
    }

    const existing = await prisma.country.findUnique({ where: { name } });
    if (existing) {
      if (!dryRun) {
        await prisma.country.update({
          where: { id: existing.id },
          data: { iso2, regionId: regionId ?? null },
        });
      }
      result.updated.Countries++;
    } else {
      if (!dryRun) {
        await prisma.country.create({
          data: { name, iso2, regionId: regionId ?? null },
        });
      }
      result.created.Countries++;
    }
  }

  /* -------------------------------- Branches ------------------------------ */
  for (let i = 0; i < branchesRows.length; i++) {
    const r = branchesRows[i];
    const name = norm(r['name']);
    if (!name) {
      result.errors.push(`[Branches row ${i + 2}] missing name`);
      continue;
    }
    const code = toUpper(r['code']) || null;

    const countryRef = norm(r['country']);
    const countryId = await getCountryIdByRef(countryRef);
    if (!countryId) {
      result.errors.push(
        `[Branches row ${i + 2}] country not found (${countryRef})`
      );
      continue;
    }

    let existingId: string | undefined;

    if (code) {
      const byCode = await prisma.serviceBranch.findUnique({
        where: { code },
        select: { id: true },
      });
      existingId = byCode?.id;
    } else {
      const byNameCountry = await prisma.serviceBranch.findFirst({
        where: { name, countryId },
        select: { id: true },
      });
      existingId = byNameCountry?.id;
    }

    if (existingId) {
      if (!dryRun) {
        await prisma.serviceBranch.update({
          where: { id: existingId },
          data: { name, code, countryId },
        });
      }
      result.updated.Branches++;
    } else {
      if (!dryRun) {
        await prisma.serviceBranch.create({
          data: { name, code, countryId },
        });
      }
      result.created.Branches++;
    }
  }

  /* ---------------------------------- Ranks ------------------------------- */
  for (let i = 0; i < ranksRows.length; i++) {
    const r = ranksRows[i];
    const name = norm(r['name']);
    if (!name) {
      result.errors.push(`[Ranks row ${i + 2}] missing name`);
      continue;
    }
    const code = norm(r['code']) || null;
    const tier = enumFrom(RankTier, r['tier']);
    if (!tier) {
      result.errors.push(`[Ranks row ${i + 2}] invalid tier (${r['tier']})`);
      continue;
    }
    const level =
      r['level'] !== undefined && r['level'] !== '' ? Number(r['level']) : null;

    const branchRef = norm(r['branch']);
    const branchId = await getBranchIdByRef(branchRef);
    if (branchRef && !branchId) {
      result.errors.push(
        `[Ranks row ${i + 2}] branch not found (${branchRef})`
      );
    }

    let existingId: string | undefined;

    if (code) {
      const byCode = await prisma.rank.findUnique({
        where: { code },
        select: { id: true },
      });
      existingId = byCode?.id;
    } else {
      // fallback με όνομα + branch (αν υπάρχει)
      const byName = await prisma.rank.findFirst({
        where: { name, ...(branchId ? { branchId } : {}) },
        select: { id: true },
      });
      existingId = byName?.id;
    }

    if (existingId) {
      if (!dryRun) {
        await prisma.rank.update({
          where: { id: existingId },
          data: { name, code, tier, level, branchId: branchId ?? null },
        });
      }
      result.updated.Ranks++;
    } else {
      if (!dryRun) {
        await prisma.rank.create({
          data: { name, code, tier, level, branchId: branchId ?? null },
        });
      }
      result.created.Ranks++;
    }
  }

  /* ----------------------------- Organizations ---------------------------- */
  for (let i = 0; i < orgRows.length; i++) {
    const r = orgRows[i];
    const name = norm(r['name']);
    if (!name) {
      result.errors.push(`[Organizations row ${i + 2}] missing name`);
      continue;
    }
    const code = norm(r['code']) || null;
    const type = enumFrom(OrganizationType, r['type']);
    if (!type) {
      result.errors.push(
        `[Organizations row ${i + 2}] invalid type (${r['type']})`
      );
      continue;
    }

    const countryRef = norm(r['country']);
    const countryId = await getCountryIdByRef(countryRef);
    if (countryRef && !countryId) {
      result.errors.push(
        `[Organizations row ${i + 2}] country not found (${countryRef})`
      );
    }

    let existingId: string | undefined;

    if (code) {
      const byCode = await prisma.organization.findUnique({
        where: { code },
        select: { id: true },
      });
      existingId = byCode?.id;
    } else {
      const byName = await prisma.organization.findFirst({
        where: { name },
        select: { id: true },
      });
      existingId = byName?.id;
    }

    if (existingId) {
      if (!dryRun) {
        await prisma.organization.update({
          where: { id: existingId },
          data: { name, code, type, countryId: countryId ?? null },
        });
      }
      result.updated.Organizations++;
    } else {
      if (!dryRun) {
        await prisma.organization.create({
          data: { name, code, type, countryId: countryId ?? null },
        });
      }
      result.created.Organizations++;
    }
  }

  /* ----------------------------------- Units ------------------------------ */
  type UnitBufferRow = {
    id: string; // actual id or synthetic in dryRun
    code: string | null;
    name: string;
    parentCode: string; // from Excel
    countryId?: string;
  };

  const unitBuffer: UnitBufferRow[] = [];

  // 1ο pass (χωρίς parent)
  for (let i = 0; i < unitRows.length; i++) {
    const r = unitRows[i];
    const name = norm(r['name']);
    if (!name) {
      result.errors.push(`[Units row ${i + 2}] missing name`);
      continue;
    }

    const code = norm(r['code']) || null;
    const type = enumFrom(UnitType, r['type']);
    if (!type) {
      result.errors.push(`[Units row ${i + 2}] invalid type (${r['type']})`);
      continue;
    }

    const countryId = await getCountryIdByRef(r['country']);
    if (!countryId) {
      result.errors.push(
        `[Units row ${i + 2}] country not found (${r['country']})`
      );
      continue;
    }

    const branchId = await getBranchIdByRef(r['branch'], countryId);
    if (r['branch'] && !branchId) {
      result.errors.push(
        `[Units row ${i + 2}] branch not found (${r['branch']})`
      );
    }

    const latitude = asFloat(r['latitude']) ?? null;
    const longitude = asFloat(r['longitude']) ?? null;

    // Εύρεση/Upsert όταν έχεις code, αλλιώς με name+countryId
    let existingId: string | undefined;
    if (code) {
      const byCode = await prisma.unit.findUnique({
        where: { code },
        select: { id: true },
      });
      existingId = byCode?.id;
    } else {
      const byNameCountry = await prisma.unit.findFirst({
        where: { name, countryId },
        select: { id: true },
      });
      existingId = byNameCountry?.id;
    }

    if (existingId) {
      if (!dryRun) {
        await prisma.unit.update({
          where: { id: existingId },
          data: {
            name,
            code,
            type,
            countryId,
            branchId: branchId ?? null,
            latitude,
            longitude,
          },
        });
      }
      unitBuffer.push({
        id: dryRun ? `DRY-${name}-${code ?? ''}` : (existingId as string),
        code,
        name,
        parentCode: norm(r['parentcode']) || '',
        countryId,
      });
      result.updated.Units++;
    } else {
      if (!dryRun) {
        const created = await prisma.unit.create({
          data: {
            name,
            code,
            type,
            countryId,
            branchId: branchId ?? null,
            latitude,
            longitude,
          },
          select: { id: true },
        });
        unitBuffer.push({
          id: created.id,
          code,
          name,
          parentCode: norm(r['parentcode']) || '',
          countryId,
        });
      } else {
        unitBuffer.push({
          id: `DRY-${name}-${code ?? ''}`,
          code,
          name,
          parentCode: norm(r['parentcode']) || '',
          countryId,
        });
      }
      result.created.Units++;
    }
  }

  // 2ο pass: parent linking
  if (dryRun) {
    // In-memory έλεγχος: parent πρέπει να υπάρχει στο ίδιο αρχείο (code ή name)
    const byCode = new Set(
      unitBuffer.filter((u) => u.code).map((u) => u.code as string)
    );
    const byName = new Set(unitBuffer.map((u) => u.name));
    for (const u of unitBuffer) {
      if (!u.parentCode) continue;
      const has = byCode.has(u.parentCode) || byName.has(u.parentCode);
      if (!has) {
        result.errors.push(
          `Units: parent not found (${u.parentCode}) for unit ${
            u.code || u.name
          }`
        );
      }
    }
  } else {
    for (const u of unitBuffer) {
      if (!u.parentCode) continue;

      // Προτίμησε code → fallback name (+ χώρα για σταθερότητα)
      let parentId: string | undefined;
      const pByCode = await prisma.unit.findUnique({
        where: { code: u.parentCode },
        select: { id: true },
      });
      if (pByCode?.id) parentId = pByCode.id;

      if (!parentId) {
        const pByName = await prisma.unit.findFirst({
          where: {
            name: u.parentCode,
            ...(u.countryId ? { countryId: u.countryId } : {}),
          },
          select: { id: true },
        });
        if (pByName?.id) parentId = pByName.id;
      }

      if (!parentId) {
        result.errors.push(
          `Units: parent not found (${u.parentCode}) for unit ${
            u.code || u.name
          }`
        );
        continue;
      }

      await prisma.unit.update({
        where: { id: u.id },
        data: { parentId },
      });
    }
  }

  // Μετά την επιτυχή εισαγωγή (όχι dryRun) κάνε revalidate & γύρνα counts για debug
  if (!dryRun) {
    const [countriesCount, branchesCount, unitsCount] = await Promise.all([
      prisma.country.count(),
      prisma.serviceBranch.count(),
      prisma.unit.count(),
    ]);
    result.afterCounts = {
      countries: countriesCount,
      branches: branchesCount,
      units: unitsCount,
    };

    await revalidateLookups(
      'regions',
      'countries',
      'branches',
      'ranks',
      'organizations',
      'units'
    );
  }

  return result;
}
