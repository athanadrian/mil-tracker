'use client';

import * as React from 'react';
import { Stat } from '@/components/common';
import { adminLinks, lookUpDataLinks } from '@/constants/links';
import { useCounts } from '@/providers/AdminDataProvider';
import type { AdminCounts, AdminLookupLink, AdminNavLink } from '@/types/nav';

// Τύποι που δέχεται το component
type LinksMode = 'admin' | 'tools';
type Links = ReadonlyArray<AdminNavLink> | ReadonlyArray<AdminLookupLink>;

// type-guard: έχει type;
function hasType(
  link: AdminNavLink | AdminLookupLink
): link is AdminLookupLink {
  return typeof (link as AdminLookupLink).type === 'string';
}

// Ετικέτες ομάδων
const TYPE_TITLES: Record<string, string> = {
  personnel: 'Προσωπικό',
  documents: 'Έγγραφα',
  application: 'Εφαρμογή',
};

const TYPE_ORDER = ['personnel', 'documents', 'application'];

interface Props {
  links: LinksMode; // 'admin' => adminLinks, 'tools' => lookUpDataLinks
}

const StatsContainer: React.FC<Props> = ({ links }) => {
  const linksData: Links = links === 'admin' ? adminLinks : lookUpDataLinks;
  const { counts } = useCounts(); // παρέχει AdminCounts

  // Υπολογισμός count με type-safety
  const getCount = (
    key: AdminNavLink['countKey'] | AdminLookupLink['countKey']
  ) => {
    if (!key) return '—';
    // key είναι keyof AdminCounts με βάση τους τύπους που όρισες
    return (counts as AdminCounts)[key as keyof AdminCounts] ?? '—';
  };

  // Αν ΚΑΠΟΙΟ link έχει type => ομαδοποίησε
  const anyHasType = linksData.some(hasType);

  if (!anyHasType) {
    // Ενιαίο grid (π.χ. για adminLinks)
    return (
      <div className='grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
        {linksData.map((item, idx) => {
          if (item.label === 'Πίνακας Ελέγχου') return null; // κρύψε Dashboard
          return (
            <Stat
              key={idx}
              icon={item.icon}
              label={item.label}
              value={getCount(item.countKey)}
              href={item.href}
            />
          );
        })}
      </div>
    );
  }

  // Ομαδοποίηση για lookUpDataLinks
  const groups = React.useMemo(() => {
    const map = new Map<string, AdminLookupLink[]>();
    for (const link of linksData) {
      if (hasType(link)) {
        const arr = map.get(link.type) ?? [];
        arr.push(link);
        map.set(link.type, arr);
      }
    }
    // Ταξινόμηση με βάση προτιμώμενη σειρά τύπων
    const orderedEntries = Array.from(map.entries()).sort((a, b) => {
      const ai = TYPE_ORDER.indexOf(a[0]);
      const bi = TYPE_ORDER.indexOf(b[0]);
      const aa = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
      const bb = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
      return aa - bb;
    });
    return orderedEntries;
  }, [linksData]);

  return (
    <div className='space-y-6'>
      {groups.map(([type, items]) => (
        <section key={type} className='space-y-3'>
          <h3 className='text-base font-semibold text-muted-foreground'>
            {TYPE_TITLES[type] ?? type}
          </h3>
          <div className='grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
            {items.map((item) => (
              <Stat
                key={item.value ?? item.label}
                icon={item.icon}
                label={item.label}
                value={getCount(item.countKey)}
                href={item.href}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default StatsContainer;
