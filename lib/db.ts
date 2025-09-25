// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import fs from 'node:fs';

function toAbsoluteFileUrl(raw?: string) {
  const fallbackAbs = path.resolve(process.cwd(), 'data', 'mil.db');
  if (!raw) return `file:${fallbackAbs.replace(/\\/g, '/')}`;
  if (raw.startsWith('file:./') || raw.startsWith('file:../')) {
    const rel = raw.slice('file:'.length);
    const abs = path.resolve(process.cwd(), rel);
    return `file:${abs.replace(/\\/g, '/')}`;
  }
  return raw;
}
const finalUrl = toAbsoluteFileUrl(process.env.DATABASE_URL);

// ensure folder/file (dev/first run)
try {
  const absPath = finalUrl.replace(/^file:/, '');
  const dir = path.dirname(absPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(absPath)) fs.writeFileSync(absPath, '');
} catch {}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: { db: { url: finalUrl } },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

if (process.env.NODE_ENV === 'development') {
  console.log('Prisma using DATABASE_URL =', finalUrl);
}
