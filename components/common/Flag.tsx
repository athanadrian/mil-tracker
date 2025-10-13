import React from 'react';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import ImageWithFallback from './ImageWithFallback';

type Props = {
  flag?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  alt?: string;
};

const isWebUrl = (s: string) => /^(https?:|data:|blob:)/i.test(s);

function deriveSrc(flag?: string | null): string | null {
  if (!flag) return null;
  const v = flag.trim();
  if (!v) return null;
  if (isWebUrl(v) || v.startsWith('/')) return v; // http(s)/data/blob ή app-relative

  // Ήδη local;
  if (v.startsWith('local://')) return v;

  // Windows absolute: C:\...
  const m = /^([a-zA-Z]):[\\/](.*)$/.exec(v);
  if (m) {
    const drive = m[1].toUpperCase();
    const rest = m[2].replace(/\\/g, '/');
    return `local://${drive}/${encodeURI(rest)}`; // → local://C/Users/...
  }

  // Unix-like absolute (/Users/...)
  if (v.startsWith('/')) return `local://${encodeURI(v.replace(/^\/+/, ''))}`;

  // Άλλο: θεωρησέ το σχετικό μονοπάτι “μέσα” στην app
  return `local://${encodeURI(v.replace(/\\/g, '/'))}`;
}

const Flag: React.FC<Props> = ({
  flag,
  name,
  size = 30,
  className,
  alt = 'Σημαία',
}) => {
  const src = React.useMemo(() => deriveSrc(flag), [flag]);

  return (
    <ImageWithFallback
      src={src ?? ''}
      alt={alt}
      size={size}
      className={className}
      name={name ?? null}
    />
  );
};

export default Flag;
