'use client';
import * as React from 'react';
import { createStoreContext } from '@/lib/create-store-context';
import { AppData } from '@/types/app-data';

export const AppDataCtx = createStoreContext<AppData>('AppDataContext');

// Helpers για “slice” updates (προαιρετικά)
export function useAppData() {
  return AppDataCtx.useStore();
}
export function useCounts() {
  const { state, setState } = useAppData();
  return {
    counts: state.counts,
    setCounts: (next: Partial<AppData['counts']>) =>
      setState((s) => ({ ...s, counts: { ...s.counts, ...next } })),
  };
}
export function AppDataProvider({
  initial,
  children,
}: {
  initial: AppData;
  children: React.ReactNode;
}) {
  return (
    <AppDataCtx.Provider initial={initial}>{children}</AppDataCtx.Provider>
  );
}
