// prisma/seed_personnel.ts
import {
  PrismaClient,
  PersonType,
  RankTier,
  UnitType,
  PostingType,
  ServiceStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function upsertRegion(name: string, code?: string, description?: string) {
  return prisma.region.upsert({
    where: { name },
    update: { code, description },
    create: { name, code, description },
  });
}

async function upsertCountry(name: string, iso2?: string, regionId?: string) {
  return prisma.country.upsert({
    where: { name },
    update: { iso2, regionId },
    create: { name, iso2, regionId },
  });
}

async function upsertBranch(countryId: string, name: string, code: string) {
  // ServiceBranch.code είναι unique
  return prisma.serviceBranch.upsert({
    where: { code },
    update: { name, countryId },
    create: { name, code, countryId },
  });
}

async function upsertRank(
  branchId: string | null,
  name: string,
  code: string, // unique
  tier: RankTier,
  level?: number,
  rankImage?: string
) {
  return prisma.rank.upsert({
    where: { code },
    update: { name, tier, level, rankImage, branchId: branchId || undefined },
    create: {
      name,
      code,
      tier,
      level,
      rankImage,
      branchId: branchId || undefined,
    },
  });
}

async function upsertSpecialty(
  branchId: string | null,
  name: string,
  code?: string,
  description?: string
) {
  return prisma.specialty.upsert({
    where: { name }, // name είναι unique
    update: { code, description, branchId: branchId || undefined },
    create: { name, code, description, branchId: branchId || undefined },
  });
}

async function upsertPosition(
  name: string,
  code?: string,
  description?: string
) {
  return prisma.position.upsert({
    where: { name }, // name unique
    update: { code, description },
    create: { name, code, description },
  });
}

async function upsertUnit(
  name: string,
  code: string, // unique
  type: UnitType,
  countryId: string,
  branchId?: string | null,
  parentId?: string | null,
  lat?: number | null,
  lon?: number | null
) {
  return prisma.unit.upsert({
    where: { code },
    update: {
      name,
      type,
      countryId,
      branchId: branchId || undefined,
      parentId: parentId || undefined,
      latitude: lat || undefined,
      longitude: lon || undefined,
    },
    create: {
      name,
      code,
      type,
      countryId,
      branchId: branchId || undefined,
      parentId: parentId || undefined,
      latitude: lat || undefined,
      longitude: lon || undefined,
    },
  });
}

async function findOrCreatePerson(opts: {
  firstName: string;
  lastName: string;
  nickname?: string;
  type: PersonType;
  countryId?: string | null;
  branchId?: string | null;
  specialtyId?: string | null;
  rankId?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  status?: ServiceStatus;
}) {
  // Δεν υπάρχει μοναδικό constraint στο άτομο, κάνουμε findFirst “λογικά”:
  const existing = await prisma.person.findFirst({
    where: {
      firstName: opts.firstName,
      lastName: opts.lastName,
      countryId: opts.countryId || undefined,
      type: opts.type,
    },
  });
  if (existing) return existing;

  return prisma.person.create({
    data: {
      firstName: opts.firstName,
      lastName: opts.lastName,
      nickname: opts.nickname,
      type: opts.type,
      countryId: opts.countryId || undefined,
      branchId: opts.branchId || undefined,
      specialtyId: opts.specialtyId || undefined,
      rankId: opts.rankId || undefined,
      email: opts.email || undefined,
      phone: opts.phone || undefined,
      notes: opts.notes || undefined,
      status: opts.status ?? ServiceStatus.ACTIVE,
    },
  });
}

async function createPromotion(
  personId: string,
  rankId: string,
  promotionYear: number
) {
  // Προστασία του UNIQUE (personId, rankId, promotionYear)
  try {
    return await prisma.promotion.create({
      data: { personId, rankId, promotionYear },
    });
  } catch {
    return prisma.promotion.findFirst({
      where: { personId, rankId, promotionYear },
    });
  }
}

async function createPosting(opts: {
  personId: string;
  unitId?: string | null;
  organizationId?: string | null;
  countryId?: string | null;
  positionId?: string | null;
  rankAtTimeId?: string | null;
  type?: PostingType;
  role?: string | null;
  orderNumber?: string | null;
  orderDate?: Date | null;
  startDate: Date;
  endDate?: Date | null;
  installationYear?: number | null;
  notes?: string | null;
}) {
  return prisma.personPosting.create({
    data: {
      personId: opts.personId,
      unitId: opts.unitId || undefined,
      organizationId: opts.organizationId || undefined,
      countryId: opts.countryId || undefined,
      positionId: opts.positionId || undefined,
      rankAtTimeId: opts.rankAtTimeId || undefined,
      type: opts.type ?? PostingType.TRANSFER,
      role: opts.role || undefined,
      orderNumber: opts.orderNumber || undefined,
      orderDate: opts.orderDate || undefined,
      startDate: opts.startDate,
      endDate: opts.endDate || undefined,
      installationYear: opts.installationYear || undefined,
      notes: opts.notes || undefined,
    },
  });
}

async function main() {
  // 1) Regions
  const europe = await upsertRegion('Europe', 'EU', 'European region');
  const americas = await upsertRegion(
    'Americas',
    'AM',
    'North & South America'
  );
  const middleEast = await upsertRegion(
    'Middle East',
    'ME',
    'Middle East region'
  );
  await upsertRegion('Balkans', 'BAL', 'Balkan region');
  await upsertRegion('Africa', 'AF', 'Africa');
  await upsertRegion('Asia', 'AS', 'Asia');
  await upsertRegion('Americas', 'AM', 'North & South America');
  await upsertRegion('Oceania', 'OC', 'Oceania');

  // 2) Countries
  const gr = await upsertCountry('Greece', 'GR', europe.id);
  const tr = await upsertCountry('Turkey', 'TR', europe.id);
  const us = await upsertCountry(
    'United States',
    'US',
    amerOrEurope(americas.id)
  ); // helper below

  // 3) Branches (Greece)
  const ha = await upsertBranch(gr.id, 'Hellenic Army', 'HA');
  const hn = await upsertBranch(gr.id, 'Hellenic Navy', 'HN');
  const haf = await upsertBranch(gr.id, 'Hellenic Air Force', 'HAF');

  // 4) Ranks (a few per Army)
  const rGen = await upsertRank(
    ha.id,
    'General',
    'HA-GEN',
    RankTier.OFFICER,
    10
  );
  const rCol = await upsertRank(
    ha.id,
    'Colonel',
    'HA-COL',
    RankTier.OFFICER,
    8
  );
  const rMaj = await upsertRank(ha.id, 'Major', 'HA-MAJ', RankTier.OFFICER, 6);
  const rSgt = await upsertRank(
    ha.id,
    'Sergeant',
    'HA-SGT',
    RankTier.ENLISTED,
    3
  );

  // 5) Specialties (Army)
  const spInf = await upsertSpecialty(
    ha.id,
    'Infantry',
    'INF',
    'Infantry branch'
  );
  const spArmor = await upsertSpecialty(
    ha.id,
    'Armor',
    'ARM',
    'Armored branch'
  );
  const spSignals = await upsertSpecialty(
    ha.id,
    'Signals',
    'SIG',
    'Signals branch'
  );

  // 6) Positions (generic)
  const posCmdr = await upsertPosition('Commander', 'CMD', 'Διοικητής');
  const posCoS = await upsertPosition('Chief of Staff', 'COS', 'Επιτελάρχης');
  const posPltLdr = await upsertPosition(
    'Platoon Leader',
    'PL',
    'Δκτής Διμοιρίας'
  );
  const posStaff = await upsertPosition(
    'Staff Officer',
    'SO',
    'Αξκος Επιτελείου'
  );

  // 7) Units (Greece, Army hierarchy)
  const uHq = await upsertUnit(
    'Army General Staff',
    'GR-HA-HQ',
    UnitType.HQ,
    gr.id,
    ha.id,
    null,
    37.975,
    23.735
  );
  const uDiv = await upsertUnit(
    '3rd Mech Infantry Division',
    'GR-HA-3MID',
    UnitType.FORMATION,
    gr.id,
    ha.id,
    uHq.id
  );
  const uBde = await upsertUnit(
    '5th Armored Brigade',
    'GR-HA-5AB',
    UnitType.UNIT,
    gr.id,
    ha.id,
    uDiv.id
  );
  const uBn = await upsertUnit(
    '21st Tank Battalion',
    'GR-HA-21TB',
    UnitType.SUBUNIT,
    gr.id,
    ha.id,
    uBde.id
  );

  // 8) People (MILITARY)
  const p1 = await findOrCreatePerson({
    firstName: 'Nikolaos',
    lastName: 'Papadopoulos',
    type: PersonType.MILITARY,
    countryId: gr.id,
    branchId: ha.id,
    specialtyId: spArmor.id,
    rankId: rMaj.id,
    email: 'n.papadopoulos@example.mil',
    phone: '+30 210 0000000',
    notes: 'Armor officer',
    status: ServiceStatus.ACTIVE,
  });

  const p2 = await findOrCreatePerson({
    firstName: 'Giorgos',
    lastName: 'Ioannou',
    type: PersonType.MILITARY,
    countryId: gr.id,
    branchId: ha.id,
    specialtyId: spInf.id,
    rankId: rSgt.id,
    email: 'g.ioannou@example.mil',
    status: ServiceStatus.ACTIVE,
  });

  // 9) Promotions (history)
  await createPromotion(p1.id, rMaj.id, 2020);
  await createPromotion(p1.id, rCol.id, 2024);

  // 10) Postings / Installations (history)
  // p1: Battalion Commander at 21st Tank Battalion
  await createPosting({
    personId: p1.id,
    unitId: uBn.id,
    positionId: posCmdr.id,
    rankAtTimeId: rMaj.id,
    type: PostingType.TRANSFER,
    startDate: new Date('2022-07-01'),
    endDate: new Date('2024-06-30'),
    installationYear: 2022,
    notes: 'Assumed command of 21st TB',
  });

  // p1: Brigade Staff Officer at 5th Armored Brigade
  await createPosting({
    personId: p1.id,
    unitId: uBde.id,
    positionId: posStaff.id,
    rankAtTimeId: rCol.id,
    type: PostingType.TRANSFER,
    startDate: new Date('2024-07-01'),
    installationYear: 2024,
    notes: 'Posted to Brigade HQ staff',
  });

  // p2: Platoon Leader at 21st Tank Battalion
  await createPosting({
    personId: p2.id,
    unitId: uBn.id,
    positionId: posPltLdr.id,
    rankAtTimeId: rSgt.id,
    type: PostingType.INITIAL,
    startDate: new Date('2023-09-01'),
    installationYear: 2023,
  });

  console.log('Seed (personnel core) — OK');
}

// Helper: pick an “Americas” region id if present, otherwise fallback to Europe
function amerOrEurope(europeId: string) {
  return europeId; // simple fallback; adjust if you add a separate Americas region earlier
}

async function usRegionId(europeId: string) {
  // If you seeded an 'Americas' region above, you can resolve it here, else fallback to Europe
  const amer = await prisma.region.findUnique({ where: { name: 'Americas' } });
  return amer?.id ?? europeId;
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
