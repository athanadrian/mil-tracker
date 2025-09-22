import { PrismaClient, RankTier } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  await db.country.createMany({
    data: [
      { name: 'Greece', iso2: 'GR' },
      { name: 'United States', iso2: 'US' },
    ],
    //skipDuplicates: true
  });
  await db.rank.createMany({
    data: [
      { name: 'Private', code: 'OR-1', tier: RankTier.ENLISTED, level: 1 },
      { name: 'Lieutenant', code: 'OF-1', tier: RankTier.OFFICER, level: 1 },
    ],
    //skipDuplicates: true
  });
  console.log('Seed done');
}
main().finally(() => db.$disconnect());
