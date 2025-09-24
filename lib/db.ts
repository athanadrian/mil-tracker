import { PrismaClient } from '@prisma/client';

// Κρατάμε ένα singleton στον dev για να μη δημιουργούνται πολλαπλές συνδέσεις
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Λιγότερα logs σε prod, περισσότερα σε dev αν θέλεις
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    // (προαιρετικό) Αν θέλεις να “κλειδώσεις” datasource από env:
    // datasources: { db: { url: process.env.DATABASE_URL } },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
