// import React from 'react';
// import { AppIcon } from '@/components/app-ui';
// import { appIcons } from '@/constants/app-icons';

// type Props = {
//   flag?: string | null;
//   name?: string | null;
//   size?: number;
//   className?: string;
//   alt?: string;
// };

// const isWebUrl = (s: string) => /^(https?:|data:|blob:)/i.test(s);

// function deriveSrc(flag?: string | null): string | null {
//   if (!flag) return null;
//   const v = flag.trim();
//   if (!v) return null;
//   if (isWebUrl(v) || v.startsWith('/')) return v; // http(s)/data/blob ή app-relative

//   // Ήδη local;
//   if (v.startsWith('local://')) return v;

//   // Windows absolute: C:\...
//   const m = /^([a-zA-Z]):[\\/](.*)$/.exec(v);
//   if (m) {
//     const drive = m[1].toUpperCase();
//     const rest = m[2].replace(/\\/g, '/');
//     return `local://${drive}/${encodeURI(rest)}`; // → local://C/Users/...
//   }

//   // Unix-like absolute (/Users/...)
//   if (v.startsWith('/')) return `local://${encodeURI(v.replace(/^\/+/, ''))}`;

//   // Άλλο: θεωρησέ το σχετικό μονοπάτι “μέσα” στην app
//   return `local://${encodeURI(v.replace(/\\/g, '/'))}`;
// }

// const Flag: React.FC<Props> = ({
//   flag,
//   name,
//   size = 30,
//   className,
//   alt = 'Σημαία',
// }) => {
//   const src = React.useMemo(() => deriveSrc(flag), [flag]);

//   console.log('[Flag] flag =', flag, '→ src =', src);

//   if (!src) {
//     return (
//       <AppIcon
//         icon={appIcons.flag}
//         size={size}
//         className={className}
//         tooltipText={name ?? undefined}
//       />
//     );
//   }

//   return (
//     <img
//       src={src}
//       alt={alt}
//       width={size}
//       height={size}
//       className={className}
//       style={{ objectFit: 'cover' }}
//       onLoad={() => console.debug('[Flag] loaded:', src)}
//       onError={(e) => {
//         console.warn('[Flag] load failed for:', src, e);
//       }}
//     />
//   );
// };
// export default Flag;

'use client';

import React from 'react';
import Image, { ImageLoaderProps } from 'next/image';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';

type Props = {
  flag?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  alt?: string;
};

const isHttpish = (s: string) => /^(https?:)/i.test(s);
const isDataOrBlob = (s: string) => /^(data:|blob:)/i.test(s);

/** Μετατρέπει input σε τελικό src που *μπορεί* να δουλέψει με next/image */
function deriveSrc(flag?: string | null): string | null {
  if (!flag) return null;
  const v = flag.trim();
  if (!v || v.toLowerCase() === 'null') return null;

  // ok: absolute http(s)
  if (isHttpish(v)) return v;

  // ok: data/blob (θα το περάσουμε unoptimized)
  if (isDataOrBlob(v)) return v;

  // ok: app-relative public asset
  if (v.startsWith('/')) return v;

  // Μη-υποστηριζόμενα (π.χ. local://, C:\...) → άφησέ τα να πέσουν στο fallback icon
  if (v.startsWith('local://')) return null;
  if (/^[a-zA-Z]:[\\/]/.test(v)) return null;

  // Τυχόν σχετικό μονοπάτι -> αντιμετώπισέ το ως public asset
  return `/${v.replace(/^\.?[\\/]/, '').replace(/\\/g, '/')}`;
}

// Loader που απλώς “επιστρέφει ό,τι του δώσεις”,
// ώστε να μην χρειάζεται domain allowlist για http/data/blob.
// Χρησιμοποιείται μόνο όπου χρειάζεται (unoptimized περιπτώσεις).
const passthroughLoader = ({ src }: ImageLoaderProps) => src;

const Flag: React.FC<Props> = ({
  flag,
  name,
  size = 30,
  className,
  alt = 'Σημαία',
}) => {
  const [failed, setFailed] = React.useState(false);
  const src = React.useMemo(() => deriveSrc(flag), [flag]);
  const label = name ?? alt;

  // Αν δεν υπάρχει καθόλου εμφανίσιμο src ή αν έχει αποτύχει το load → icon
  if (!src || failed) {
    return (
      <AppIcon
        icon={appIcons.flag}
        size={size}
        className={className}
        tooltipText={label || undefined}
      />
    );
  }

  // Για data:/blob: ή unknown domains, χρησιμοποίησε unoptimized + custom loader
  const needsPassthrough = isDataOrBlob(src) || isHttpish(src);

  return (
    <Image
      src={src}
      alt={label || 'flag'}
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'cover' }}
      onError={() => setFailed(true)}
      // Αν είναι http(s) εκτός επιτρεπόμενων domains ή data/blob, χρησιμοποίησε passthrough
      {...(needsPassthrough
        ? { loader: passthroughLoader, unoptimized: true }
        : {})}
      // Μικρή βελτίωση στο loading
      priority={false}
    />
  );
};

export default Flag;
