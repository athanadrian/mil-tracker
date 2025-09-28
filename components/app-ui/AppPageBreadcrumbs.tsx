'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UrlObject } from 'url';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

type Linkish = string | UrlObject;
const toUrl = (href: Linkish): UrlObject =>
  typeof href === 'string' ? { pathname: href } : href;

type Loaders = Record<
  string,
  (id: string) => Promise<string | null | undefined>
>;

type AppPageBreadcrumbsProps = {
  /** Προαιρετικό αρχικό crumb (π.χ. Αρχική) */
  base?: { label: React.ReactNode; href?: Linkish };
  /**
   * Λεξικό label ανά segment (π.χ. { tools: 'Εργαλεία', units: 'Μονάδες' }).
   * Αν δεν υπάρχει entry, θα γίνει decode του segment.
   */
  segmentLabels?: Record<string, React.ReactNode>;
  /**
   * Προαιρετικοί loaders για δυναμικά ids.
   * Key = parent segment (π.χ. 'units'), value = async (id) => name
   */
  loaders?: Loaders;
  /** Απόκρυψη κάποιων segments από τα breadcrumbs (π.χ. ['tools']) */
  hideSegments?: string[];
  className?: string;
  /** Μεταφράσεις των actions */
  actionsMap?: Partial<
    Record<'add' | 'new' | 'edit' | 'view', React.ReactNode>
  >;
};

const DEFAULT_ACTIONS: Required<AppPageBreadcrumbsProps['actionsMap']> = {
  add: 'Προσθήκη',
  new: 'Προσθήκη',
  edit: 'Επεξεργασία',
  view: 'Προβολή',
};

const isAction = (s: string) =>
  s === 'add' || s === 'new' || s === 'edit' || s === 'view';
const isLikelyId = (s: string) => /^[a-f0-9-]{8,}$/i.test(s) || /^\d+$/.test(s); // cuid/uuid/numeric

const AppPageBreadcrumbs = ({
  base,
  segmentLabels = {},
  loaders,
  hideSegments = [],
  className,
  actionsMap = DEFAULT_ACTIONS,
}: AppPageBreadcrumbsProps): React.JSX.Element => {
  const pathname = usePathname(); // π.χ. "/tools/units/123/edit"
  const segments = React.useMemo(
    () => pathname.split('/').filter(Boolean),
    [pathname]
  );

  // Κρατάμε state για resolved labels (π.χ. ονόματα από loaders)
  const [resolved, setResolved] = React.useState<Record<string, string>>({});

  // Resolve δυναμικά ids όπου υπάρχει loader στον parent segment.
  React.useEffect(() => {
    if (!loaders) return;

    // Παίρνουμε όλα τα ζευγάρια [parent, child] όπου child μοιάζει με id
    const tasks: Array<Promise<void>> = [];
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const prev = segments[i - 1]; // parent segment (π.χ. 'units')
      if (!prev) continue;
      if (!isLikelyId(seg)) continue;
      const loader = loaders[prev];
      if (!loader) continue;

      // Μη ξαναφορτώνεις αν υπάρχει ήδη
      if (resolved[seg]) continue;

      tasks.push(
        loader(seg)
          .then((name) => {
            if (name) {
              setResolved((r) => ({ ...r, [seg]: name }));
            }
          })
          .catch(() => void 0)
      );
    }

    // fire & forget — δεν περιμένουμε κάπου
    if (tasks.length) Promise.allSettled(tasks).then(() => void 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.join('/'), loaders]);

  // Χτίζουμε τα crumbs
  type Crumb = { href: UrlObject; label: React.ReactNode; current: boolean };
  const crumbs: Crumb[] = [];

  // Προσθήκη base (π.χ. Αρχική)
  if (base?.label) {
    crumbs.push({
      href: toUrl(base.href ?? '/'),
      label: base.label,
      current: segments.length === 0,
    });
  }

  let accPath = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (hideSegments.includes(seg)) continue;

    accPath += `/${seg}`;
    const isLast = i === segments.length - 1;
    const prev = segments[i - 1];

    let label: React.ReactNode | undefined;

    // 1) action?
    if (isAction(seg)) {
      label = actionsMap[seg as keyof typeof actionsMap] ?? seg;
      crumbs.push({ href: toUrl(accPath), label, current: isLast });
      continue;
    }

    // 2) static label από dictionary;
    if (segmentLabels[seg]) {
      label = segmentLabels[seg];
    } else if (isLikelyId(seg) && prev && loaders?.[prev]) {
      // 3) dynamic id → resolved name (ή placeholder)
      label = resolved[seg] ?? '…';
    } else {
      // 4) fallback: humanize segment
      try {
        label = decodeURIComponent(seg).replace(/-/g, ' ');
      } catch {
        label = seg;
      }
    }

    crumbs.push({ href: toUrl(accPath), label, current: isLast });
  }

  // Rendering
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {crumbs.map((c, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <React.Fragment key={idx}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={c.href}>{c.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast ? <BreadcrumbSeparator /> : null}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
export default AppPageBreadcrumbs;
