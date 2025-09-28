'use client';
import * as React from 'react';

/**
 * Δημιουργεί generic store context με { state, setState } και αυστηρό error
 * αν χρησιμοποιηθεί χωρίς Provider.
 */
export function createStoreContext<T>(displayName: string) {
  type Ctx = { state: T; setState: React.Dispatch<React.SetStateAction<T>> };
  const Ctx = React.createContext<Ctx | undefined>(undefined);
  Ctx.displayName = displayName;

  function Provider({
    initial,
    children,
  }: {
    initial: T;
    children: React.ReactNode;
  }) {
    const [state, setState] = React.useState<T>(initial);
    const value = React.useMemo(() => ({ state, setState }), [state]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }

  function useStore() {
    const ctx = React.useContext(Ctx);
    if (!ctx)
      throw new Error(
        `${displayName} missing. Wrap with <${displayName}.Provider>.`
      );
    return ctx;
  }

  return { Provider, useStore };
}
