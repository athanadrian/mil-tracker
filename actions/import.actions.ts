// 'use server';

// import 'server-only';
// import * as XLSX from 'xlsx';
// import { prisma } from '@/lib/db';
// import { revalidateLookups } from '@/actions/common.actions';
// import { Prisma, OrganizationType, RankTier, UnitType } from '@prisma/client';

// /* ----------------------------- Types & constants ----------------------------- */
// type ImportResult = {
//   created: Record<string, number>;
//   updated: Record<string, number>;
//   errors: string[];
//   dryRun: boolean;
//   afterCounts?: { countries: number; branches: number; units: number };
// };

// const SHEETS = {
//   Regions: 'Regions',
//   Countries: 'Countries',
//   Branches: 'Branches',
//   Ranks: 'Ranks',
//   Organizations: 'Organizations',
//   Units: 'Units',
// } as const;

// /* --------------------------------- Utils ---------------------------------- */
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

// /* ------------- XLSX helpers: case-insensitive sheets, lower headers -------- */
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

// /* ------------------------------ Lookups (db) ------------------------------ */
// async function getRegionIdByName(name?: string) {
//   const v = norm(name);
//   if (!v) return undefined;
//   const r = await prisma.region.findUnique({ where: { name: v } });
//   return r?.id;
// }
// async function getCountryIdByRef(ref?: string) {
//   const raw = norm(ref);
//   if (!raw) return undefined;
//   const iso2 = toUpper(raw);
//   let c = await prisma.country.findUnique({ where: { iso2 } });
//   if (!c) c = await prisma.country.findUnique({ where: { name: raw } });
//   return c?.id;
// }
// async function getBranchIdByRef(ref?: string, countryId?: string) {
//   const raw = norm(ref);
//   if (!raw) return undefined;
//   const code = toUpper(raw);
//   const byCode = await prisma.serviceBranch.findUnique({
//     where: { code },
//     select: { id: true },
//   });
//   if (byCode?.id) return byCode.id;

//   const byName = await prisma.serviceBranch.findFirst({
//     where: { name: raw, ...(countryId ? { countryId } : {}) },
//     select: { id: true },
//   });
//   return byName?.id;
// }

// /* --------------------------- Main Server Action --------------------------- */
// export async function importLookupsFromXlsx(
//   formData: FormData
// ): Promise<ImportResult> {
//   const file = formData.get('file') as File | null;
//   const dryRun = readBool(formData, 'dryRun', false);

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

//   console.log('[import] dryRun =', dryRun);
//   console.log('[import] DB URL =', process.env.DATABASE_URL);

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

//     const existing = await prisma.region.findUnique({ where: { name } });
//     if (existing) {
//       if (!dryRun) {
//         await prisma.region.update({
//           where: { id: existing.id },
//           data: { code, description },
//         });
//       }
//       result.updated.Regions++;
//     } else {
//       if (!dryRun) {
//         await prisma.region.create({ data: { name, code, description } });
//       }
//       result.created.Regions++;
//     }
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
//     const regionId = await getRegionIdByName(regionName);
//     if (regionName && !regionId) {
//       result.errors.push(
//         `[Countries row ${i + 2}] region not found (${regionName})`
//       );
//     }

//     const existing = await prisma.country.findUnique({ where: { name } });
//     if (existing) {
//       if (!dryRun) {
//         await prisma.country.update({
//           where: { id: existing.id },
//           data: { iso2, regionId: regionId ?? null },
//         });
//       }
//       result.updated.Countries++;
//     } else {
//       if (!dryRun) {
//         await prisma.country.create({
//           data: { name, iso2, regionId: regionId ?? null },
//         });
//       }
//       result.created.Countries++;
//     }
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
//     const countryId = await getCountryIdByRef(countryRef);
//     if (!countryId) {
//       result.errors.push(
//         `[Branches row ${i + 2}] country not found (${countryRef})`
//       );
//       continue;
//     }

//     let existingId: string | undefined;

//     if (code) {
//       const byCode = await prisma.serviceBranch.findUnique({
//         where: { code },
//         select: { id: true },
//       });
//       existingId = byCode?.id;
//     } else {
//       const byNameCountry = await prisma.serviceBranch.findFirst({
//         where: { name, countryId },
//         select: { id: true },
//       });
//       existingId = byNameCountry?.id;
//     }

//     if (existingId) {
//       if (!dryRun) {
//         await prisma.serviceBranch.update({
//           where: { id: existingId },
//           data: { name, code, countryId },
//         });
//       }
//       result.updated.Branches++;
//     } else {
//       if (!dryRun) {
//         await prisma.serviceBranch.create({
//           data: { name, code, countryId },
//         });
//       }
//       result.created.Branches++;
//     }
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
//     const branchId = await getBranchIdByRef(branchRef);
//     if (branchRef && !branchId) {
//       result.errors.push(
//         `[Ranks row ${i + 2}] branch not found (${branchRef})`
//       );
//     }

//     let existingId: string | undefined;

//     if (code) {
//       const byCode = await prisma.rank.findUnique({
//         where: { code },
//         select: { id: true },
//       });
//       existingId = byCode?.id;
//     } else {
//       // fallback με όνομα + branch (αν υπάρχει)
//       const byName = await prisma.rank.findFirst({
//         where: { name, ...(branchId ? { branchId } : {}) },
//         select: { id: true },
//       });
//       existingId = byName?.id;
//     }

//     if (existingId) {
//       if (!dryRun) {
//         await prisma.rank.update({
//           where: { id: existingId },
//           data: { name, code, tier, level, branchId: branchId ?? null },
//         });
//       }
//       result.updated.Ranks++;
//     } else {
//       if (!dryRun) {
//         await prisma.rank.create({
//           data: { name, code, tier, level, branchId: branchId ?? null },
//         });
//       }
//       result.created.Ranks++;
//     }
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
//     const countryId = await getCountryIdByRef(countryRef);
//     if (countryRef && !countryId) {
//       result.errors.push(
//         `[Organizations row ${i + 2}] country not found (${countryRef})`
//       );
//     }

//     let existingId: string | undefined;

//     if (code) {
//       const byCode = await prisma.organization.findUnique({
//         where: { code },
//         select: { id: true },
//       });
//       existingId = byCode?.id;
//     } else {
//       const byName = await prisma.organization.findFirst({
//         where: { name },
//         select: { id: true },
//       });
//       existingId = byName?.id;
//     }

//     if (existingId) {
//       if (!dryRun) {
//         await prisma.organization.update({
//           where: { id: existingId },
//           data: { name, code, type, countryId: countryId ?? null },
//         });
//       }
//       result.updated.Organizations++;
//     } else {
//       if (!dryRun) {
//         await prisma.organization.create({
//           data: { name, code, type, countryId: countryId ?? null },
//         });
//       }
//       result.created.Organizations++;
//     }
//   }

//   /* ----------------------------------- Units ------------------------------ */
//   type UnitBufferRow = {
//     id: string; // actual id or synthetic in dryRun
//     code: string | null;
//     name: string;
//     parentCode: string; // from Excel
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

//     const countryId = await getCountryIdByRef(r['country']);
//     if (!countryId) {
//       result.errors.push(
//         `[Units row ${i + 2}] country not found (${r['country']})`
//       );
//       continue;
//     }

//     const branchId = await getBranchIdByRef(r['branch'], countryId);
//     if (r['branch'] && !branchId) {
//       result.errors.push(
//         `[Units row ${i + 2}] branch not found (${r['branch']})`
//       );
//     }

//     const latitude = asFloat(r['latitude']) ?? null;
//     const longitude = asFloat(r['longitude']) ?? null;

//     // Εύρεση/Upsert όταν έχεις code, αλλιώς με name+countryId
//     let existingId: string | undefined;
//     if (code) {
//       const byCode = await prisma.unit.findUnique({
//         where: { code },
//         select: { id: true },
//       });
//       existingId = byCode?.id;
//     } else {
//       const byNameCountry = await prisma.unit.findFirst({
//         where: { name, countryId },
//         select: { id: true },
//       });
//       existingId = byNameCountry?.id;
//     }

//     if (existingId) {
//       if (!dryRun) {
//         await prisma.unit.update({
//           where: { id: existingId },
//           data: {
//             name,
//             code,
//             type,
//             countryId,
//             branchId: branchId ?? null,
//             latitude,
//             longitude,
//           },
//         });
//       }
//       unitBuffer.push({
//         id: dryRun ? `DRY-${name}-${code ?? ''}` : (existingId as string),
//         code,
//         name,
//         parentCode: norm(r['parentcode']) || '',
//         countryId,
//       });
//       result.updated.Units++;
//     } else {
//       if (!dryRun) {
//         const created = await prisma.unit.create({
//           data: {
//             name,
//             code,
//             type,
//             countryId,
//             branchId: branchId ?? null,
//             latitude,
//             longitude,
//           },
//           select: { id: true },
//         });
//         unitBuffer.push({
//           id: created.id,
//           code,
//           name,
//           parentCode: norm(r['parentcode']) || '',
//           countryId,
//         });
//       } else {
//         unitBuffer.push({
//           id: `DRY-${name}-${code ?? ''}`,
//           code,
//           name,
//           parentCode: norm(r['parentcode']) || '',
//           countryId,
//         });
//       }
//       result.created.Units++;
//     }
//   }

//   // 2ο pass: parent linking
//   if (dryRun) {
//     // In-memory έλεγχος: parent πρέπει να υπάρχει στο ίδιο αρχείο (code ή name)
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
//     for (const u of unitBuffer) {
//       if (!u.parentCode) continue;

//       // Προτίμησε code → fallback name (+ χώρα για σταθερότητα)
//       let parentId: string | undefined;
//       const pByCode = await prisma.unit.findUnique({
//         where: { code: u.parentCode },
//         select: { id: true },
//       });
//       if (pByCode?.id) parentId = pByCode.id;

//       if (!parentId) {
//         const pByName = await prisma.unit.findFirst({
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

//       await prisma.unit.update({
//         where: { id: u.id },
//         data: { parentId },
//       });
//     }
//   }

//   // Μετά την επιτυχή εισαγωγή (όχι dryRun) κάνε revalidate & γύρνα counts για debug
//   if (!dryRun) {
//     const [countriesCount, branchesCount, unitsCount] = await Promise.all([
//       prisma.country.count(),
//       prisma.serviceBranch.count(),
//       prisma.unit.count(),
//     ]);
//     result.afterCounts = {
//       countries: countriesCount,
//       branches: branchesCount,
//       units: unitsCount,
//     };

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

'use server';

import 'server-only';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/db';
import { revalidateLookups } from '@/actions/common.actions';
import { Prisma, OrganizationType, RankTier, UnitType } from '@prisma/client';

/* ----------------------------- Types & constants ----------------------------- */
export type ImportResult = {
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
  Personnel: 'Personnel',
  Equipment: 'Equipment',
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
const asIntOrNull = (v?: any) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
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
async function getRankIdByRef(ref?: string, branchId?: string) {
  const raw = norm(ref);
  if (!raw) return undefined;
  // prefer code
  const byCode = await prisma.rank.findUnique({
    where: { code: raw },
    select: { id: true },
  });
  if (byCode?.id) return byCode.id;
  // fallback name (+ optional branch)
  const byName = await prisma.rank.findFirst({
    where: { name: raw, ...(branchId ? { branchId } : {}) },
    select: { id: true },
  });
  return byName?.id;
}
async function getUnitIdByRef(ref?: string, countryId?: string) {
  const raw = norm(ref);
  if (!raw) return undefined;
  const byCode = await prisma.unit.findUnique({
    where: { code: raw },
    select: { id: true },
  });
  if (byCode?.id) return byCode.id;
  const byName = await prisma.unit.findFirst({
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

  // entity toggles (checkboxes)
  const load = {
    Regions: readBool(formData, 'loadRegions', true),
    Countries: readBool(formData, 'loadCountries', true),
    Branches: readBool(formData, 'loadBranches', true),
    Ranks: readBool(formData, 'loadRanks', true),
    Organizations: readBool(formData, 'loadOrganizations', true),
    Units: readBool(formData, 'loadUnits', true),
    Personnel: readBool(formData, 'loadPersonnel', false),
    Equipment: readBool(formData, 'loadEquipment', false),
  } as const;

  const result: ImportResult = {
    created: {
      Regions: 0,
      Countries: 0,
      Branches: 0,
      Ranks: 0,
      Organizations: 0,
      Units: 0,
      Personnel: 0,
      Equipment: 0,
    },
    updated: {
      Regions: 0,
      Countries: 0,
      Branches: 0,
      Ranks: 0,
      Organizations: 0,
      Units: 0,
      Personnel: 0,
      Equipment: 0,
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

  const regionsRows = load.Regions ? readRows(wb, SHEETS.Regions) : [];
  const countriesRows = load.Countries ? readRows(wb, SHEETS.Countries) : [];
  const branchesRows = load.Branches ? readRows(wb, SHEETS.Branches) : [];
  const ranksRows = load.Ranks ? readRows(wb, SHEETS.Ranks) : [];
  const orgRows = load.Organizations ? readRows(wb, SHEETS.Organizations) : [];
  const unitRows = load.Units ? readRows(wb, SHEETS.Units) : [];
  const personnelRows = load.Personnel ? readRows(wb, SHEETS.Personnel) : [];
  const equipmentRows = load.Equipment ? readRows(wb, SHEETS.Equipment) : [];

  /* -------------------------------- Regions ------------------------------- */
  if (load.Regions) {
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
  }

  /* ------------------------------- Countries ------------------------------ */
  if (load.Countries) {
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
  }

  /* -------------------------------- Branches ------------------------------ */
  if (load.Branches) {
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
  }

  /* ---------------------------------- Ranks ------------------------------- */
  if (load.Ranks) {
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
      const level = asIntOrNull(r['level']);

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
  }

  /* ----------------------------- Organizations ---------------------------- */
  if (load.Organizations) {
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
  }

  /* ----------------------------------- Units ------------------------------ */
  if (load.Units) {
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

        await prisma.unit.update({ where: { id: u.id }, data: { parentId } });
      }
    }
  }

  /* -------------------------------- Personnel ----------------------------- */
  if (load.Personnel) {
    for (let i = 0; i < personnelRows.length; i++) {
      const r = personnelRows[i];
      const serviceNumber = norm(r['servicenumber']); // unique key
      const firstName = norm(r['firstname']);
      const lastName = norm(r['lastname']);
      if (!serviceNumber || !firstName || !lastName) {
        result.errors.push(
          `[Personnel row ${
            i + 2
          }] missing required (serviceNumber, firstName, lastName)`
        );
        continue;
      }

      const countryId = await getCountryIdByRef(r['country']);
      const branchId = await getBranchIdByRef(r['branch']);
      const rankId = await getRankIdByRef(r['rank'], branchId);
      const unitId = await getUnitIdByRef(r['unit']);

      if (r['country'] && !countryId)
        result.errors.push(
          `[Personnel row ${i + 2}] country not found (${r['country']})`
        );
      if (r['branch'] && !branchId)
        result.errors.push(
          `[Personnel row ${i + 2}] branch not found (${r['branch']})`
        );
      if (r['rank'] && !rankId)
        result.errors.push(
          `[Personnel row ${i + 2}] rank not found (${r['rank']})`
        );
      if (r['unit'] && !unitId)
        result.errors.push(
          `[Personnel row ${i + 2}] unit not found (${r['unit']})`
        );

      // NOTE: Adjust field names to your Prisma schema if they differ
      try {
        const existing = await (prisma as any).personnel.findUnique({
          where: { serviceNumber },
        });
        if (existing) {
          if (!dryRun) {
            await (prisma as any).personnel.update({
              where: { serviceNumber },
              data: {
                firstName,
                lastName,
                countryId: countryId ?? null,
                branchId: branchId ?? null,
                rankId: rankId ?? null,
                unitId: unitId ?? null,
                position: norm(r['position']) || null,
                email: norm(r['email']) || null,
                phone: norm(r['phone']) || null,
              },
            });
          }
          result.updated.Personnel++;
        } else {
          if (!dryRun) {
            await (prisma as any).personnel.create({
              data: {
                serviceNumber,
                firstName,
                lastName,
                countryId: countryId ?? null,
                branchId: branchId ?? null,
                rankId: rankId ?? null,
                unitId: unitId ?? null,
                position: norm(r['position']) || null,
                email: norm(r['email']) || null,
                phone: norm(r['phone']) || null,
              },
            });
          }
          result.created.Personnel++;
        }
      } catch (e: any) {
        result.errors.push(`[Personnel row ${i + 2}] ${(e && e.message) || e}`);
      }
    }
  }

  /* -------------------------------- Equipment ----------------------------- */
  if (load.Equipment) {
    for (let i = 0; i < equipmentRows.length; i++) {
      const r = equipmentRows[i];
      const code = norm(r['code']); // treat as unique if present
      const name = norm(r['name']);
      if (!name) {
        result.errors.push(`[Equipment row ${i + 2}] missing name`);
        continue;
      }
      const serial = norm(r['serial']) || null; // also acts as alternate unique
      const unitId = await getUnitIdByRef(r['unit']);
      if (r['unit'] && !unitId)
        result.errors.push(
          `[Equipment row ${i + 2}] unit not found (${r['unit']})`
        );

      // free-text fields, keep flexible to match your schema
      const type = norm(r['type']) || null;
      const status = norm(r['status']) || null;
      const notes = norm(r['notes']) || null;

      try {
        let existing: any = null;
        if (code)
          existing = await (prisma as any).equipment.findUnique({
            where: { code },
          });
        if (!existing && serial)
          existing = await (prisma as any).equipment.findUnique({
            where: { serial },
          });

        if (existing) {
          if (!dryRun) {
            await (prisma as any).equipment.update({
              where: code ? { code } : { serial },
              data: {
                name,
                code: code || null,
                serial,
                unitId: unitId ?? null,
                type,
                status,
                notes,
              },
            });
          }
          result.updated.Equipment++;
        } else {
          if (!dryRun) {
            await (prisma as any).equipment.create({
              data: {
                name,
                code: code || null,
                serial,
                unitId: unitId ?? null,
                type,
                status,
                notes,
              },
            });
          }
          result.created.Equipment++;
        }
      } catch (e: any) {
        result.errors.push(`[Equipment row ${i + 2}] ${(e && e.message) || e}`);
      }
    }
  }

  // Μετά την επιτυχή εισαγωγή (όχι dryRun) κάνε revalidate & γύρνα counts για debug
  if (!dryRun) {
    try {
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
    } catch (e) {
      // ignore
    }

    try {
      await revalidateLookups(
        'regions',
        'countries',
        'branches',
        'ranks',
        'organizations',
        'units'
        // 'personnel',
        // 'equipment'
      );
    } catch (e) {
      // no-op if not wired
    }
  }

  return result;
}
