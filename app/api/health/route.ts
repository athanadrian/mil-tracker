// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import os from 'node:os';
import fs from 'node:fs';

export const runtime = 'nodejs'; // για fs/os
export const dynamic = 'force-dynamic'; // χωρίς caching
export const revalidate = 0;

export async function GET() {
  const info: Record<string, any> = {
    now: new Date().toISOString(),
    platform: `${process.platform} ${os.release()}`,
    versions: process.versions,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      HOSTNAME: process.env.HOSTNAME,
      DATABASE_URL: process.env.DATABASE_URL,
    },
  };

  // Έλεγχος ύπαρξης DB αρχείου αν είναι file: URL
  try {
    const url = process.env.DATABASE_URL ?? '';
    if (url.startsWith('file:')) {
      const dbPath = url.replace(/^file:/, '');
      info.dbFilePath = dbPath;
      info.dbFileExists = fs.existsSync(dbPath);
    }
  } catch {}

  // Prisma ping
  try {
    await prisma.$queryRaw`SELECT 1`;
    info.prisma = 'ok';
  } catch (e: any) {
    info.prisma = `error: ${e?.message}`;
  }

  return NextResponse.json(info);
}
