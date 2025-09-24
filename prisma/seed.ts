import { PrismaClient, EquipmentCategory } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const gr = await prisma.country.create({
    data: { name: 'Greece', iso2: 'GR' },
  });
  const nato = await prisma.organization.create({
    data: { name: 'NATO', type: 'MILITARY', countryId: gr.id },
  });

  const haicorp = await prisma.company.create({
    data: {
      name: 'Hellenic Aerospace Industry',
      hqCountryId: gr.id,
      website: 'https://www.hai.gr',
    },
  });

  await prisma.companyOrganization.create({
    data: { companyId: haicorp.id, organizationId: nato.id, role: 'Member' },
  });

  await prisma.companyOffice.create({
    data: { companyId: haicorp.id, countryId: gr.id, city: 'Tanagra' },
  });

  await prisma.equipment.create({
    data: {
      name: 'Trainer Jet X',
      category: EquipmentCategory.AIRCRAFT,
      manufacturerCompanyId: haicorp.id,
      countryOfOriginId: gr.id,
    },
  });

  console.log('Seed OK');
}

main().finally(() => prisma.$disconnect());
