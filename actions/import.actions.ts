'use server';

import 'server-only';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/db';
import {
  revalidateLookups,
  revalidateSidebarCounts,
} from '@/actions/common.actions';
import {
  Prisma,
  OrganizationType,
  RankTier,
  UnitType,
  PersonType,
  ServiceStatus,
  EquipmentCategory,
  AssignmentStatus,
  PostingType,
} from '@prisma/client';

/* ----------------------------- Helpers & Types ---------------------------- */

export type WipeResult = {
  ok: boolean;
  deleted: Record<string, number>;
  error?: string;
};

export type ImportResult = {
  created: Record<string, number>;
  updated: Record<string, number>;
  errors: string[];
  dryRun: boolean;
  afterCounts?: { countries: number; branches: number; units: number };
};

export type PreflightReport = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  info: Record<string, number>;
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
  EquipmentAssignments: 'EquipmentAssignments',
  Companies: 'Companies',
  CompanyOffices: 'CompanyOffices',
  CompanyOrganizations: 'CompanyOrganizations',
  CountryOrganizations: 'CountryOrganizations',
  PersonOrganizations: 'PersonOrganizations',
  Specialties: 'Specialties',
  Positions: 'Positions',
  Promotions: 'Promotions',
  Meetings: 'Meetings',
  MeetingTopics: 'MeetingTopics',
  MeetingParticipants: 'MeetingParticipants',
  PersonPostings: 'PersonPostings',
} as const;

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
const enumFromStrict = enumFrom;

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30); // 1899-12-30
const DAY_MS = 24 * 60 * 60 * 1000;

function excelSerialToDate(n: number): Date | null {
  if (!Number.isFinite(n)) return null;
  // Excel bug για το 1900-02-29 -> εδώ δεν χρειάζεται ειδικός χειρισμός
  // Αποδεκτό range serials ~ [60..60000] (1900..2064+) — προσαρμόζεις αν θες
  if (n < 60 || n > 100000) return null;
  const ms = EXCEL_EPOCH_UTC + Math.round(n) * DAY_MS;
  return new Date(ms);
}

function asDateOrNull(v?: any): Date | null {
  if (v == null || v === '') return null;

  // Ήδη Date
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;

  // Αριθμός -> Excel serial
  if (typeof v === 'number') {
    const d = excelSerialToDate(v);
    return d && !Number.isNaN(d.getTime()) ? d : null;
  }

  // String
  const s = String(v).trim();
  if (!s) return null;

  // String που είναι καθαρά αριθμός -> πιθανό Excel serial
  if (/^\d{1,6}$/.test(s)) {
    const num = Number(s);
    const d = excelSerialToDate(num);
    if (d && !Number.isNaN(d.getTime())) return d;
  }

  // ISO / γενικά parseable από Date
  {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // dd/MM/yyyy ή dd-MM-yyyy ή dd.MM.yyyy
  {
    const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (m) {
      let [, dd, mm, yy] = m;
      const day = Number(dd),
        mon = Number(mm) - 1;
      let year = Number(yy);
      if (yy.length === 2) year += year >= 70 ? 1900 : 2000; // πολιτική για yy
      if (year >= 1800 && year <= 2200) {
        const d = new Date(Date.UTC(year, mon, day));
        if (!Number.isNaN(d.getTime())) return d;
      }
    }
  }

  // MM/dd/yyyy fallback (αν το πρώτο token <= 12)
  {
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      let [, mm, dd, yy] = m;
      const mon = Number(mm),
        day = Number(dd);
      if (mon >= 1 && mon <= 12) {
        let year = Number(yy);
        if (yy.length === 2) year += year >= 70 ? 1900 : 2000;
        if (year >= 1800 && year <= 2200) {
          const d = new Date(Date.UTC(year, mon - 1, day));
          if (!Number.isNaN(d.getTime())) return d;
        }
      }
    }
  }

  return null;
}

function readBool(fd: FormData, key: string, fallback = false) {
  const v = fd.get(key);
  if (typeof v !== 'string') return fallback;
  const s = v.trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'on' || s === 'yes';
}

function jsonFromCell(
  v: any
):
  | Prisma.InputJsonValue
  | typeof Prisma.DbNull
  | typeof Prisma.JsonNull
  | undefined {
  const s = norm(v);
  if (!s) return Prisma.DbNull; // θέλεις κενό -> DB NULL (τέλειο για generic icon στο UI)
  // Αν θέλεις να κάνεις opt-in για JSON null αντί για DB NULL, βάλε εδώ Prisma.JsonNull
  try {
    // δοκίμασε να το κάνεις parse ως JSON
    return JSON.parse(s) as Prisma.InputJsonValue;
  } catch {
    // κράτα το ως σκέτο string JSON value (επιτρεπτό)
    return s as unknown as Prisma.InputJsonValue;
  }
}

// Δέχεται πολλά πιθανά header names για fullname
function pickFullname(r: any) {
  return (
    norm(r['person']) ||
    norm(r['fullname']) ||
    norm(r['full_name']) ||
    norm(r['full name']) ||
    norm(r['name']) || // συχνό στο excel
    ''
  );
}

// Θεώρησε "άδεια" μια σειρά αν ΟΛΕΣ οι στήλες της είναι κενές string-wise
function isEmptyRow(r: any) {
  const vals = Object.values(r ?? {});
  if (!vals.length) return true;
  return vals.every((v) => norm(v) === '');
}

// Από ένα row, φτιάξε first/last από fullname ή από πεδία first/last
function extractName(r: any) {
  let firstName = norm(r['firstname']);
  let lastName = norm(r['lastname']);
  const full = pickFullname(r);

  if ((!firstName || !lastName) && full) {
    // υποστήριξη "Last, First"
    const partsComma = full
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (partsComma.length === 2) {
      lastName = lastName || partsComma[0];
      firstName = firstName || partsComma[1];
    } else {
      // default: "First Last [Middle...]"
      const parts = full.replace(/\s+/g, ' ').trim().split(' ');
      if (parts.length >= 2) {
        firstName = firstName || parts.shift()!;
        lastName = lastName || parts.join(' ');
      } else if (parts.length === 1) {
        // μία λέξη -> ας τη βάλουμε στο lastName ώστε να φανεί το λάθος αν λείπει first
        lastName = lastName || parts[0];
      }
    }
  }

  return { firstName, lastName, hadAnyName: !!(firstName || lastName || full) };
}

// function parseRankRef(ref?: string) {
//   const raw = norm(ref);
//   if (!raw)
//     return {
//       rankCode: null as string | null,
//       branchCode: null as string | null,
//       raw: null as string | null,
//     };
//   const parts = raw
//     .split('-')
//     .map((s) => s.trim())
//     .filter(Boolean);
//   if (parts.length >= 2) {
//     const rankCode = parts.pop()!; // τελευταίο = rank code (π.χ. YZB / 1LT)
//     const branchCode = parts.join('-') || null; // ό,τι μένει = branch code (π.χ. TR-KKK / EF)
//     return { rankCode, branchCode, raw };
//   }
//   return { rankCode: raw, branchCode: null, raw };
// }

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
  const out = rows.map((r) => {
    const o: Record<string, any> = {};
    for (const k of Object.keys(r)) o[k.toLowerCase()] = r[k];
    return o;
  });
  return out;
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
async function getRankIdByRef(rankCode: string) {
  const raw = norm(rankCode);
  if (!raw) return undefined;

  if (rankCode) {
    const byCode = await prisma.rank.findFirst({
      where: {
        code: rankCode,
      },
      select: { id: true },
    });
    if (byCode?.id) return byCode.id;
  }

  const byName = await prisma.rank.findFirst({
    where: { name: raw },
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
async function getOrganizationIdByRef(ref?: string) {
  const raw = norm(ref);
  if (!raw) return undefined;
  const byCode = await prisma.organization.findUnique({
    where: { code: raw },
    select: { id: true },
  });
  if (byCode?.id) return byCode.id;
  const byName = await prisma.organization.findFirst({
    where: { name: raw },
    select: { id: true },
  });
  return byName?.id;
}
async function getCompanyIdByName(name?: string) {
  const v = norm(name);
  if (!v) return undefined;
  const c = await prisma.company.findFirst({
    where: { name: v },
    select: { id: true },
  });
  return c?.id;
}

async function getPersonIdByName(
  fullname?: string,
  firstName?: string,
  lastName?: string,
  countryId?: string,
  type?: PersonType
) {
  // 1) Προσπάθησε απ fullname ("First Last [Middle...]")
  const full = norm(fullname);
  let fn = norm(firstName);
  let ln = norm(lastName);

  if (full) {
    const parts = full.replace(/\s+/g, ' ').trim().split(' ');
    if (parts.length >= 2) {
      fn = parts.shift() as string; // πρώτο token = firstName
      ln = parts.join(' '); // ό,τι απομένει = lastName (αν έχει middle, πάει μαζί στο lastName)
    }
    // αν τ fullname είχε μόνο μία λέξη, θα πέσουμε στο fallback στα πεδία firstName/lastName
  }

  // 2) Validation μετά το resolve
  if (!fn || !ln) return undefined;

  const person = await prisma.person.findFirst({
    where: {
      firstName: fn,
      lastName: ln,
      ...(countryId ? { countryId } : {}),
      ...(type ? { type } : {}),
    },
    select: { id: true },
  });

  return person?.id;
}

async function getSpecialtyIdByName(name?: string) {
  const v = norm(name);
  if (!v) return undefined;
  const s = await prisma.specialty.findFirst({
    where: { name: v },
    select: { id: true },
  });
  return s?.id;
}

/* -------------------------------------------------------------------------- */
/*                                   WIPE DB                                  */
/* -------------------------------------------------------------------------- */
export async function wipeDatabase(): Promise<WipeResult> {
  const deleted: Record<string, number> = {};
  try {
    const res = await prisma.$transaction(async (db) => {
      // Meetings
      deleted.MeetingParticipants = (
        await db.meetingParticipant.deleteMany({})
      ).count;
      deleted.MeetingTopics = (await db.meetingTopic.deleteMany({})).count;
      deleted.Meetings = (await db.meeting.deleteMany({})).count;

      // Assignments / Links
      deleted.EquipmentAssignments = (
        await db.equipmentAssignment.deleteMany({})
      ).count;
      deleted.DocumentLinks = (await db.documentLink.deleteMany({})).count;

      // personnel-related
      deleted.PersonOrganizations = (
        await db.personOrganization.deleteMany({})
      ).count;
      deleted.PersonPostings = (await db.personPosting.deleteMany({})).count;
      deleted.Promotions = (await db.promotion.deleteMany({})).count;
      deleted.personnel = (await db.person.deleteMany({})).count;

      // Orgs / Companies cross links
      deleted.CompanyOrganizations = (
        await db.companyOrganization.deleteMany({})
      ).count;
      deleted.CountryOrganizations = (
        await db.countryOrganization.deleteMany({})
      ).count;
      deleted.CompanyOffices = (await db.companyOffice.deleteMany({})).count;

      // Equipment, Documents, Tags
      deleted.Equipments = (await db.equipment.deleteMany({})).count;
      deleted.Documents = (await db.document.deleteMany({})).count;
      deleted.Tags = (await db.tag.deleteMany({})).count;

      // Core lookups
      deleted.Units = (await db.unit.deleteMany({})).count;
      deleted.Organizations = (await db.organization.deleteMany({})).count;
      deleted.Specialties = (await db.specialty.deleteMany({})).count;
      deleted.Ranks = (await db.rank.deleteMany({})).count;
      deleted.ServiceBranch = (await db.serviceBranch.deleteMany({})).count;
      deleted.Companies = (await db.company.deleteMany({})).count;

      // Countries/Regions
      deleted.Countries = (await db.country.deleteMany({})).count;
      deleted.Regions = (await db.region.deleteMany({})).count;

      return deleted;
    });

    return { ok: true, deleted: res };
  } catch (e: any) {
    return { ok: false, deleted, error: e?.message ?? String(e) };
  }
}

/* -------------------------------------------------------------------------- */
/*                               PREFLIGHT (clean headers)                    */
/* -------------------------------------------------------------------------- */

export async function preflightXlsx(
  formData: FormData
): Promise<PreflightReport> {
  const file = formData.get('file') as File | null;
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: Record<string, number> = {};

  if (!file) return { ok: false, errors: ['No file uploaded'], warnings, info };

  const load = {
    Regions: readBool(formData, 'loadRegions', true),
    Countries: readBool(formData, 'loadCountries', true),
    Branches: readBool(formData, 'loadBranches', true),
    Ranks: readBool(formData, 'loadRanks', true),
    Organizations: readBool(formData, 'loadOrganizations', true),
    Units: readBool(formData, 'loadUnits', true),
    Personnel: readBool(formData, 'loadPersonnel', false),
    Equipment: readBool(formData, 'loadEquipment', false),
    EquipmentAssignments: readBool(formData, 'loadEquipmentAssignments', false),
    Companies: readBool(formData, 'loadCompanies', false),
    CompanyOffices: readBool(formData, 'loadCompanyOffices', false),
    CompanyOrganizations: readBool(formData, 'loadCompanyOrganizations', false),
    CountryOrganizations: readBool(formData, 'loadCountryOrganizations', false),
    PersonOrganizations: readBool(formData, 'loadPersonOrganizations', false),
    Specialties: readBool(formData, 'loadSpecialties', false),
    Positions: readBool(formData, 'loadPositions', false),
    Promotions: readBool(formData, 'loadPromotions', false),
    Meetings: readBool(formData, 'loadMeetings', false),
    MeetingTopics: readBool(formData, 'loadMeetingTopics', false),
    MeetingParticipants: readBool(formData, 'loadMeetingParticipants', false),
    PersonPostings: readBool(formData, 'loadPersonPostings', false),
  } as const;

  // dependency hints
  if (load.Ranks && !load.Branches)
    warnings.push('Ranks: χωρίς Branches, branch refs θα αναζητηθούν από DB.');
  if (load.Branches && !load.Countries)
    warnings.push('Branches: χωρίς Countries, country refs από DB.');
  if (load.Units && !load.Countries)
    warnings.push('Units: χωρίς Countries, country refs από DB.');
  if (load.Units && !load.Branches)
    warnings.push('Units: χωρίς Branches, branch refs από DB.');
  if (load.Personnel && !load.Ranks)
    warnings.push('Personnel: χωρίς Ranks, rank refs από DB.');
  if (load.Personnel && !load.Branches)
    warnings.push('Personnel: χωρίς Branches, branch refs από DB.');

  if (!Object.values(load).some(Boolean)) {
    return { ok: true, errors, warnings, info };
  }

  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: 'array' });

  const rowsIf = (flag: boolean, name: string) => {
    if (!flag) {
      info[name] = 0;
      return [] as any[];
    }
    const r = readRows(wb, name);
    info[name] = r.length;
    return r;
  };

  const regions = rowsIf(load.Regions, SHEETS.Regions);
  const countries = rowsIf(load.Countries, SHEETS.Countries);
  const branches = rowsIf(load.Branches, SHEETS.Branches);
  const ranks = rowsIf(load.Ranks, SHEETS.Ranks);
  const orgs = rowsIf(load.Organizations, SHEETS.Organizations);
  const units = rowsIf(load.Units, SHEETS.Units);
  const personnel = rowsIf(load.Personnel, SHEETS.Personnel);
  const promotions = rowsIf(load.Promotions, SHEETS.Promotions);
  const postings = rowsIf(load.PersonPostings, SHEETS.PersonPostings);
  const equipment = rowsIf(load.Equipment, SHEETS.Equipment);
  const eqAssign = rowsIf(
    load.EquipmentAssignments,
    SHEETS.EquipmentAssignments
  );
  const companies = rowsIf(load.Companies, SHEETS.Companies);
  const offices = rowsIf(load.CompanyOffices, SHEETS.CompanyOffices);
  const compOrgs = rowsIf(
    load.CompanyOrganizations,
    SHEETS.CompanyOrganizations
  );
  const ctryOrgs = rowsIf(
    load.CountryOrganizations,
    SHEETS.CountryOrganizations
  );
  const personOrgs = rowsIf(
    load.PersonOrganizations,
    SHEETS.PersonOrganizations
  );
  const specialties = rowsIf(load.Specialties, SHEETS.Specialties);
  const positions = rowsIf(load.Positions, SHEETS.Positions);
  const meetings = rowsIf(load.Meetings, SHEETS.Meetings);
  const mt = rowsIf(load.MeetingTopics, SHEETS.MeetingTopics);
  const mp = rowsIf(load.MeetingParticipants, SHEETS.MeetingParticipants);

  // --- existing validations (ενδεικτικά) ---
  ranks.forEach((r, i) => {
    const tier = toUpper(r['tier']);
    if (!tier || !(RankTier as any)[tier]) {
      errors.push(`[Ranks row ${i + 2}] invalid tier (${r['tier']})`);
    }
  });

  // στο preflightXlsx
  specialties.forEach((r, i) => {
    if (!norm(r['name']))
      errors.push(`[Specialties row ${i + 2}] missing name`);
  });
  positions.forEach((r, i) => {
    if (!norm(r['name'])) errors.push(`[Positions row ${i + 2}] missing name`);
  });

  units.forEach((r, i) => {
    const type = toUpper(r['type']);
    if (!type || !(UnitType as any)[type]) {
      errors.push(`[Units row ${i + 2}] invalid type (${r['type']})`);
    }
    if (!norm(r['country']))
      errors.push(`[Units row ${i + 2}] missing country`);
  });

  equipment.forEach((r, i) => {
    const c = toUpper(r['category']);
    if (!c || !(EquipmentCategory as any)[c]) {
      errors.push(
        `[Equipment row ${i + 2}] invalid category (${r['category']})`
      );
    }
  });

  personnel.forEach((r, i) => {
    if (isEmptyRow(r)) return; // αγνόησε τελείως empty lines

    const full = pickFullname(r);
    const hasParts = !!norm(r['firstname']) && !!norm(r['lastname']);
    const hasFull = !!full;

    if (!hasFull && !hasParts) {
      errors.push(
        `[Personnel row ${
          i + 2
        }] missing name (δώσε "person"/"fullname"/"name" ή "firstname"+"lastname")`
      );
    }

    const t = toUpper(r['type'] || 'MILITARY');
    if (!(PersonType as any)[t]) {
      errors.push(`[Personnel row ${i + 2}] invalid type (${r['type']})`);
    }
    const s = toUpper(r['status'] || 'ACTIVE');
    if (!(ServiceStatus as any)[s]) {
      errors.push(`[Personnel row ${i + 2}] invalid status (${r['status']})`);
    }
  });

  // ---------- UPDATED: Promotions supports fullname ----------
  promotions.forEach((r, i) => {
    const hasFull = !!norm(r['person']) || !!norm(r['fullname']);
    const hasParts = !!norm(r['firstname']) && !!norm(r['lastname']);
    if (!hasFull && !hasParts) {
      errors.push(
        `[Promotions row ${
          i + 2
        }] missing name (δώσε "person"/"fullname" ή "firstname"+"lastname")`
      );
    }
    const year = Number(r['promotionyear']);
    if (!Number.isInteger(year)) {
      errors.push(`[Promotions row ${i + 2}] invalid promotionYear`);
    }
  });

  // ---------- UPDATED: MeetingParticipants supports fullname ----------
  mp.forEach((r, i) => {
    // const dateOk = !!asDateOrNull(r['date']);
    // if (!dateOk) {
    //   errors.push(`[MeetingParticipants row ${i + 2}] invalid date`);
    //   return;
    // }
    const hasFull = !!norm(r['person']) || !!norm(r['fullname']);
    //const hasParts = !!norm(r['firstname']) && !!norm(r['lastname']);
    if (!hasFull) {
      errors.push(
        `[MeetingParticipants row ${
          i + 2
        }] missing person  (δώσε "person"/"fullname")`
      );
    }
  });

  return { ok: errors.length === 0, errors, warnings, info };
}

/* -------------------------------------------------------------------------- */
/*                                   IMPORT                                   */
/* -------------------------------------------------------------------------- */
export async function importLookupsFromXlsx(
  formData: FormData
): Promise<ImportResult> {
  const file = formData.get('file') as File | null;
  const dryRun = readBool(formData, 'dryRun', false);

  const load = {
    Regions: readBool(formData, 'loadRegions', true),
    Countries: readBool(formData, 'loadCountries', true),
    Branches: readBool(formData, 'loadBranches', true),
    Ranks: readBool(formData, 'loadRanks', true),
    Organizations: readBool(formData, 'loadOrganizations', true),
    Units: readBool(formData, 'loadUnits', true),

    Personnel: readBool(formData, 'loadPersonnel', false),
    Equipment: readBool(formData, 'loadEquipment', false),
    EquipmentAssignments: readBool(formData, 'loadEquipmentAssignments', false),

    Companies: readBool(formData, 'loadCompanies', false),
    CompanyOffices: readBool(formData, 'loadCompanyOffices', false),
    CompanyOrganizations: readBool(formData, 'loadCompanyOrganizations', false),
    CountryOrganizations: readBool(formData, 'loadCountryOrganizations', false),
    PersonOrganizations: readBool(formData, 'loadPersonOrganizations', false),
    Specialties: readBool(formData, 'loadSpecialties', false),
    Positions: readBool(formData, 'loadPositions', false),
    Promotions: readBool(formData, 'loadPromotions', false),
    Meetings: readBool(formData, 'loadMeetings', false),
    MeetingTopics: readBool(formData, 'loadMeetingTopics', false),
    MeetingParticipants: readBool(formData, 'loadMeetingParticipants', false),
    PersonPostings: readBool(formData, 'loadPersonPostings', false),
  } as const;

  const result: ImportResult = {
    created: Object.fromEntries(Object.keys(SHEETS).map((k) => [k, 0])) as any,
    updated: Object.fromEntries(Object.keys(SHEETS).map((k) => [k, 0])) as any,
    errors: [],
    dryRun,
  };

  if (!file) {
    result.errors.push('No file uploaded');
    return result;
  }

  // preflight gate (only in real run)
  if (!dryRun) {
    const pre = await preflightXlsx(formData);
    if (!pre.ok) {
      result.errors.push('Preflight failed, aborting write:');
      result.errors.push(...pre.errors);
      return result;
    }
  }

  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: 'array' });

  const rows = (name: keyof typeof SHEETS, flag: boolean) =>
    flag ? readRows(wb, SHEETS[name]) : [];

  const regionsRows = rows('Regions', load.Regions);
  const countriesRows = rows('Countries', load.Countries);
  const branchesRows = rows('Branches', load.Branches);
  const ranksRows = rows('Ranks', load.Ranks);
  const orgRows = rows('Organizations', load.Organizations);
  const unitRows = rows('Units', load.Units);

  const specialtiesRows = rows('Specialties', load.Specialties);
  const positionsRows = rows('Positions', load.Positions);
  const personnelRows = rows('Personnel', load.Personnel);
  const promotionsRows = rows('Promotions', load.Promotions);
  const postingsRows = rows('PersonPostings', load.PersonPostings);

  const companiesRows = rows('Companies', load.Companies);
  const companyOfficesRows = rows('CompanyOffices', load.CompanyOffices);
  const companyOrganizationsRows = rows(
    'CompanyOrganizations',
    load.CompanyOrganizations
  );
  const countryOrganizationsRows = rows(
    'CountryOrganizations',
    load.CountryOrganizations
  );
  const personOrganizationsRows = rows(
    'PersonOrganizations',
    load.PersonOrganizations
  );

  const equipmentRows = rows('Equipment', load.Equipment);
  const equipmentAssignmentsRows = rows(
    'EquipmentAssignments',
    load.EquipmentAssignments
  );

  const meetingsRows = rows('Meetings', load.Meetings);
  const meetingTopicsRows = rows('MeetingTopics', load.MeetingTopics);
  const meetingParticipantsRows = rows(
    'MeetingParticipants',
    load.MeetingParticipants
  );

  /* ------------------------------- Regions -------------------------------- */
  if (load.Regions) {
    for (let i = 0; i < regionsRows.length; i++) {
      const r = regionsRows[i];
      const name = norm(r['name']);
      if (!name) {
        result.errors.push(`[Regions row ${i + 2}] missing name`);
        continue;
      }
      const data = {
        name,
        code: norm(r['code']) || null,
        description: norm(r['description']) || null,
      };

      const existing = await prisma.region.findUnique({ where: { name } });
      if (existing) {
        if (!dryRun)
          await prisma.region.update({ where: { id: existing.id }, data });
        result.updated.Regions++;
      } else {
        if (!dryRun) await prisma.region.create({ data });
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
      const regionId = await getRegionIdByName(norm(r['region']));
      const data = {
        name,
        iso2,
        regionId: regionId ?? null,
        // NEW: image/flag fields with nulls
        flag: norm(r['flag']) || null,
        countryImage: norm(r['countryimage']) || null,
        description: norm(r['description']) || null,
      };

      const existing = await prisma.country.findUnique({ where: { name } });
      if (existing) {
        if (!dryRun)
          await prisma.country.update({ where: { id: existing.id }, data });
        result.updated.Countries++;
      } else {
        if (!dryRun) await prisma.country.create({ data });
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
      const countryId = await getCountryIdByRef(r['country']);
      if (!countryId) {
        result.errors.push(
          `[Branches row ${i + 2}] country not found (${r['country']})`
        );
        continue;
      }
      const data = {
        name,
        code,
        countryId,
        description: norm(r['description']) || null,
      };

      let id: string | undefined;
      if (code) {
        const byCode = await prisma.serviceBranch.findUnique({
          where: { code },
          select: { id: true },
        });
        id = byCode?.id;
      } else {
        const byNameCountry = await prisma.serviceBranch.findFirst({
          where: { name, countryId },
          select: { id: true },
        });
        id = byNameCountry?.id;
      }

      if (id) {
        if (!dryRun) await prisma.serviceBranch.update({ where: { id }, data });
        result.updated.Branches++;
      } else {
        if (!dryRun) await prisma.serviceBranch.create({ data });
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
      const tier = enumFrom(RankTier, r['tier']);
      if (!tier) {
        result.errors.push(`[Ranks row ${i + 2}] invalid tier (${r['tier']})`);
        continue;
      }
      const code = norm(r['code']) || null;
      const level = asIntOrNull(r['level']);
      const branchId = await getBranchIdByRef(r['branch']);
      const data = {
        name,
        code,
        tier,
        level,
        branchId: branchId ?? null,
        rankImage: norm(r['rankimage']) || null,
        description: norm(r['description']) || null,
      };

      let id: string | undefined;
      if (code) {
        const byCode = await prisma.rank.findUnique({
          where: { code },
          select: { id: true },
        });
        id = byCode?.id;
      } else {
        const byName = await prisma.rank.findFirst({
          where: { name, ...(branchId ? { branchId } : {}) },
          select: { id: true },
        });
        id = byName?.id;
      }

      if (id) {
        if (!dryRun) await prisma.rank.update({ where: { id }, data });
        result.updated.Ranks++;
      } else {
        if (!dryRun) await prisma.rank.create({ data });
        result.created.Ranks++;
      }
    }
  }

  /* -------------------------------- Specialties ----------------------------- */
  if (load.Specialties) {
    for (let i = 0; i < specialtiesRows.length; i++) {
      const r = specialtiesRows[i];
      const name = norm(r['name']);
      if (!name) {
        result.errors.push(`[Specialties row ${i + 2}] missing name`);
        continue;
      }
      const data = {
        name,
        code: norm(r['code']) || null,
        specialtyImage: norm(r['specialtyimage']) || null,
        description: norm(r['description']) || null,
      };

      const existing = await prisma.specialty.findFirst({
        where: { OR: [{ name }, { code: data.code ?? '' }] },
        select: { id: true },
      });

      if (existing) {
        if (!dryRun)
          await prisma.specialty.update({ where: { id: existing.id }, data });
        result.updated.Specialties++;
      } else {
        if (!dryRun) await prisma.specialty.create({ data });
        result.created.Specialties++;
      }
    }
  }

  /* --------------------------------- Positions ------------------------------ */
  if (load.Positions) {
    for (let i = 0; i < positionsRows.length; i++) {
      const r = positionsRows[i];
      const name = norm(r['name']);
      if (!name) {
        result.errors.push(`[Positions row ${i + 2}] missing name`);
        continue;
      }

      const data = {
        name,
        code: norm(r['code']) || null,
        positionImage: norm(r['positionimage']) || null,
        description: norm(r['description']) || null,
      };

      const existing = await prisma.position.findFirst({
        where: { OR: [{ name }, { code: data.code ?? '' }] },
        select: { id: true },
      });

      if (existing) {
        if (!dryRun)
          await prisma.position.update({ where: { id: existing.id }, data });
        result.updated.Positions++;
      } else {
        if (!dryRun) await prisma.position.create({ data });
        result.created.Positions++;
      }
    }
  }

  /* ----------------------------- Organizations ---------------------------- */
  if (load.Organizations) {
    type OrgBuf = { id: string; name: string; parentRef?: string | null };
    const buf: OrgBuf[] = [];

    for (let i = 0; i < orgRows.length; i++) {
      const r = orgRows[i];
      const name = norm(r['name']);
      if (!name) {
        result.errors.push(`[Organizations row ${i + 2}] missing name`);
        continue;
      }
      const type = enumFrom(OrganizationType, r['type']);
      if (!type) {
        result.errors.push(
          `[Organizations row ${i + 2}] invalid type (${r['type']})`
        );
        continue;
      }
      const code = norm(r['code']) || null;
      const countryId = await getCountryIdByRef(r['country']);
      const parentRef = norm(r['parent']) || null;
      const data = {
        name,
        code,
        type,
        countryId: countryId ?? null,
        organizationImage: norm(r['organizationimage']) || null,
        description: norm(r['description']) || null,
      };

      let id: string | undefined;
      if (code) {
        const byCode = await prisma.organization.findUnique({
          where: { code },
          select: { id: true },
        });
        id = byCode?.id;
      } else {
        const byName = await prisma.organization.findFirst({
          where: { name },
          select: { id: true },
        });
        id = byName?.id;
      }

      if (id) {
        if (!dryRun) await prisma.organization.update({ where: { id }, data });
        buf.push({ id, name, parentRef });
        result.updated.Organizations++;
      } else {
        if (!dryRun) {
          const created = await prisma.organization.create({
            data,
            select: { id: true },
          });
          buf.push({ id: created.id, name, parentRef });
        } else {
          buf.push({ id: `DRY-${name}-${code ?? ''}`, name, parentRef });
        }
        result.created.Organizations++;
      }
    }

    if (!dryRun) {
      for (const o of buf) {
        if (!o.parentRef) continue;
        const parentId = await getOrganizationIdByRef(o.parentRef);
        if (!parentId) {
          result.errors.push(
            `Organizations: parent not found (${o.parentRef}) for ${o.name}`
          );
          continue;
        }
        await prisma.organization.update({
          where: { id: o.id },
          data: { parentId },
        });
      }
    } else {
      const names = new Set(buf.map((x) => x.name));
      for (const o of buf) {
        if (!o.parentRef) continue;
        if (!names.has(o.parentRef)) {
          result.errors.push(
            `Organizations (dry): parent might be missing (${o.parentRef}) for ${o.name}`
          );
        }
      }
    }
  }

  /* ----------------------------------- Units ------------------------------ */
  if (load.Units) {
    type Row = {
      id: string;
      code: string | null;
      name: string;
      parentCode: string;
      countryId?: string;
    };
    const buf: Row[] = [];

    for (let i = 0; i < unitRows.length; i++) {
      const r = unitRows[i];
      const name = norm(r['name']);
      if (!name) {
        result.errors.push(`[Units row ${i + 2}] missing name`);
        continue;
      }
      const type = enumFrom(UnitType, r['type']);
      if (!type) {
        result.errors.push(`[Units row ${i + 2}] invalid type (${r['type']})`);
        continue;
      }
      const code = norm(r['code']) || null;
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
      const data = {
        name,
        code,
        type,
        countryId,
        branchId: branchId ?? null,
        latitude,
        longitude,
        unitImage: norm(r['unitimage']) || null,
        description: norm(r['description']) || null,
      };

      let id: string | undefined;
      if (code) {
        const byCode = await prisma.unit.findUnique({
          where: { code },
          select: { id: true },
        });
        id = byCode?.id;
      } else {
        const byNameCountry = await prisma.unit.findFirst({
          where: { name, countryId },
          select: { id: true },
        });
        id = byNameCountry?.id;
      }

      if (id) {
        if (!dryRun) await prisma.unit.update({ where: { id }, data });
        buf.push({
          id: dryRun ? `DRY-${name}-${code ?? ''}` : id!,
          code,
          name,
          parentCode: norm(r['parentcode']) || '',
          countryId,
        });
        result.updated.Units++;
      } else {
        if (!dryRun) {
          const created = await prisma.unit.create({
            data,
            select: { id: true },
          });
          buf.push({
            id: created.id,
            code,
            name,
            parentCode: norm(r['parentcode']) || '',
            countryId,
          });
        } else {
          buf.push({
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

    if (!dryRun) {
      for (const u of buf) {
        if (!u.parentCode) continue;
        let parentId = await getUnitIdByRef(u.parentCode, u.countryId);
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
    } else {
      const byCode = new Set(
        buf.filter((x) => x.code).map((x) => x.code as string)
      );
      const byName = new Set(buf.map((x) => x.name));
      for (const u of buf) {
        if (!u.parentCode) continue;
        if (!(byCode.has(u.parentCode) || byName.has(u.parentCode))) {
          result.errors.push(
            `Units (dry): parent might be missing (${u.parentCode}) for unit ${
              u.code || u.name
            }`
          );
        }
      }
    }
  }

  /* -------------------------------- Companies ----------------------------- */
  if (load.Companies) {
    for (let i = 0; i < companiesRows.length; i++) {
      const r = companiesRows[i];
      const name = norm(r['name']);
      if (!name) {
        result.errors.push(`[Companies row ${i + 2}] missing name`);
        continue;
      }
      const hqCountryId = await getCountryIdByRef(r['hqcountry']);
      const data = {
        name,
        website: norm(r['website']) || null,
        companyImage: norm(r['companyimage']) || null,
        description: norm(r['description']) || null,
        notes: norm(r['notes']) || null,
        hqCountryId: hqCountryId ?? null,
      };

      const existing = await prisma.company.findFirst({
        where: { name },
        select: { id: true },
      });
      if (existing) {
        if (!dryRun)
          await prisma.company.update({ where: { id: existing.id }, data });
        result.updated.Companies++;
      } else {
        if (!dryRun) await prisma.company.create({ data });
        result.created.Companies++;
      }
    }
  }

  if (load.CompanyOffices) {
    for (let i = 0; i < companyOfficesRows.length; i++) {
      const r = companyOfficesRows[i];
      const companyId = await getCompanyIdByName(r['company']);
      if (!companyId) {
        result.errors.push(
          `[CompanyOffices row ${i + 2}] company not found (${r['company']})`
        );
        continue;
      }
      const countryId = await getCountryIdByRef(r['country']);
      if (!countryId) {
        result.errors.push(
          `[CompanyOffices row ${i + 2}] country not found (${r['country']})`
        );
        continue;
      }
      const data = {
        companyId,
        countryId,
        city: norm(r['city']) || null,
        address: norm(r['address']) || null,
        latitude: asFloat(r['latitude']) ?? null,
        longitude: asFloat(r['longitude']) ?? null,
        description: norm(r['description']) || null,
      };

      const existing = await prisma.companyOffice.findFirst({
        where: {
          companyId,
          countryId,
          city: data.city ?? undefined,
          address: data.address ?? undefined,
        },
        select: { id: true },
      });

      if (existing) {
        if (!dryRun)
          await prisma.companyOffice.update({
            where: { id: existing.id },
            data,
          });
        result.updated.CompanyOffices++;
      } else {
        if (!dryRun) await prisma.companyOffice.create({ data });
        result.created.CompanyOffices++;
      }
    }
  }

  if (load.CompanyOrganizations) {
    for (let i = 0; i < companyOrganizationsRows.length; i++) {
      const r = companyOrganizationsRows[i];
      const companyId = await getCompanyIdByName(r['company']);
      const organizationId = await getOrganizationIdByRef(r['organization']);
      if (!companyId || !organizationId) {
        result.errors.push(
          `[CompanyOrganizations row ${i + 2}] missing company/org`
        );
        continue;
      }

      const data = {
        companyId,
        organizationId,
        role: norm(r['role']) || null,
        since: asDateOrNull(r['since']),
        until: asDateOrNull(r['until']),
        description: norm(r['description']) || null,
      };

      const existing = await prisma.companyOrganization.findUnique({
        where: { companyId_organizationId: { companyId, organizationId } },
        select: { companyId: true },
      });

      if (existing) {
        if (!dryRun)
          await prisma.companyOrganization.update({
            where: { companyId_organizationId: { companyId, organizationId } },
            data,
          });
        result.updated.CompanyOrganizations++;
      } else {
        if (!dryRun) await prisma.companyOrganization.create({ data });
        result.created.CompanyOrganizations++;
      }
    }
  }

  if (load.CountryOrganizations) {
    for (let i = 0; i < countryOrganizationsRows.length; i++) {
      const r = countryOrganizationsRows[i];
      const countryId = await getCountryIdByRef(r['country']);
      const organizationId = await getOrganizationIdByRef(r['organization']);
      if (!countryId || !organizationId) {
        result.errors.push(
          `[CountryOrganizations row ${i + 2}] missing country/org`
        );
        continue;
      }
      if (!dryRun) {
        await prisma.countryOrganization.upsert({
          where: {
            countryId_organizationId: { countryId, organizationId },
          } as any,
          create: { countryId, organizationId },
          update: {},
        });
      }
      result.updated.CountryOrganizations++;
    }
  }

  if (load.PersonOrganizations) {
    for (let i = 0; i < personOrganizationsRows.length; i++) {
      const r = personOrganizationsRows[i];
      const full = norm(r['person']);
      if (!full) {
        result.errors.push(`[PersonOrganizations row ${i + 2}] missing person`);
        continue;
      }
      const m = full.match(/^(.+?)\s+(.+?)(?:\s+\((.+)\))?$/);
      let personId: string | undefined;
      if (m) {
        const [fullname, firstName, lastName, countryRef] = m;
        const cid = countryRef
          ? await getCountryIdByRef(countryRef)
          : undefined;
        personId = await getPersonIdByName(
          fullname,
          firstName,
          lastName,
          cid,
          undefined
        );
      }
      const organizationId = await getOrganizationIdByRef(r['organization']);
      if (!personId || !organizationId) {
        result.errors.push(
          `[PersonOrganizations row ${i + 2}] person/org not found`
        );
        continue;
      }
      const data = {
        personId,
        organizationId,
        role: norm(r['role']) || null,
        since: asDateOrNull(r['since']),
        until: asDateOrNull(r['until']),
      };
      if (!dryRun) {
        await prisma.personOrganization.upsert({
          where: {
            personId_organizationId: { personId, organizationId },
          } as any,
          create: data,
          update: { role: data.role, since: data.since, until: data.until },
        });
      }
      result.updated.PersonOrganizations++;
    }
  }

  /* -------------------------------- Personnel ----------------------------- */
  if (load.Personnel) {
    for (let i = 0; i < personnelRows.length; i++) {
      const r = personnelRows[i];

      // αγνόησε τελείως άδειες σειρές
      if (isEmptyRow(r)) continue;

      const { firstName, lastName, hadAnyName } = extractName(r);

      if (!firstName || !lastName) {
        result.errors.push(
          `[Personnel row ${
            i + 2
          }] missing name (δώσε "person"/"fullname"/"name" ή "firstname"+"lastname")`
        );
        continue;
      }

      const type = enumFromStrict(PersonType, r['type']) ?? PersonType.MILITARY;
      const countryId = await getCountryIdByRef(r['country']);
      const branchId = await getBranchIdByRef(r['branch'], countryId);
      const rankId = await getRankIdByRef(r['rank']);

      const status =
        enumFromStrict(ServiceStatus, r['status']) ?? ServiceStatus.ACTIVE;
      const retiredYear = asIntOrNull(r['retiredyear']);
      const retiredAt =
        retiredYear && status === ServiceStatus.RETIRED
          ? new Date(Number(retiredYear), 0, 1)
          : null;

      const data = {
        firstName,
        lastName,
        type,
        email: norm(r['email']) || null,
        phone: norm(r['phone']) || null,
        classYear: norm(r['classyear']) || null,
        description: norm(r['description']) || null,
        personImagePaths: jsonFromCell(r['personimagepaths']),
        status,
        retiredAt,
        countryId: countryId ?? null,
        branchId: branchId ?? null,
        rankId: rankId ?? null,
        organizationId:
          (await getOrganizationIdByRef(r['organization'])) ?? null,
        companyId: (await getCompanyIdByName(r['company'])) ?? null,
        specialtyId: (await getSpecialtyIdByName(r['specialty'])) ?? null,
      };

      // Uniqueness: email > (first,last,country?,type)
      let existingId: string | undefined;
      if (data.email) {
        const byEmail = await prisma.person.findFirst({
          where: { email: data.email },
          select: { id: true },
        });
        existingId = byEmail?.id;
      }
      if (!existingId) {
        const byName = await prisma.person.findFirst({
          where: {
            firstName,
            lastName,
            ...(countryId ? { countryId } : {}),
            type,
          },
          select: { id: true },
        });
        existingId = byName?.id;
      }

      if (existingId) {
        if (!dryRun)
          await prisma.person.update({ where: { id: existingId }, data });
        result.updated.Personnel++;
      } else {
        if (!dryRun) await prisma.person.create({ data });
        result.created.Personnel++;
      }
    }
  }

  /* -------------------------------- Promotions ---------------------------- */
  if (load.Promotions) {
    for (let i = 0; i < promotionsRows.length; i++) {
      const r = promotionsRows[i];
      const person = norm(r['person']);
      if (!person) {
        result.errors.push(`[Promotions row ${i + 2}] missing person`);
        continue;
      }
      const countryId = await getCountryIdByRef(r['country']);
      const personId = await getPersonIdByName(
        person,
        undefined,
        undefined,
        countryId,
        undefined
      );

      if (!personId) {
        result.errors.push(`[Promotions row ${i + 2}] person not found`);
        continue;
      }
      const rankId = await getRankIdByRef(r['rank']);
      if (!rankId) {
        result.errors.push(
          `[Promotions row ${i + 2}] rank not found (${r['rank']})`
        );
        continue;
      }
      const promotionYear = Number(r['promotionyear']);
      if (!Number.isInteger(promotionYear)) {
        result.errors.push(
          `[Promotions row ${i + 2}] invalid promotionYear (${
            r['promotionyear']
          })`
        );
        continue;
      }
      const data = {
        personId,
        rankId,
        promotionYear,
        description: norm(r['description']) || null,
      };
      const existing = await prisma.promotion.findFirst({
        where: { personId, rankId, promotionYear },
        select: { id: true },
      });
      if (existing) {
        if (!dryRun)
          await prisma.promotion.update({
            where: { id: existing.id },
            data: { description: data.description },
          });
        result.updated.Promotions++;
      } else {
        if (!dryRun) await prisma.promotion.create({ data });
        result.created.Promotions++;
      }
    }
  }

  /* ------------------------------ PersonPostings -------------------------- */
  if (load.PersonPostings) {
    for (let i = 0; i < postingsRows.length; i++) {
      const r = postingsRows[i];
      const person = norm(r['person']);
      if (!person) {
        result.errors.push(`[Promotions row ${i + 2}] missing person`);
        continue;
      }
      const countryId = await getCountryIdByRef(r['country']);
      const personId = await getPersonIdByName(
        person,
        undefined,
        undefined,
        countryId,
        undefined
      );
      if (!personId) {
        result.errors.push(`[PersonPostings row ${i + 2}] person not found`);
        continue;
      }

      const unitId = await getUnitIdByRef(r['unit']);
      const organizationId = await getOrganizationIdByRef(r['organization']);

      // Position
      let positionId: string | null = null;
      const posName = norm(r['position']);
      if (posName) {
        let pos = await prisma.position.findFirst({
          where: { name: posName },
          select: { id: true },
        });
        if (!pos && !dryRun) {
          pos = await prisma.position.create({
            data: { name: posName },
            select: { id: true },
          });
        }
        positionId = pos?.id ?? null;
        if (!positionId && dryRun) {
          result.errors.push(
            `[PersonPostings row ${i + 2}] position not found (${posName})`
          );
        }
      }

      // Rank at time
      let rankAtTimeId: string | null = null;
      const rankAtTimeRef = norm(r['rankattime']);
      if (rankAtTimeRef) {
        const rid = await getRankIdByRef(rankAtTimeRef);
        if (!rid) {
          result.errors.push(
            `[PersonPostings row ${
              i + 2
            }] rankAtTime not found (${rankAtTimeRef})`
          );
        } else {
          rankAtTimeId = rid;
        }
      }

      const type = enumFrom(PostingType, r['type']) ?? PostingType.TRANSFER;
      const role = norm(r['role']) || null;
      const orderNumber = norm(r['ordernumber']) || null;
      const orderDate = asDateOrNull(r['orderdate']);
      const startDate = asDateOrNull(r['startdate']);
      if (!startDate) {
        result.errors.push(`[PersonPostings row ${i + 2}] invalid startDate`);
        continue;
      }
      const endDate = asDateOrNull(r['enddate']);
      const installationYear = asIntOrNull(r['installationyear']);
      const description = norm(r['description']) || null;

      const data = {
        personId,
        unitId: unitId ?? null,
        organizationId: organizationId ?? null,
        countryId: countryId ?? null,
        type,
        positionId,
        role,
        rankAtTimeId,
        orderNumber,
        orderDate,
        startDate,
        endDate,
        installationYear,
        description,
      };

      // consider posting uniqueness on person + startDate (+ unit/org if given)
      const existing = await prisma.personPosting.findFirst({
        where: {
          personId,
          startDate,
          ...(unitId ? { unitId } : {}),
          ...(organizationId ? { organizationId } : {}),
        },
        select: { id: true },
      });

      if (existing) {
        if (!dryRun)
          await prisma.personPosting.update({
            where: { id: existing.id },
            data,
          });
        result.updated.PersonPostings++;
      } else {
        if (!dryRun) await prisma.personPosting.create({ data });
        result.created.PersonPostings++;
      }
    }
  }

  /* -------------------------------- Equipment ----------------------------- */
  if (load.Equipment) {
    for (let i = 0; i < equipmentRows.length; i++) {
      const r = equipmentRows[i];
      const name = norm(r['name']);
      if (!name) {
        result.errors.push(`[Equipment row ${i + 2}] missing name`);
        continue;
      }
      const model = norm(r['model']) || null;

      const category = enumFrom(EquipmentCategory, r['category']);
      if (!category) {
        result.errors.push(
          `[Equipment row ${i + 2}] invalid category (${r['category']})`
        );
        continue;
      }

      // manufacturer by company name
      let manufacturerCompanyId: string | null = null;
      const manufacturerName = norm(r['manufacturer']);
      if (manufacturerName) {
        const comp = await prisma.company.findFirst({
          where: { name: manufacturerName },
          select: { id: true },
        });
        if (!comp) {
          result.errors.push(
            `[Equipment row ${
              i + 2
            }] manufacturer not found (${manufacturerName})`
          );
        } else {
          manufacturerCompanyId = comp.id;
        }
      }

      // origin country
      let countryOfOriginId: string | null = null;
      if (norm(r['origincountry'])) {
        const cid = await getCountryIdByRef(r['origincountry']);
        if (!cid) {
          result.errors.push(
            `[Equipment row ${i + 2}] origin country not found (${
              r['origincountry']
            })`
          );
        } else {
          countryOfOriginId = cid;
        }
      }

      const data = {
        name,
        model,
        category,
        description: norm(r['description']) || null,
        manufacturerCompanyId,
        countryOfOriginId,
        equipmentImagePaths: jsonFromCell(r['equipmentimagepaths']),
        specs: jsonFromCell(r['specs']), // keep raw json string or null
      };

      const existing = await prisma.equipment.findFirst({
        where: { name, ...(model ? { model } : {}) },
        select: { id: true },
      });

      if (existing) {
        if (!dryRun)
          await prisma.equipment.update({ where: { id: existing.id }, data });
        result.updated.Equipment++;
      } else {
        if (!dryRun) await prisma.equipment.create({ data });
        result.created.Equipment++;
      }
    }
  }

  /* -------------------------- EquipmentAssignments ------------------------ */
  if (load.EquipmentAssignments) {
    for (let i = 0; i < equipmentAssignmentsRows.length; i++) {
      const r = equipmentAssignmentsRows[i];
      const eqName = norm(r['equipmentname']);
      if (!eqName) {
        result.errors.push(
          `[EquipmentAssignments row ${i + 2}] missing equipmentName`
        );
        continue;
      }
      const eqModel = norm(r['equipmentmodel']) || null;

      const equipment = await prisma.equipment.findFirst({
        where: { name: eqName, ...(eqModel ? { model: eqModel } : {}) },
        select: { id: true },
      });
      if (!equipment) {
        result.errors.push(
          `[EquipmentAssignments row ${i + 2}] equipment not found (${eqName}${
            eqModel ? ` ${eqModel}` : ''
          })`
        );
        continue;
      }

      const unitRef = norm(r['unit']);
      const unitId = await getUnitIdByRef(unitRef);
      if (!unitId) {
        result.errors.push(
          `[EquipmentAssignments row ${i + 2}] unit not found (${unitRef})`
        );
        continue;
      }

      const quantity = asIntOrNull(r['quantity']) ?? 1;
      const status =
        enumFrom(AssignmentStatus, r['status']) ?? AssignmentStatus.ACTIVE;
      const description = norm(r['description']) || null;

      const existing = await prisma.equipmentAssignment.findFirst({
        where: { unitId, equipmentId: equipment.id },
        select: { id: true },
      });

      const data = {
        unitId,
        equipmentId: equipment.id,
        quantity,
        status,
        description,
      };

      if (existing) {
        if (!dryRun)
          await prisma.equipmentAssignment.update({
            where: { id: existing.id },
            data,
          });
        result.updated.EquipmentAssignments++;
      } else {
        if (!dryRun) await prisma.equipmentAssignment.create({ data });
        result.created.EquipmentAssignments++;
      }
    }
  }

  /* -------------------------------- Meetings ------------------------------ */
  if (load.Meetings) {
    for (let i = 0; i < meetingsRows.length; i++) {
      const r = meetingsRows[i];
      const date = asDateOrNull(r['date']);
      if (!date) {
        result.errors.push(`[Meetings row ${i + 2}] invalid date`);
        continue;
      }
      const code = norm(r['code']) || null;
      const location = norm(r['location']) || null;
      const summary = norm(r['summary']) || null;
      const countryId = await getCountryIdByRef(r['country']);
      const organizationId = await getOrganizationIdByRef(r['organization']);

      const data = {
        date,
        location,
        summary,
        code,
        countryId: countryId ?? null,
        organizationId: organizationId ?? null,
        meetingImagePaths: jsonFromCell(r['meetingimagepaths']),
      };

      const existing = await prisma.meeting.findFirst({
        where: {
          date,
          ...(code ? { code } : {}),
          ...(location ? { location } : {}),
          ...(summary ? { summary } : {}),
        },
        select: { id: true },
      });

      if (existing) {
        if (!dryRun)
          await prisma.meeting.update({ where: { id: existing.id }, data });
        result.updated.Meetings++;
      } else {
        if (!dryRun) await prisma.meeting.create({ data });
        result.created.Meetings++;
      }
    }
  }

  /* ------------------------------ MeetingTopics --------------------------- */
  if (load.MeetingTopics) {
    for (let i = 0; i < meetingTopicsRows.length; i++) {
      const r = meetingTopicsRows[i];

      const meetingCode = norm(r['meetingCode']) || null;

      const meeting = await prisma.meeting.findFirst({
        where: { code: meetingCode },
        select: { id: true },
      });
      if (!meeting) {
        result.errors.push(`[MeetingTopics row ${i + 2}] meeting not found`);
        continue;
      }
      const name = norm(r['name']);
      const description = norm(r['description']) || null;

      const existing = await prisma.meetingTopic.findFirst({
        where: { meetingId: meeting.id, name },
        select: { id: true },
      });

      if (existing) {
        if (!dryRun)
          await prisma.meetingTopic.update({
            where: { id: existing.id },
            data: { description },
          });
        result.updated.MeetingTopics++;
      } else {
        if (!dryRun)
          await prisma.meetingTopic.create({
            data: { meetingId: meeting.id, name, description },
          });
        result.created.MeetingTopics++;
      }
    }
  }

  /* --------------------------- MeetingParticipants ------------------------ */
  if (load.MeetingParticipants) {
    for (let i = 0; i < meetingParticipantsRows.length; i++) {
      const r = meetingParticipantsRows[i];
      const meetingCode = norm(r['meetingCode']) || null;

      const meeting = await prisma.meeting.findFirst({
        where: { code: meetingCode },
        select: { id: true },
      });
      if (!meeting) {
        result.errors.push(
          `[MeetingParticipants row ${i + 2}] meeting not found`
        );
        continue;
      }

      const person = norm(r['person']);
      if (!person) {
        result.errors.push(`[MeetingParticipants row ${i + 2}] missing person`);
        continue;
      }

      const countryId = await getCountryIdByRef(r['country']);
      const personId = await getPersonIdByName(
        person,
        undefined,
        undefined,
        countryId,
        undefined
      );
      if (!personId) {
        result.errors.push(
          `[MeetingParticipants row ${i + 2}] person not found`
        );
        continue;
      }

      const role = norm(r['role']) || null;
      const description = norm(r['description']) || null;

      const existing = await prisma.meetingParticipant.findUnique({
        where: { meetingId_personId: { meetingId: meeting.id, personId } },
        select: { meetingId: true },
      });

      const data = { meetingId: meeting.id, personId, role, description };

      if (existing) {
        if (!dryRun)
          await prisma.meetingParticipant.update({
            where: { meetingId_personId: { meetingId: meeting.id, personId } },
            data: { role, description },
          });
        result.updated.MeetingParticipants++;
      } else {
        if (!dryRun) await prisma.meetingParticipant.create({ data });
        result.created.MeetingParticipants++;
      }
    }
  }

  /* ------------------------------- Finalize -------------------------------- */
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
    } catch {}

    try {
      await revalidateLookups(
        'regions',
        'countries',
        'branches',
        'ranks',
        'organizations',
        'units'
      );
      await revalidateSidebarCounts();
    } catch {}
  }

  return result;
}
