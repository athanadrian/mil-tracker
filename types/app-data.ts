import { AdminCounts } from '@/types/nav';

export type AppData = {
  counts: AdminCounts;
  // for future use
  //   user?: { id: string; name: string } | null
  //   featureFlags?: Record<string, boolean>
  //   prefs?: { locale?: string; theme?: 'light' | 'dark' | 'system' }
};
