'use server';

import 'server-only';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/db';
import {
  revalidateLookups,
  revalidateSidebarCounts,
} from '@/actions/common.actions';
import {
  OrganizationType,
  RankTier,
  UnitType,
  PersonType,
  ServiceStatus,
  EquipmentCategory,
  AssignmentStatus,
  PostingType,
} from '@prisma/client';

/* -------------------------------------------------------------------------- */
/*                                   WIPE DB                                  */
/* -------------------------------------------------------------------------- */

export type WipeResult = {
  ok: boolean;
  deleted: Record<string, number>;
  error?: string;
};

/** Σβήνει ΟΛΑ τα δεδομένα με σωστή σειρά (respect FKs) */
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

      // People-related
      deleted.PersonOrganizations = (
        await db.personOrganization.deleteMany({})
      ).count;
      deleted.PersonPostings = (await db.personPosting.deleteMany({})).count;
      deleted.Promotions = (await db.promotion.deleteMany({})).count;
      deleted.People = (await db.person.deleteMany({})).count;

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

      // Core lookups (order matters due to FKs)
      deleted.Units = (await db.unit.deleteMany({})).count;
      deleted.Organizations = (await db.organization.deleteMany({})).count;
      deleted.Specialties = (await db.specialty.deleteMany({})).count;
      deleted.Ranks = (await db.rank.deleteMany({})).count;
      deleted.ServiceBranch = (await db.serviceBranch.deleteMany({})).count;
      deleted.Companies = (await db.company.deleteMany({})).count;

      // Countries/Regions last
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
/*                               IMPORT + PREFLIGHT                           */
/* -------------------------------------------------------------------------- */

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
  EquipmentAssignments: 'EquipmentAssignments',
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

const enumFromStrict = enumFrom;

function asDateOrNull(v?: any) {
  const s = norm(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

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
  // Κατεβάζουμε τα headers σε lower για σταθερότητα (π.χ. ParentCode → parentcode)
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
  const byCode = await prisma.rank.findUnique({
    where: { code: raw },
    select: { id: true },
  });
  if (byCode?.id) return byCode.id;
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
  firstName?: string,
  lastName?: string,
  countryId?: string,
  type?: any
) {
  const fn = norm(firstName);
  const ln = norm(lastName);
  if (!fn || !ln) return undefined;
  const p = await prisma.person.findFirst({
    where: {
      firstName: fn,
      lastName: ln,
      ...(countryId ? { countryId } : {}),
      ...(type ? { type } : {}),
    },
    select: { id: true },
  });
  return p?.id;
}

/* -------------------------------------------------------------------------- */
/*                              PREFLIGHT VALIDATOR                           */
/* -------------------------------------------------------------------------- */

export type PreflightReport = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  info: Record<string, number>; // μετρήσεις ανά sheet
};

/** Διαβάζει όλα τα sheets και κάνει έλεγχο αναφορών/τιμών πριν το write-phase. */
export async function preflightXlsx(
  formData: FormData
): Promise<PreflightReport> {
  const file = formData.get('file') as File | null;
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: Record<string, number> = {};

  if (!file) return { ok: false, errors: ['No file uploaded'], warnings, info };

  // ΔΙΑΒΑΣΕ ΕΠΙΛΟΓΕΣ (όπως και στο importLookupsFromXlsx)
  const load = {
    Regions: readBool(formData, 'loadRegions', true),
    Countries: readBool(formData, 'loadCountries', true),
    Branches: readBool(formData, 'loadBranches', true),
    Ranks: readBool(formData, 'loadRanks', true),
    Organizations: readBool(formData, 'loadOrganizations', true),
    Units: readBool(formData, 'loadUnits', true),

    Personnel: readBool(formData, 'loadPersonnel', false),
    Equipment: readBool(formData, 'loadEquipment', false),
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
    EquipmentAssignments: readBool(formData, 'loadEquipmentAssignments', false),
  } as const;

  // Μέσα στην preflightXlsx, αμέσως μετά το:
  // const load = { ... } as const;

  function addDependencyHints(
    load: {
      Regions: boolean;
      Countries: boolean;
      Branches: boolean;
      Ranks: boolean;
      Organizations: boolean;
      Units: boolean;
      Personnel: boolean;
      Equipment: boolean;
      Companies: boolean;
      CompanyOffices: boolean;
      CompanyOrganizations: boolean;
      CountryOrganizations: boolean;
      PersonOrganizations: boolean;
      Specialties: boolean;
      Positions: boolean;
      Promotions: boolean;
      Meetings: boolean;
      MeetingTopics: boolean;
      MeetingParticipants: boolean;
      PersonPostings: boolean;
      EquipmentAssignments: boolean;
    },
    warnings: string[]
  ) {
    // Core lookups
    if (load.Branches && !load.Countries) {
      warnings.push(
        'Branches: Χωρίς το sheet Countries — οι αναφορές σε χώρα θα λυθούν από τη βάση (DB lookup).'
      );
    }
    if (load.Ranks && !load.Branches) {
      warnings.push(
        'Ranks: Χωρίς το sheet Branches — οι αναφορές σε κλάδο θα λυθούν από DB (ή θα μείνουν κενές αν δεν υπάρχουν).'
      );
    }
    if (load.Organizations && !load.Countries) {
      warnings.push(
        'Organizations: Χωρίς Countries — οι αναφορές σε χώρα θα λυθούν από DB (με κίνδυνο να μείνουν κενές).'
      );
    }
    if (load.Units) {
      if (!load.Countries)
        warnings.push(
          'Units: Χωρίς Countries — τα country refs θα αναζητηθούν από DB.'
        );
      if (!load.Branches)
        warnings.push(
          'Units: Χωρίς Branches — τα branch refs θα αναζητηθούν από DB.'
        );
    }

    // Companies
    if (load.CompanyOffices) {
      if (!load.Companies)
        warnings.push(
          'CompanyOffices: Χωρίς Companies — τα companies θα αναζητηθούν από DB.'
        );
      if (!load.Countries)
        warnings.push(
          'CompanyOffices: Χωρίς Countries — τα country refs θα αναζητηθούν από DB.'
        );
    }
    if (load.CompanyOrganizations) {
      if (!load.Companies)
        warnings.push(
          'CompanyOrganizations: Χωρίς Companies — τα companies θα αναζητηθούν από DB.'
        );
      if (!load.Organizations)
        warnings.push(
          'CompanyOrganizations: Χωρίς Organizations — τα organizations θα αναζητηθούν από DB.'
        );
    }
    if (load.CountryOrganizations) {
      if (!load.Countries)
        warnings.push(
          'CountryOrganizations: Χωρίς Countries — τα countries θα αναζητηθούν από DB.'
        );
      if (!load.Organizations)
        warnings.push(
          'CountryOrganizations: Χωρίς Organizations — τα organizations θα αναζητηθούν από DB.'
        );
    }

    // People + relations
    if (load.Personnel) {
      if (!load.Countries)
        warnings.push(
          'Personnel: Χωρίς Countries — τα country refs θα λυθούν από DB.'
        );
      if (!load.Branches)
        warnings.push(
          'Personnel: Χωρίς Branches — τα branch refs θα λυθούν από DB.'
        );
      if (!load.Ranks)
        warnings.push(
          'Personnel: Χωρίς Ranks — τα rank refs θα λυθούν από DB.'
        );
    }
    if (load.PersonOrganizations) {
      if (!load.Organizations)
        warnings.push(
          'PersonOrganizations: Χωρίς Organizations — τα organizations θα αναζητηθούν από DB.'
        );
      // Personnel μπορει να μην φορτώνεται τώρα, οπότε θα βρεθούν από DB με βάση το όνομα.
      if (!load.Personnel)
        warnings.push(
          'PersonOrganizations: Χωρίς Personnel — τα πρόσωπα θα αναζητηθούν από DB (με First/Last).'
        );
    }
    if (load.Promotions) {
      if (!load.Personnel)
        warnings.push(
          'Promotions: Χωρίς Personnel — τα πρόσωπα θα αναζητηθούν από DB.'
        );
      if (!load.Ranks)
        warnings.push(
          'Promotions: Χωρίς Ranks — τα ranks θα αναζητηθούν από DB.'
        );
    }
    if (load.PersonPostings) {
      if (!load.Personnel)
        warnings.push(
          'PersonPostings: Χωρίς Personnel — τα πρόσωπα θα αναζητηθούν από DB.'
        );
      if (!load.Units && !load.Organizations) {
        warnings.push(
          'PersonPostings: Χωρίς Units/Organizations — οι αναφορές σε unit/organization θα αναζητηθούν από DB.'
        );
      } else {
        if (!load.Units)
          warnings.push(
            'PersonPostings: Χωρίς Units — τα units θα αναζητηθούν από DB.'
          );
        if (!load.Organizations)
          warnings.push(
            'PersonPostings: Χωρίς Organizations — τα organizations θα αναζητηθούν από DB.'
          );
      }
      if (!load.Positions)
        warnings.push(
          'PersonPostings: Χωρίς Positions — τα positions θα αναζητηθούν από DB (ή θα λείπουν).'
        );
    }

    // Equipment
    if (load.EquipmentAssignments) {
      if (!load.Equipment)
        warnings.push(
          'EquipmentAssignments: Χωρίς Equipment — τα equipment θα αναζητηθούν από DB.'
        );
      if (!load.Units)
        warnings.push(
          'EquipmentAssignments: Χωρίς Units — τα units θα αναζητηθούν από DB.'
        );
    }

    // Meetings
    if (load.MeetingTopics && !load.Meetings) {
      warnings.push(
        'MeetingTopics: Χωρίς Meetings — τα meetings θα αναζητηθούν από DB (με βάση date/location).'
      );
    }
    if (load.MeetingParticipants) {
      if (!load.Meetings)
        warnings.push(
          'MeetingParticipants: Χωρίς Meetings — τα meetings θα αναζητηθούν από DB.'
        );
      if (!load.Personnel)
        warnings.push(
          'MeetingParticipants: Χωρίς Personnel — τα πρόσωπα θα αναζητηθούν από DB.'
        );
    }
  }

  // ΚΑΛΕΣΕ ΤΟ helper:
  addDependencyHints(load, warnings);

  // Αν δεν έχει επιλεγεί τίποτα, απλά επέστρεψε ΟΚ
  if (!Object.values(load).some(Boolean)) {
    return { ok: true, errors, warnings, info };
  }

  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: 'array' });

  // helper: διάβασε rows ΜΟΝΟ αν είναι τικαρισμένο
  const rowsIf = (flag: boolean, name: string) => {
    if (!flag) {
      info[name] = 0;
      return [] as any[];
    }
    const r = readRows(wb, name);
    info[name] = r.length;
    return r;
  };

  // Φόρτωσε ΜΟΝΟ τα επιλεγμένα
  const regions = rowsIf(load.Regions, SHEETS.Regions);
  const countries = rowsIf(load.Countries, SHEETS.Countries);
  const branches = rowsIf(load.Branches, SHEETS.Branches);
  const ranks = rowsIf(load.Ranks, SHEETS.Ranks);
  const orgs = rowsIf(load.Organizations, SHEETS.Organizations);
  const units = rowsIf(load.Units, SHEETS.Units);
  const companies = rowsIf(load.Companies, SHEETS.Companies);
  const companyOffices = rowsIf(load.CompanyOffices, SHEETS.CompanyOffices);
  const companyOrgs = rowsIf(
    load.CompanyOrganizations,
    SHEETS.CompanyOrganizations
  );
  const countryOrgs = rowsIf(
    load.CountryOrganizations,
    SHEETS.CountryOrganizations
  );
  const personOrgs = rowsIf(
    load.PersonOrganizations,
    SHEETS.PersonOrganizations
  );
  const specialties = rowsIf(load.Specialties, SHEETS.Specialties);
  const positions = rowsIf(load.Positions, SHEETS.Positions);
  const personnel = rowsIf(load.Personnel, SHEETS.Personnel);
  const promotions = rowsIf(load.Promotions, SHEETS.Promotions);
  const meetings = rowsIf(load.Meetings, SHEETS.Meetings);
  const meetingTopics = rowsIf(load.MeetingTopics, SHEETS.MeetingTopics);
  const meetingParticipants = rowsIf(
    load.MeetingParticipants,
    SHEETS.MeetingParticipants
  );
  const personPostings = rowsIf(load.PersonPostings, SHEETS.PersonPostings);
  const equipment = rowsIf(load.Equipment, SHEETS.Equipment);
  const equipmentAssigns = rowsIf(
    load.EquipmentAssignments,
    SHEETS.EquipmentAssignments
  );

  // In-file sets (μόνο από τα φορτωμένα)
  const regionSet = new Set(regions.map((r) => norm(r['name'])));
  const countryNameSet = new Set(countries.map((r) => norm(r['name'])));
  const countryIsoSet = new Set(countries.map((r) => toUpper(r['iso2'])));
  const orgCodeSet = new Set(orgs.map((r) => norm(r['code'])).filter(Boolean));
  const orgNameSet = new Set(orgs.map((r) => norm(r['name'])));
  const orgParentRefs = orgs.map((r) => norm(r['parent'])).filter(Boolean);
  const unitCodeSet = new Set(
    units.map((r) => norm(r['code'])).filter(Boolean)
  );
  const unitNameByCountry = new Set(
    units.map((r) => `${norm(r['name'])}__${toUpper(r['country'])}`)
  );
  const companyNameSet = new Set(companies.map((r) => norm(r['name'])));
  const positionNameSet = new Set(positions.map((r) => norm(r['name'])));
  const specialtyNameSet = new Set(specialties.map((r) => norm(r['name'])));

  // ===== VALIDATIONS ΜΟΝΟ ΓΙΑ ΕΠΙΛΕΓΜΕΝΑ =====

  if (load.Countries) {
    countries.forEach((r, i) => {
      const reg = norm(r['region']);
      if (reg && load.Regions && !regionSet.has(reg)) {
        warnings.push(
          `[Countries row ${
            i + 2
          }] region (${reg}) not found in file — will try DB.`
        );
      }
    });
  }

  if (load.Branches) {
    branches.forEach((r, i) => {
      const cref = norm(r['country']);
      if (!cref) errors.push(`[Branches row ${i + 2}] missing country`);
    });
  }

  if (load.Ranks) {
    ranks.forEach((r, i) => {
      const tier = toUpper(r['tier']);
      if (!tier || !(RankTier as any)[tier]) {
        errors.push(`[Ranks row ${i + 2}] invalid tier (${r['tier']})`);
      }
      const bref = norm(r['branch']);
      if (!bref)
        warnings.push(`[Ranks row ${i + 2}] empty branch (will allow null)`);
    });
  }

  if (load.Organizations) {
    orgs.forEach((r, i) => {
      const t = toUpper(r['type']);
      if (!t || !(OrganizationType as any)[t]) {
        errors.push(`[Organizations row ${i + 2}] invalid type (${r['type']})`);
      }
      const parent = norm(r['parent']);
      if (parent && !(orgCodeSet.has(parent) || orgNameSet.has(parent))) {
        warnings.push(
          `[Organizations row ${
            i + 2
          }] parent (${parent}) not in file — will try DB.`
        );
      }
    });
  }

  if (load.Units) {
    units.forEach((r, i) => {
      const type = toUpper(r['type']);
      if (!type || !(UnitType as any)[type]) {
        errors.push(`[Units row ${i + 2}] invalid type (${r['type']})`);
      }
      const cref = toUpper(r['country']);
      if (!cref) errors.push(`[Units row ${i + 2}] missing country`);
      const parentRef = norm(r['parentcode']);
      if (
        parentRef &&
        !(
          unitCodeSet.has(parentRef) ||
          unitNameByCountry.has(`${parentRef}__${cref}`)
        )
      ) {
        warnings.push(
          `[Units row ${
            i + 2
          }] parent (${parentRef}) not in file — will try DB.`
        );
      }
    });
  }

  if (load.Companies) {
    companies.forEach((r, i) => {
      const hq = norm(r['hqcountry']);
      if (
        hq &&
        load.Countries &&
        !(countryNameSet.has(hq) || countryIsoSet.has(toUpper(hq)))
      ) {
        warnings.push(
          `[Companies row ${
            i + 2
          }] HQ country (${hq}) not in file — will try DB.`
        );
      }
    });
  }

  if (load.CompanyOrganizations) {
    companyOrgs.forEach((r, i) => {
      if (load.Companies && !companyNameSet.has(norm(r['company']))) {
        warnings.push(
          `[CompanyOrganizations row ${
            i + 2
          }] company not in file — will try DB.`
        );
      }
      const orgRef = norm(r['organization']);
      if (
        orgRef &&
        load.Organizations &&
        !(orgCodeSet.has(orgRef) || orgNameSet.has(orgRef))
      ) {
        warnings.push(
          `[CompanyOrganizations row ${
            i + 2
          }] organization not in file — will try DB.`
        );
      }
    });
  }

  if (load.CountryOrganizations) {
    countryOrgs.forEach((r, i) => {
      const cref = norm(r['country']);
      if (
        load.Countries &&
        !(countryNameSet.has(cref) || countryIsoSet.has(toUpper(cref)))
      ) {
        warnings.push(
          `[CountryOrganizations row ${
            i + 2
          }] country not in file — will try DB.`
        );
      }
      const orgRef = norm(r['organization']);
      if (
        orgRef &&
        load.Organizations &&
        !(orgCodeSet.has(orgRef) || orgNameSet.has(orgRef))
      ) {
        warnings.push(
          `[CountryOrganizations row ${
            i + 2
          }] organization not in file — will try DB.`
        );
      }
    });
  }

  if (load.PersonOrganizations) {
    personOrgs.forEach((r, i) => {
      if (!norm(r['person']))
        errors.push(`[PersonOrganizations row ${i + 2}] missing person`);
      const orgRef = norm(r['organization']);
      if (
        orgRef &&
        load.Organizations &&
        !(orgCodeSet.has(orgRef) || orgNameSet.has(orgRef))
      ) {
        warnings.push(
          `[PersonOrganizations row ${
            i + 2
          }] organization not in file — will try DB.`
        );
      }
    });
  }

  if (load.Specialties) {
    specialties.forEach((r, i) => {
      const name = norm(r['name']);
      if (!name) errors.push(`[Specialties row ${i + 2}] missing name`);
    });
  }

  if (load.Positions) {
    positions.forEach((r, i) => {
      const name = norm(r['name']);
      if (!name) errors.push(`[Positions row ${i + 2}] missing name`);
    });
  }

  if (load.Personnel) {
    personnel.forEach((r, i) => {
      if (!norm(r['firstname']) || !norm(r['lastname'])) {
        errors.push(`[Personnel row ${i + 2}] missing firstName/lastName`);
      }
      const t = toUpper(r['type'] || 'MILITARY');
      if (!(PersonType as any)[t])
        errors.push(`[Personnel row ${i + 2}] invalid type (${r['type']})`);
      const s = toUpper(r['status'] || 'ACTIVE');
      if (!(ServiceStatus as any)[s])
        errors.push(`[Personnel row ${i + 2}] invalid status (${r['status']})`);
    });
  }

  if (load.Promotions) {
    promotions.forEach((r, i) => {
      if (!norm(r['firstname']) || !norm(r['lastname'])) {
        errors.push(`[Promotions row ${i + 2}] missing name`);
      }
      const year = Number(r['promotionyear']);
      if (!Number.isInteger(year))
        errors.push(`[Promotions row ${i + 2}] invalid promotionYear`);
    });
  }

  if (load.Meetings) {
    meetings.forEach((r, i) => {
      if (!norm(r['date'])) errors.push(`[Meetings row ${i + 2}] missing date`);
    });
  }

  if (load.MeetingTopics) {
    meetingTopics.forEach((r, i) => {
      if (!norm(r['date']) || !norm(r['name'])) {
        errors.push(`[MeetingTopics row ${i + 2}] missing date/name`);
      }
    });
  }

  if (load.MeetingParticipants) {
    meetingParticipants.forEach((r, i) => {
      if (!norm(r['date']) || !norm(r['firstname']) || !norm(r['lastname'])) {
        errors.push(`[MeetingParticipants row ${i + 2}] missing date/person`);
      }
    });
  }

  if (load.Equipment) {
    equipment.forEach((r, i) => {
      const c = toUpper(r['category']);
      if (!c || !(EquipmentCategory as any)[c]) {
        errors.push(
          `[Equipment row ${i + 2}] invalid category (${r['category']})`
        );
      }
    });
  }

  if (load.EquipmentAssignments) {
    equipmentAssigns.forEach((r, i) => {
      if (!norm(r['equipmentname'])) {
        errors.push(
          `[EquipmentAssignments row ${i + 2}] missing equipmentName`
        );
      }
      const s = toUpper(r['status'] || 'ACTIVE');
      if (!(AssignmentStatus as any)[s]) {
        errors.push(
          `[EquipmentAssignments row ${i + 2}] invalid status (${r['status']})`
        );
      }
    });
  }

  // Info: orphan org parents (μόνο αν Organizations)
  if (load.Organizations) {
    for (const p of orgParentRefs) {
      if (!(orgCodeSet.has(p) || orgNameSet.has(p))) {
        warnings.push(
          `[Organizations] parent "${p}" not present in file — will try DB.`
        );
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings, info };
}

/* -------------------------------------------------------------------------- */
/*                               IMPORT WRITE PHASE                           */
/* -------------------------------------------------------------------------- */

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
    EquipmentAssignments: readBool(formData, 'loadEquipmentAssignments', false),
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
      Companies: 0,
      CompanyOffices: 0,
      CompanyOrganizations: 0,
      CountryOrganizations: 0,
      PersonOrganizations: 0,
      Specialties: 0,
      Positions: 0,
      Promotions: 0,
      Meetings: 0,
      MeetingTopics: 0,
      MeetingParticipants: 0,
      PersonPostings: 0,
      EquipmentAssignments: 0,
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
      Companies: 0,
      CompanyOffices: 0,
      CompanyOrganizations: 0,
      CountryOrganizations: 0,
      PersonOrganizations: 0,
      Specialties: 0,
      Positions: 0,
      Promotions: 0,
      Meetings: 0,
      MeetingTopics: 0,
      MeetingParticipants: 0,
      PersonPostings: 0,
      EquipmentAssignments: 0,
    },
    errors: [],
    dryRun,
  };

  if (!file) {
    result.errors.push('No file uploaded');
    return result;
  }

  // Προληπτικό preflight όταν ΔΕΝ είναι dryRun
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

  const regionsRows = load.Regions ? readRows(wb, SHEETS.Regions) : [];
  const countriesRows = load.Countries ? readRows(wb, SHEETS.Countries) : [];
  const branchesRows = load.Branches ? readRows(wb, SHEETS.Branches) : [];
  const ranksRows = load.Ranks ? readRows(wb, SHEETS.Ranks) : [];
  const orgRows = load.Organizations ? readRows(wb, SHEETS.Organizations) : [];
  const unitRows = load.Units ? readRows(wb, SHEETS.Units) : [];
  const companiesRows = load.Companies ? readRows(wb, SHEETS.Companies) : [];
  const companyOfficesRows = load.CompanyOffices
    ? readRows(wb, SHEETS.CompanyOffices)
    : [];
  const companyOrganizationsRows = load.CompanyOrganizations
    ? readRows(wb, SHEETS.CompanyOrganizations)
    : [];
  const countryOrganizationsRows = load.CountryOrganizations
    ? readRows(wb, SHEETS.CountryOrganizations)
    : [];
  const personOrganizationsRows = load.PersonOrganizations
    ? readRows(wb, SHEETS.PersonOrganizations)
    : [];
  const specialtiesRows = load.Specialties
    ? readRows(wb, SHEETS.Specialties)
    : [];
  const positionsRows = load.Positions ? readRows(wb, SHEETS.Positions) : [];
  const personnelRows = load.Personnel ? readRows(wb, SHEETS.Personnel) : [];
  const promotionsRows = load.Promotions ? readRows(wb, SHEETS.Promotions) : [];
  const meetingsRows = load.Meetings ? readRows(wb, SHEETS.Meetings) : [];
  const meetingTopicsRows = load.MeetingTopics
    ? readRows(wb, SHEETS.MeetingTopics)
    : [];
  const meetingParticipantsRows = load.MeetingParticipants
    ? readRows(wb, SHEETS.MeetingParticipants)
    : [];
  const personPostingsRows = load.PersonPostings
    ? readRows(wb, SHEETS.PersonPostings)
    : [];
  const equipmentRows = load.Equipment ? readRows(wb, SHEETS.Equipment) : [];
  const equipmentAssignmentsRows = load.EquipmentAssignments
    ? readRows(wb, SHEETS.EquipmentAssignments)
    : [];

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
        if (!dryRun)
          await prisma.region.update({
            where: { id: existing.id },
            data: { code, description },
          });
        result.updated.Regions++;
      } else {
        if (!dryRun)
          await prisma.region.create({ data: { name, code, description } });
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
      if (regionName && !regionId)
        result.errors.push(
          `[Countries row ${i + 2}] region not found (${regionName})`
        );

      const existing = await prisma.country.findUnique({ where: { name } });
      if (existing) {
        if (!dryRun)
          await prisma.country.update({
            where: { id: existing.id },
            data: { iso2, regionId: regionId ?? null },
          });
        result.updated.Countries++;
      } else {
        if (!dryRun)
          await prisma.country.create({
            data: { name, iso2, regionId: regionId ?? null },
          });
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
        if (!dryRun)
          await prisma.serviceBranch.update({
            where: { id: existingId },
            data: { name, code, countryId },
          });
        result.updated.Branches++;
      } else {
        if (!dryRun)
          await prisma.serviceBranch.create({
            data: { name, code, countryId },
          });
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
        const byName = await prisma.rank.findFirst({
          where: { name, ...(branchId ? { branchId } : {}) },
          select: { id: true },
        });
        existingId = byName?.id;
      }

      const data = { name, code, tier, level, branchId: branchId ?? null };
      if (existingId) {
        if (!dryRun)
          await prisma.rank.update({ where: { id: existingId }, data });
        result.updated.Ranks++;
      } else {
        if (!dryRun) await prisma.rank.create({ data });
        result.created.Ranks++;
      }
    }
  }

  /* ----------------------------- Organizations ---------------------------- */
  if (load.Organizations) {
    type OrgBuf = { id: string; name: string; parentRef?: string | null };
    const orgBuffer: OrgBuf[] = [];

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

      const parentRef = norm(r['parent']) || null;

      const data = { name, code, type, countryId: countryId ?? null };
      if (existingId) {
        if (!dryRun)
          await prisma.organization.update({ where: { id: existingId }, data });
        orgBuffer.push({ id: existingId, name, parentRef });
        result.updated.Organizations++;
      } else {
        if (!dryRun) {
          const created = await prisma.organization.create({
            data,
            select: { id: true },
          });
          orgBuffer.push({ id: created.id, name, parentRef });
        } else {
          orgBuffer.push({ id: `DRY-${name}-${code ?? ''}`, name, parentRef });
        }
        result.created.Organizations++;
      }
    }

    // parent linking (+ warning σε dryRun αν λείπει)
    if (!dryRun) {
      for (const o of orgBuffer) {
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
      const names = new Set(orgBuffer.map((x) => x.name));
      for (const o of orgBuffer) {
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
    type UnitBufferRow = {
      id: string;
      code: string | null;
      name: string;
      parentCode: string;
      countryId?: string;
    };
    const unitBuffer: UnitBufferRow[] = [];

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
      const description = norm(r['description']) || null;

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
              description,
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
              description,
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

    // parent linking
    if (!dryRun) {
      for (const u of unitBuffer) {
        if (!u.parentCode) continue;
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
    } else {
      // Dry-run in-file sanity
      const byCode = new Set(
        unitBuffer.filter((x) => x.code).map((x) => x.code as string)
      );
      const byName = new Set(unitBuffer.map((x) => x.name));
      for (const u of unitBuffer) {
        if (!u.parentCode) continue;
        const ok = byCode.has(u.parentCode) || byName.has(u.parentCode);
        if (!ok) {
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
      const website = norm(r['website']) || null;
      const description = norm(r['description']) || null;
      const notes = norm(r['notes']) || null; // NEW
      const hqCountryId = await getCountryIdByRef(r['hqcountry']);
      if (r['hqcountry'] && !hqCountryId) {
        result.errors.push(
          `[Companies row ${i + 2}] hq country not found (${r['hqcountry']})`
        );
      }

      const existing = await prisma.company.findFirst({
        where: { name },
        select: { id: true },
      });
      const data = {
        name,
        website,
        description,
        notes,
        hqCountryId: hqCountryId ?? null,
      };
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
      const companyName = norm(r['company']);
      const companyId = await getCompanyIdByName(companyName);
      if (!companyId) {
        result.errors.push(
          `[CompanyOffices row ${i + 2}] company not found (${companyName})`
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

      const city = norm(r['city']) || null;
      const address = norm(r['address']) || null;
      const latitude = asFloat(r['latitude']) ?? null;
      const longitude = asFloat(r['longitude']) ?? null;
      const description = norm(r['description']) || null;

      const existing = await prisma.companyOffice.findFirst({
        where: {
          companyId,
          countryId,
          city: city ?? undefined,
          address: address ?? undefined,
        },
        select: { id: true },
      });

      if (existing) {
        if (!dryRun)
          await prisma.companyOffice.update({
            where: { id: existing.id },
            data: { city, address, latitude, longitude, description },
          });
        result.updated.CompanyOffices++;
      } else {
        if (!dryRun)
          await prisma.companyOffice.create({
            data: {
              companyId,
              countryId,
              city,
              address,
              latitude,
              longitude,
              description,
            },
          });
        result.created.CompanyOffices++;
      }
    }
  }

  if (load.CompanyOrganizations) {
    for (let i = 0; i < companyOrganizationsRows.length; i++) {
      const r = companyOrganizationsRows[i];
      const companyId = await getCompanyIdByName(r['company']);
      if (!companyId) {
        result.errors.push(
          `[CompanyOrganizations row ${i + 2}] company not found (${
            r['company']
          })`
        );
        continue;
      }

      const orgId = await getOrganizationIdByRef(r['organization']);
      if (!orgId) {
        result.errors.push(
          `[CompanyOrganizations row ${i + 2}] organization not found (${
            r['organization']
          })`
        );
        continue;
      }

      const role = norm(r['role']) || null;
      const since = asDateOrNull(r['since']);
      const until = asDateOrNull(r['until']);
      const description = norm(r['description']) || null;

      const existing = await prisma.companyOrganization.findUnique({
        where: {
          companyId_organizationId: { companyId, organizationId: orgId },
        },
        select: { companyId: true },
      });

      if (existing) {
        if (!dryRun) {
          await prisma.companyOrganization.update({
            where: {
              companyId_organizationId: { companyId, organizationId: orgId },
            },
            data: { role, since, until, description },
          });
        }
        result.updated.CompanyOrganizations++;
      } else {
        if (!dryRun) {
          await prisma.companyOrganization.create({
            data: {
              companyId,
              organizationId: orgId,
              role,
              since,
              until,
              description,
            },
          });
        }
        result.created.CompanyOrganizations++;
      }
    }
  }

  if (load.CountryOrganizations) {
    for (let i = 0; i < countryOrganizationsRows.length; i++) {
      const r = countryOrganizationsRows[i];
      const countryId = await getCountryIdByRef(r['country']);
      const orgId = await getOrganizationIdByRef(r['organization']);
      if (!countryId) {
        result.errors.push(
          `[CountryOrganizations row ${i + 2}] country not found (${
            r['country']
          })`
        );
        continue;
      }
      if (!orgId) {
        result.errors.push(
          `[CountryOrganizations row ${i + 2}] organization not found (${
            r['organization']
          })`
        );
        continue;
      }

      if (!dryRun) {
        await prisma.countryOrganization.upsert({
          where: {
            countryId_organizationId: { countryId, organizationId: orgId },
          } as any,
          create: { countryId, organizationId: orgId },
          update: {},
        });
      }
      result.updated.CountryOrganizations++;
    }
  }

  if (load.PersonOrganizations) {
    for (let i = 0; i < personOrganizationsRows.length; i++) {
      const r = personOrganizationsRows[i];
      const firstLast = norm(r['person']);
      if (!firstLast) {
        result.errors.push(`[PersonOrganizations row ${i + 2}] missing person`);
        continue;
      }
      // Υποστήριξη "First Last (CountryIsoOrName)" ή "First Last"
      const m = firstLast.match(/^(.+?)\s+(.+?)(?:\s+\((.+)\))?$/);
      let personId: string | undefined;
      if (m) {
        const [, firstName, lastName, countryRef] = m;
        const cid = countryRef
          ? await getCountryIdByRef(countryRef)
          : undefined;
        personId = await getPersonIdByName(firstName, lastName, cid, undefined);
      }
      if (!personId) {
        result.errors.push(
          `[PersonOrganizations row ${i + 2}] person not found (${firstLast})`
        );
        continue;
      }

      const orgId = await getOrganizationIdByRef(r['organization']);
      if (!orgId) {
        result.errors.push(
          `[PersonOrganizations row ${i + 2}] organization not found (${
            r['organization']
          })`
        );
        continue;
      }

      const role = norm(r['role']) || null;
      const since = asDateOrNull(r['since']);
      const until = asDateOrNull(r['until']);

      if (!dryRun) {
        await prisma.personOrganization.upsert({
          where: {
            personId_organizationId: { personId, organizationId: orgId },
          } as any,
          create: { personId, organizationId: orgId, role, since, until },
          update: { role, since, until },
        });
      }
      result.updated.PersonOrganizations++;
    }
  }

  /* -------------------------------- Personnel ----------------------------- */
  if (load.Personnel) {
    for (let i = 0; i < personnelRows.length; i++) {
      const r = personnelRows[i];
      const firstName = norm(r['firstname']);
      const lastName = norm(r['lastname']);
      if (!firstName || !lastName) {
        result.errors.push(
          `[Personnel row ${i + 2}] missing firstName/lastName`
        );
        continue;
      }

      const type = enumFromStrict(PersonType, r['type']) ?? PersonType.MILITARY;
      const email = norm(r['email']) || null;
      const phone = norm(r['phone']) || null;
      const description = norm(r['description']) || null;

      const countryId = await getCountryIdByRef(r['country']);
      const branchId = await getBranchIdByRef(r['branch'], countryId);
      const rankId = await getRankIdByRef(r['rank'], branchId);

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

      const status =
        enumFromStrict(ServiceStatus, r['status']) ?? ServiceStatus.ACTIVE;

      let retiredAt: Date | null = null;
      const retiredYear = asIntOrNull(r['retiredyear']);
      if (retiredYear && status === ServiceStatus.RETIRED)
        retiredAt = new Date(Number(retiredYear), 0, 1);

      try {
        let existingId: string | undefined;
        if (email) {
          const byEmail = await prisma.person.findFirst({
            where: { email },
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

        const data = {
          firstName,
          lastName,
          type,
          email,
          phone,
          description,
          countryId: countryId ?? null,
          branchId: branchId ?? null,
          rankId: rankId ?? null,
          status,
          retiredAt,
        };

        if (existingId) {
          if (!dryRun)
            await prisma.person.update({ where: { id: existingId }, data });
          result.updated.Personnel++;
        } else {
          if (!dryRun) await prisma.person.create({ data });
          result.created.Personnel++;
        }
      } catch (e: any) {
        result.errors.push(`[Personnel row ${i + 2}] ${(e && e.message) || e}`);
      }
    }
  }

  /* -------------------------------- Promotions ---------------------------- */
  if (load.Promotions) {
    for (let i = 0; i < promotionsRows.length; i++) {
      const r = promotionsRows[i];

      const firstName = norm(r['firstname']);
      const lastName = norm(r['lastname']);
      if (!firstName || !lastName) {
        result.errors.push(
          `[Promotions row ${i + 2}] missing firstname/lastname`
        );
        continue;
      }

      const countryId = await getCountryIdByRef(r['country']);
      const personId = await getPersonIdByName(
        firstName,
        lastName,
        countryId,
        undefined
      );
      if (!personId) {
        result.errors.push(`[Promotions row ${i + 2}] person not found`);
        continue;
      }

      const branchId = await getBranchIdByRef(r['branch'], countryId);
      const rankId = await getRankIdByRef(r['rank'], branchId);
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

      const description = norm(r['description']) || null;

      const existing = await prisma.promotion.findFirst({
        where: { personId, rankId, promotionYear },
        select: { id: true },
      });
      if (existing) {
        if (!dryRun)
          await prisma.promotion.update({
            where: { id: existing.id },
            data: { description },
          });
        result.updated.Promotions++;
      } else {
        if (!dryRun)
          await prisma.promotion.create({
            data: { personId, rankId, promotionYear, description },
          });
        result.created.Promotions++;
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
      const location = norm(r['location']) || null;
      const summary = norm(r['summary']) || null;
      const countryId = await getCountryIdByRef(r['country']);
      const organizationId = await getOrganizationIdByRef(r['organization']);

      const existing = await prisma.meeting.findFirst({
        where: {
          date,
          ...(location ? { location } : {}),
          ...(summary ? { summary } : {}),
        },
        select: { id: true },
      });

      const data = {
        date,
        location,
        summary,
        countryId: countryId ?? null,
        organizationId: organizationId ?? null,
      };

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

  if (load.MeetingTopics) {
    for (let i = 0; i < meetingTopicsRows.length; i++) {
      const r = meetingTopicsRows[i];
      const date = asDateOrNull(r['date']);
      const location = norm(r['location']) || null;
      const name = norm(r['name']);
      if (!date || !name) {
        result.errors.push(`[MeetingTopics row ${i + 2}] missing date/name`);
        continue;
      }

      const meeting = await prisma.meeting.findFirst({
        where: { date, ...(location ? { location } : {}) },
        select: { id: true },
      });
      if (!meeting) {
        result.errors.push(`[MeetingTopics row ${i + 2}] meeting not found`);
        continue;
      }

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

  if (load.MeetingParticipants) {
    for (let i = 0; i < meetingParticipantsRows.length; i++) {
      const r = meetingParticipantsRows[i];
      const date = asDateOrNull(r['date']);
      const location = norm(r['location']) || null;
      if (!date) {
        result.errors.push(`[MeetingParticipants row ${i + 2}] invalid date`);
        continue;
      }

      const meeting = await prisma.meeting.findFirst({
        where: { date, ...(location ? { location } : {}) },
        select: { id: true },
      });
      if (!meeting) {
        result.errors.push(
          `[MeetingParticipants row ${i + 2}] meeting not found`
        );
        continue;
      }

      const firstName = norm(r['firstname']);
      const lastName = norm(r['lastname']);
      if (!firstName || !lastName) {
        result.errors.push(
          `[MeetingParticipants row ${i + 2}] missing person name`
        );
        continue;
      }

      const countryId = await getCountryIdByRef(r['country']);
      const personId = await getPersonIdByName(
        firstName,
        lastName,
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

      if (existing) {
        if (!dryRun)
          await prisma.meetingParticipant.update({
            where: { meetingId_personId: { meetingId: meeting.id, personId } },
            data: { role, description },
          });
        result.updated.MeetingParticipants++;
      } else {
        if (!dryRun)
          await prisma.meetingParticipant.create({
            data: { meetingId: meeting.id, personId, role, description },
          });
        result.created.MeetingParticipants++;
      }
    }
  }

  /* ------------------------------ PersonPostings -------------------------- */
  if (load.PersonPostings) {
    for (let i = 0; i < personPostingsRows.length; i++) {
      const r = personPostingsRows[i];

      const firstName = norm(r['firstname']);
      const lastName = norm(r['lastname']);
      if (!firstName || !lastName) {
        result.errors.push(`[PersonPostings row ${i + 2}] missing person name`);
        continue;
      }

      const countryId = await getCountryIdByRef(r['country']);
      const personId = await getPersonIdByName(
        firstName,
        lastName,
        countryId,
        undefined
      );
      if (!personId) {
        result.errors.push(`[PersonPostings row ${i + 2}] person not found`);
        continue;
      }

      const unitId = await getUnitIdByRef(r['unit']);
      const organizationId = await getOrganizationIdByRef(r['organization']);

      const positionName = norm(r['position']) || null;
      let positionId: string | undefined;
      if (positionName) {
        const pos = await prisma.position.findFirst({
          where: { name: positionName },
          select: { id: true },
        });
        if (!pos)
          result.errors.push(
            `[PersonPostings row ${i + 2}] position not found (${positionName})`
          );
        else positionId = pos.id;
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
      const description = norm(r['description']) || null;

      const existing = await prisma.personPosting.findFirst({
        where: {
          personId,
          startDate,
          ...(unitId ? { unitId } : {}),
          ...(organizationId ? { organizationId } : {}),
        },
        select: { id: true },
      });

      const data = {
        personId,
        unitId: unitId ?? null,
        organizationId: organizationId ?? null,
        countryId: countryId ?? null,
        type,
        positionId: positionId ?? null,
        role,
        orderNumber,
        orderDate,
        startDate,
        endDate,
        description,
      };

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

      const manufacturerName = norm(r['manufacturer']);
      let manufacturerCompanyId: string | undefined;
      if (manufacturerName) {
        const comp = await prisma.company.findFirst({
          where: { name: manufacturerName },
          select: { id: true },
        });
        if (!comp) {
          result.errors.push(
            `[Equipment row ${
              i + 2
            }] manufacturer company not found (${manufacturerName})`
          );
        } else {
          manufacturerCompanyId = comp.id;
        }
      }

      const originCountryId = await getCountryIdByRef(r['origincountry']);
      if (r['origincountry'] && !originCountryId) {
        result.errors.push(
          `[Equipment row ${i + 2}] origin country not found (${
            r['origincountry']
          })`
        );
      }

      const description = norm(r['description']) || null;

      const existing = await prisma.equipment.findFirst({
        where: { name, ...(model ? { model } : {}) },
        select: { id: true },
      });

      let equipmentId: string;
      if (existing) {
        if (!dryRun) {
          await prisma.equipment.update({
            where: { id: existing.id },
            data: {
              name,
              model,
              category,
              manufacturerCompanyId: manufacturerCompanyId ?? null,
              countryOfOriginId: originCountryId ?? null,
              description,
            },
          });
        }
        equipmentId = existing.id;
        result.updated.Equipment++;
      } else {
        if (!dryRun) {
          const created = await prisma.equipment.create({
            data: {
              name,
              model,
              category,
              manufacturerCompanyId: manufacturerCompanyId ?? null,
              countryOfOriginId: originCountryId ?? null,
              description,
            },
            select: { id: true },
          });
          equipmentId = created.id;
        } else {
          equipmentId = `DRY-${name}-${model ?? ''}`;
        }
        result.created.Equipment++;
      }
    }
  }

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

      if (existing) {
        if (!dryRun) {
          await prisma.equipmentAssignment.update({
            where: { id: existing.id },
            data: { quantity, status, description },
          });
        }
        result.updated.EquipmentAssignments++;
      } else {
        if (!dryRun) {
          await prisma.equipmentAssignment.create({
            data: {
              unitId,
              equipmentId: equipment.id,
              quantity,
              status,
              description,
            },
          });
        }
        result.created.EquipmentAssignments++;
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
